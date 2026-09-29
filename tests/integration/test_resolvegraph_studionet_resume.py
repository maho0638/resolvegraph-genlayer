"""Resume an interrupted ResolveGraph failure proof on an existing Studionet contract.

The canonical live proof uses deterministic, public, Studionet-only test identities so
an interrupted consensus transaction can be resumed without weakening contract auth.
This test never deploys a new contract.
"""

import hashlib
import os
import time
from pathlib import Path

import pytest
from genlayer_py import create_account
from gltest import get_contract_factory
from gltest.assertions import tx_execution_succeeded


_SECP256K1_N = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141
WORKFLOW_ID = "rg-live-failure-v1"
STEP_ID = "api-proof"


def _field(value, name):
    if isinstance(value, dict):
        return value.get(name)
    return getattr(value, name)


def _studionet_account(label: str):
    """Stable public test identity for Studionet only; never use with real value."""
    digest = hashlib.sha256(("resolvegraph-studionet-proof-v1:" + label).encode()).digest()
    key_int = (int.from_bytes(digest, "big") % (_SECP256K1_N - 1)) + 1
    return create_account("0x" + key_int.to_bytes(32, "big").hex())


def _print_state(contract, prefix: str):
    step = contract.get_step(args=[WORKFLOW_ID, STEP_ID]).call()
    workflow = contract.get_workflow(args=[WORKFLOW_ID]).call()
    print(prefix + "_STEP_STATUS=" + str(_field(step, "status")), flush=True)
    print(prefix + "_STEP_VERDICT=" + str(_field(step, "verdict")), flush=True)
    print(prefix + "_STEP_ROUND=" + str(_field(step, "resolution_round")), flush=True)
    print(prefix + "_STEP_CHALLENGES=" + str(_field(step, "challenge_count")), flush=True)
    print(prefix + "_WORKFLOW_STATUS=" + str(_field(workflow, "status")), flush=True)
    print(prefix + "_ATTRIBUTION_ROUND=" + str(_field(workflow, "attribution_round")), flush=True)
    print(prefix + "_ATTRIBUTION_CHALLENGES=" + str(_field(workflow, "attribution_challenge_count")), flush=True)
    return step, workflow


@pytest.mark.integration
def test_resume_resolvegraph_failure_lifecycle():
    address = os.environ.get("RESOLVEGRAPH_CONTRACT_ADDRESS", "").strip()
    assert address, "RESOLVEGRAPH_CONTRACT_ADDRESS is required for resume; this test never deploys"

    sponsor_account = _studionet_account("sponsor")
    agent_a = _studionet_account("agent-a")

    factory = get_contract_factory("ResolveGraph")
    contract = factory.build_contract(contract_address=address, account=sponsor_account)
    sponsor = contract.connect(account=sponsor_account)
    worker_a = contract.connect(account=agent_a)

    Path("artifacts").mkdir(parents=True, exist_ok=True)
    Path("artifacts/resolvegraph-live-address.txt").write_text(address, encoding="utf-8")
    print("RESOLVEGRAPH_RESUMED_CONTRACT=" + address, flush=True)
    print("RESOLVEGRAPH_RESUME_SPONSOR=" + str(sponsor_account.address), flush=True)
    print("RESOLVEGRAPH_RESUME_AGENT_A=" + str(agent_a.address), flush=True)

    step, workflow = _print_state(contract, "RG_RESUME_INITIAL")
    if str(_field(workflow, "status")) == "FAILED_SETTLED":
        print("RG_FAIL_FINAL_STATUS=FAILED_SETTLED", flush=True)
        return

    step_status = str(_field(step, "status"))
    step_round = int(_field(step, "resolution_round"))
    step_challenges = int(_field(step, "challenge_count"))

    if step_status in ("RESOLVED_FAIL", "RESOLVED_UNDETERMINED") and step_round == 1 and step_challenges == 0:
        tx = sponsor.challenge_step(
            args=[
                WORKFLOW_ID,
                STEP_ID,
                "https://www.rfc-editor.org/rfc/rfc2606",
                "Fresh standards evidence should confirm whether the claimed production API and SLA actually exist.",
            ]
        ).transact(wait_interval=10000, wait_retries=60)
        assert tx_execution_succeeded(tx)
        print("RG_RESUME_STEP_CHALLENGE_TX=" + str(tx.get("hash", "")), flush=True)
        step_status = "CHALLENGED"

    if step_status == "CHALLENGED":
        tx = sponsor.resolve_step_challenge(args=[WORKFLOW_ID, STEP_ID]).transact(
            consensus_max_rotations=4,
            wait_interval=10000,
            wait_retries=180,
        )
        assert tx_execution_succeeded(tx)
        print("RG_RESUME_STEP_RERESOLVE_TX=" + str(tx.get("hash", "")), flush=True)

    step, workflow = _print_state(contract, "RG_RESUME_AFTER_STEP")
    assert str(_field(step, "status")) in ("RESOLVED_FAIL", "RESOLVED_UNDETERMINED")
    assert int(_field(step, "resolution_round")) == 2

    if str(_field(workflow, "status")) == "ACTIVE":
        tx = sponsor.attribute_failure(args=[WORKFLOW_ID, STEP_ID]).transact(
            consensus_max_rotations=4,
            wait_interval=10000,
            wait_retries=180,
        )
        assert tx_execution_succeeded(tx)
        print("RG_RESUME_ATTRIBUTE_TX=" + str(tx.get("hash", "")), flush=True)

    _, workflow = _print_state(contract, "RG_RESUME_AFTER_ATTRIBUTION")
    workflow_status = str(_field(workflow, "status"))
    attribution_round = int(_field(workflow, "attribution_round"))
    attribution_challenges = int(_field(workflow, "attribution_challenge_count"))

    if workflow_status == "ATTRIBUTED" and attribution_round == 1 and attribution_challenges == 0:
        deadline = int(_field(workflow, "attribution_deadline"))
        assert int(time.time()) <= deadline, "Attribution challenge window closed before resume"
        tx = worker_a.challenge_attribution(
            args=[
                WORKFLOW_ID,
                "https://example.org",
                "Fresh independent example-domain evidence is supplied for a complete second attribution round.",
            ]
        ).transact(wait_interval=10000, wait_retries=60)
        assert tx_execution_succeeded(tx)
        print("RG_RESUME_ATTRIBUTION_CHALLENGE_TX=" + str(tx.get("hash", "")), flush=True)
        workflow_status = "ATTRIBUTION_CHALLENGED"

    if workflow_status == "ATTRIBUTION_CHALLENGED":
        tx = sponsor.resolve_attribution_challenge(args=[WORKFLOW_ID]).transact(
            consensus_max_rotations=4,
            wait_interval=10000,
            wait_retries=180,
        )
        assert tx_execution_succeeded(tx)
        print("RG_RESUME_ATTRIBUTION_RERESOLVE_TX=" + str(tx.get("hash", "")), flush=True)

    _, workflow = _print_state(contract, "RG_RESUME_AFTER_ATTRIBUTION_CHALLENGE")
    workflow_status = str(_field(workflow, "status"))
    if workflow_status == "ATTRIBUTED":
        assert int(_field(workflow, "attribution_round")) == 2
        assert contract.is_attribution_settlement_ready(args=[WORKFLOW_ID]).call() is True
        tx = sponsor.settle_failed_workflow(args=[WORKFLOW_ID]).transact(
            wait_interval=10000,
            wait_retries=60,
        )
        assert tx_execution_succeeded(tx)
        print("RG_RESUME_SETTLE_TX=" + str(tx.get("hash", "")), flush=True)

    settled = contract.get_workflow(args=[WORKFLOW_ID]).call()
    assert str(_field(settled, "status")) == "FAILED_SETTLED"
    print("RG_FAIL_FINAL_STATUS=FAILED_SETTLED", flush=True)
    print("RG_FAIL_FINAL_FAULT_CLASS=" + str(_field(settled, "fault_class")), flush=True)
    print("RG_FAIL_FINAL_FAULT_STEP=" + str(_field(settled, "fault_step_id")), flush=True)
    print("RG_FAIL_DECISION_HASH=" + str(_field(settled, "decision_hash")), flush=True)

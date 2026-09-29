"""Canonical live Studionet lifecycle for ResolveGraph.

This workflow is manual-only. It is intentionally not triggered on every push.
Run it only after direct tests, lint, SDK tests, and frontend production build pass.
"""

import hashlib
import time
from pathlib import Path

import pytest
from genlayer_py import create_account
from gltest import get_contract_factory
from gltest.assertions import tx_execution_succeeded


def _field(value, name):
    if isinstance(value, dict):
        return value.get(name)
    return getattr(value, name)


_SECP256K1_N = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141


def _studionet_account(label: str):
    """Stable public test identity for Studionet only; never use with real value."""
    digest = hashlib.sha256(("resolvegraph-studionet-proof-v1:" + label).encode()).digest()
    key_int = (int.from_bytes(digest, "big") % (_SECP256K1_N - 1)) + 1
    return create_account("0x" + key_int.to_bytes(32, "big").hex())


@pytest.mark.integration
def test_resolvegraph_success_and_failure_lifecycles():
    sponsor_account = _studionet_account("sponsor")
    agent_a = _studionet_account("agent-a")
    agent_b = _studionet_account("agent-b")
    print("RESOLVEGRAPH_TEST_IDENTITY_MODE=deterministic-public-studionet-only", flush=True)

    factory = get_contract_factory("ResolveGraph")
    contract = factory.deploy(
        account=sponsor_account,
        consensus_max_rotations=4,
    )

    print("RESOLVEGRAPH_CONTRACT=" + str(contract.address), flush=True)
    Path("artifacts").mkdir(parents=True, exist_ok=True)
    Path("artifacts/resolvegraph-live-address.txt").write_text(
        str(contract.address),
        encoding="utf-8",
    )
    print("RESOLVEGRAPH_SPONSOR=" + str(sponsor_account.address), flush=True)
    print("RESOLVEGRAPH_AGENT_A=" + str(agent_a.address), flush=True)
    print("RESOLVEGRAPH_AGENT_B=" + str(agent_b.address), flush=True)

    sponsor = contract.connect(account=sponsor_account)
    worker_a = contract.connect(account=agent_a)
    worker_b = contract.connect(account=agent_b)

    reward = 1_000_000_000_000
    bond = reward // 5
    now = int(time.time())

    # ------------------------------------------------------------------
    # SUCCESS PATH: two dependent agent commitments -> challenged -> PAID
    # ------------------------------------------------------------------
    workflow_id = "rg-live-success-v1"

    tx = sponsor.create_workflow(
        args=[
            workflow_id,
            "ResolveGraph live two-agent workflow",
            "Two agents must establish, with public independent evidence, the documented purpose of reserved example domains.",
        ]
    ).transact(wait_interval=10000, wait_retries=50)
    assert tx_execution_succeeded(tx)
    print("RG_SUCCESS_CREATE_TX=" + str(tx.get("hash", "")), flush=True)

    tx = sponsor.add_step(
        args=[
            workflow_id,
            "source-check",
            agent_a.address,
            "Source Agent",
            "eip155:1:0x0000000000000000000000000000000000000001#agent-1",
            "https://agent-a.example/.well-known/agent-card.json",
            "Provide public evidence that example.com is an example domain intended for documentation or illustrative examples.",
            "PASS only when the primary page and an independent public source both establish the documentation-example purpose.",
            "",
            "",
            now + 6 * 60 * 60,
        ]
    ).transact(value=reward, wait_interval=10000, wait_retries=50)
    assert tx_execution_succeeded(tx)
    print("RG_SUCCESS_ADD_STEP1_TX=" + str(tx.get("hash", "")), flush=True)

    tx = sponsor.add_step(
        args=[
            workflow_id,
            "standards-check",
            agent_b.address,
            "Standards Agent",
            "eip155:1:0x0000000000000000000000000000000000000001#agent-2",
            "https://agent-b.example/.well-known/agent-card.json",
            "Provide public evidence that reserved example domains are designated for documentation examples in internet standards and IANA guidance.",
            "PASS only when independent IANA and RFC evidence consistently supports the reserved documentation-example designation.",
            "source-check",
            "",
            now + 12 * 60 * 60,
        ]
    ).transact(value=reward, wait_interval=10000, wait_retries=50)
    assert tx_execution_succeeded(tx)
    print("RG_SUCCESS_ADD_STEP2_TX=" + str(tx.get("hash", "")), flush=True)

    tx = sponsor.seal_workflow(args=[workflow_id]).transact(
        wait_interval=10000,
        wait_retries=50,
    )
    assert tx_execution_succeeded(tx)
    print("RG_SUCCESS_SEAL_TX=" + str(tx.get("hash", "")), flush=True)

    tx = worker_a.accept_step(args=[workflow_id, "source-check"]).transact(
        value=bond,
        wait_interval=10000,
        wait_retries=50,
    )
    assert tx_execution_succeeded(tx)
    print("RG_SUCCESS_ACCEPT_STEP1_TX=" + str(tx.get("hash", "")), flush=True)

    tx = worker_b.accept_step(args=[workflow_id, "standards-check"]).transact(
        value=bond,
        wait_interval=10000,
        wait_retries=50,
    )
    assert tx_execution_succeeded(tx)
    print("RG_SUCCESS_ACCEPT_STEP2_TX=" + str(tx.get("hash", "")), flush=True)

    tx = worker_a.submit_evidence(
        args=[
            workflow_id,
            "source-check",
            "https://example.com",
            "https://www.iana.org/help/example-domains",
        ]
    ).transact(wait_interval=10000, wait_retries=50)
    assert tx_execution_succeeded(tx)
    print("RG_SUCCESS_SUBMIT_STEP1_TX=" + str(tx.get("hash", "")), flush=True)

    tx = sponsor.resolve_step(args=[workflow_id, "source-check"]).transact(
        consensus_max_rotations=4,
        wait_interval=10000,
        wait_retries=180,
    )
    assert tx_execution_succeeded(tx)
    print("RG_SUCCESS_RESOLVE_STEP1_TX=" + str(tx.get("hash", "")), flush=True)

    step1_initial = contract.get_step(args=[workflow_id, "source-check"]).call()
    print("RG_SUCCESS_STEP1_INITIAL_VERDICT=" + str(_field(step1_initial, "verdict")), flush=True)
    print("RG_SUCCESS_STEP1_INITIAL_SCORE=" + str(int(_field(step1_initial, "score"))), flush=True)
    assert str(_field(step1_initial, "verdict")) == "PASS"
    assert contract.is_step_settlement_ready(args=[workflow_id, "source-check"]).call() is False

    tx = sponsor.challenge_step(
        args=[
            workflow_id,
            "source-check",
            "https://www.rfc-editor.org/rfc/rfc2606",
            "Fresh standards evidence should be considered before the first reward can settle.",
        ]
    ).transact(wait_interval=10000, wait_retries=50)
    assert tx_execution_succeeded(tx)
    print("RG_SUCCESS_CHALLENGE_STEP1_TX=" + str(tx.get("hash", "")), flush=True)

    tx = sponsor.resolve_step_challenge(args=[workflow_id, "source-check"]).transact(
        consensus_max_rotations=4,
        wait_interval=10000,
        wait_retries=180,
    )
    assert tx_execution_succeeded(tx)
    print("RG_SUCCESS_RERESOLVE_STEP1_TX=" + str(tx.get("hash", "")), flush=True)

    step1_final = contract.get_step(args=[workflow_id, "source-check"]).call()
    assert str(_field(step1_final, "verdict")) == "PASS"
    assert int(_field(step1_final, "resolution_round")) == 2
    print("RG_SUCCESS_STEP1_FINAL_HASH=" + str(_field(step1_final, "decision_hash")), flush=True)

    tx = sponsor.settle_passed_step(args=[workflow_id, "source-check"]).transact(
        wait_interval=10000,
        wait_retries=50,
    )
    assert tx_execution_succeeded(tx)
    print("RG_SUCCESS_PAY_STEP1_TX=" + str(tx.get("hash", "")), flush=True)
    assert contract.is_step_unlocked(args=[workflow_id, "standards-check"]).call() is True

    tx = worker_b.submit_evidence(
        args=[
            workflow_id,
            "standards-check",
            "https://www.iana.org/help/example-domains",
            "https://www.rfc-editor.org/rfc/rfc2606",
        ]
    ).transact(wait_interval=10000, wait_retries=50)
    assert tx_execution_succeeded(tx)
    print("RG_SUCCESS_SUBMIT_STEP2_TX=" + str(tx.get("hash", "")), flush=True)

    tx = sponsor.resolve_step(args=[workflow_id, "standards-check"]).transact(
        consensus_max_rotations=4,
        wait_interval=10000,
        wait_retries=180,
    )
    assert tx_execution_succeeded(tx)
    print("RG_SUCCESS_RESOLVE_STEP2_TX=" + str(tx.get("hash", "")), flush=True)

    step2_initial = contract.get_step(args=[workflow_id, "standards-check"]).call()
    assert str(_field(step2_initial, "verdict")) == "PASS"

    tx = worker_b.challenge_step(
        args=[
            workflow_id,
            "standards-check",
            "https://example.com",
            "Fresh primary-domain evidence should be included in a second consensus round.",
        ]
    ).transact(wait_interval=10000, wait_retries=50)
    assert tx_execution_succeeded(tx)
    print("RG_SUCCESS_CHALLENGE_STEP2_TX=" + str(tx.get("hash", "")), flush=True)

    tx = sponsor.resolve_step_challenge(args=[workflow_id, "standards-check"]).transact(
        consensus_max_rotations=4,
        wait_interval=10000,
        wait_retries=180,
    )
    assert tx_execution_succeeded(tx)
    print("RG_SUCCESS_RERESOLVE_STEP2_TX=" + str(tx.get("hash", "")), flush=True)

    step2_final = contract.get_step(args=[workflow_id, "standards-check"]).call()
    assert str(_field(step2_final, "verdict")) == "PASS"

    tx = sponsor.settle_passed_step(args=[workflow_id, "standards-check"]).transact(
        wait_interval=10000,
        wait_retries=50,
    )
    assert tx_execution_succeeded(tx)
    print("RG_SUCCESS_PAY_STEP2_TX=" + str(tx.get("hash", "")), flush=True)

    tx = sponsor.complete_workflow(args=[workflow_id]).transact(
        wait_interval=10000,
        wait_retries=50,
    )
    assert tx_execution_succeeded(tx)
    print("RG_SUCCESS_COMPLETE_TX=" + str(tx.get("hash", "")), flush=True)

    completed = contract.get_workflow(args=[workflow_id]).call()
    assert str(_field(completed, "status")) == "COMPLETED"
    print("RG_SUCCESS_FINAL_STATUS=COMPLETED", flush=True)

    # ------------------------------------------------------------------
    # FAILURE PATH: false commitment -> challenge -> attribution -> settle
    # ------------------------------------------------------------------
    failed_workflow = "rg-live-failure-v1"

    tx = sponsor.create_workflow(
        args=[
            failed_workflow,
            "ResolveGraph live fault-attribution workflow",
            "An assigned participant claims that public example-domain evidence proves operation of a production payment API with a guaranteed SLA.",
        ]
    ).transact(wait_interval=10000, wait_retries=50)
    assert tx_execution_succeeded(tx)
    print("RG_FAIL_CREATE_TX=" + str(tx.get("hash", "")), flush=True)

    tx = sponsor.add_step(
        args=[
            failed_workflow,
            "api-proof",
            agent_a.address,
            "API Agent",
            "eip155:1:0x0000000000000000000000000000000000000001#agent-1",
            "https://agent-a.example/.well-known/agent-card.json",
            "Provide public evidence that example.com operates a production payment API with a published 99.999 percent service-level guarantee.",
            "PASS only if both independent sources explicitly establish the production payment API and the stated 99.999 percent service-level guarantee.",
            "",
            "",
            now + 12 * 60 * 60,
        ]
    ).transact(value=reward, wait_interval=10000, wait_retries=50)
    assert tx_execution_succeeded(tx)
    print("RG_FAIL_ADD_STEP_TX=" + str(tx.get("hash", "")), flush=True)

    tx = sponsor.seal_workflow(args=[failed_workflow]).transact(
        wait_interval=10000,
        wait_retries=50,
    )
    assert tx_execution_succeeded(tx)

    tx = worker_a.accept_step(args=[failed_workflow, "api-proof"]).transact(
        value=bond,
        wait_interval=10000,
        wait_retries=50,
    )
    assert tx_execution_succeeded(tx)

    tx = worker_a.submit_evidence(
        args=[
            failed_workflow,
            "api-proof",
            "https://example.com",
            "https://www.iana.org/help/example-domains",
        ]
    ).transact(wait_interval=10000, wait_retries=50)
    assert tx_execution_succeeded(tx)
    print("RG_FAIL_SUBMIT_TX=" + str(tx.get("hash", "")), flush=True)

    tx = sponsor.resolve_step(args=[failed_workflow, "api-proof"]).transact(
        consensus_max_rotations=4,
        wait_interval=10000,
        wait_retries=180,
    )
    assert tx_execution_succeeded(tx)
    print("RG_FAIL_RESOLVE_TX=" + str(tx.get("hash", "")), flush=True)

    failed_initial = contract.get_step(args=[failed_workflow, "api-proof"]).call()
    assert str(_field(failed_initial, "verdict")) != "PASS"
    print("RG_FAIL_INITIAL_VERDICT=" + str(_field(failed_initial, "verdict")), flush=True)

    tx = sponsor.challenge_step(
        args=[
            failed_workflow,
            "api-proof",
            "https://www.rfc-editor.org/rfc/rfc2606",
            "Fresh standards evidence should confirm whether the claimed production API and SLA actually exist.",
        ]
    ).transact(wait_interval=10000, wait_retries=50)
    assert tx_execution_succeeded(tx)

    tx = sponsor.resolve_step_challenge(args=[failed_workflow, "api-proof"]).transact(
        consensus_max_rotations=4,
        wait_interval=10000,
        wait_retries=180,
    )
    assert tx_execution_succeeded(tx)
    print("RG_FAIL_RERESOLVE_TX=" + str(tx.get("hash", "")), flush=True)

    failed_final = contract.get_step(args=[failed_workflow, "api-proof"]).call()
    assert str(_field(failed_final, "verdict")) != "PASS"

    tx = sponsor.attribute_failure(args=[failed_workflow, "api-proof"]).transact(
        consensus_max_rotations=4,
        wait_interval=10000,
        wait_retries=180,
    )
    assert tx_execution_succeeded(tx)
    print("RG_FAIL_ATTRIBUTE_TX=" + str(tx.get("hash", "")), flush=True)

    attribution = contract.get_workflow(args=[failed_workflow]).call()
    print("RG_FAIL_FAULT_CLASS=" + str(_field(attribution, "fault_class")), flush=True)
    print("RG_FAIL_FAULT_STEP=" + str(_field(attribution, "fault_step_id")), flush=True)
    print("RG_FAIL_FAULT_CONFIDENCE=" + str(int(_field(attribution, "fault_confidence"))), flush=True)

    tx = worker_a.challenge_attribution(
        args=[
            failed_workflow,
            "https://example.org",
            "Fresh independent example-domain evidence is supplied for a complete second attribution round.",
        ]
    ).transact(wait_interval=10000, wait_retries=50)
    assert tx_execution_succeeded(tx)
    print("RG_FAIL_ATTRIBUTION_CHALLENGE_TX=" + str(tx.get("hash", "")), flush=True)

    tx = sponsor.resolve_attribution_challenge(args=[failed_workflow]).transact(
        consensus_max_rotations=4,
        wait_interval=10000,
        wait_retries=180,
    )
    assert tx_execution_succeeded(tx)
    print("RG_FAIL_ATTRIBUTION_RERESOLVE_TX=" + str(tx.get("hash", "")), flush=True)

    attribution_final = contract.get_workflow(args=[failed_workflow]).call()
    assert int(_field(attribution_final, "attribution_round")) == 2
    assert contract.is_attribution_settlement_ready(args=[failed_workflow]).call() is True

    tx = sponsor.settle_failed_workflow(args=[failed_workflow]).transact(
        wait_interval=10000,
        wait_retries=60,
    )
    assert tx_execution_succeeded(tx)
    print("RG_FAIL_SETTLE_TX=" + str(tx.get("hash", "")), flush=True)

    settled = contract.get_workflow(args=[failed_workflow]).call()
    assert str(_field(settled, "status")) == "FAILED_SETTLED"
    print("RG_FAIL_FINAL_STATUS=FAILED_SETTLED", flush=True)
    print("RG_FAIL_FINAL_FAULT_CLASS=" + str(_field(settled, "fault_class")), flush=True)
    print("RG_FAIL_FINAL_FAULT_STEP=" + str(_field(settled, "fault_step_id")), flush=True)
    print("RG_FAIL_DECISION_HASH=" + str(_field(settled, "decision_hash")), flush=True)

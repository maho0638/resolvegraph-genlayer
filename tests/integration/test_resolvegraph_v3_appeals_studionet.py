"""Live Studionet proof for ResolveGraph V3 bounded bonded appeals."""

import hashlib
from pathlib import Path

import pytest
from genlayer_py import create_account
from gltest import get_contract_factory
from gltest.assertions import tx_execution_succeeded


_SECP256K1_N = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141


def _account(label: str):
    digest = hashlib.sha256(("resolvegraph-v3-appeal-proof:" + label).encode()).digest()
    key_int = (int.from_bytes(digest, "big") % (_SECP256K1_N - 1)) + 1
    return create_account("0x" + key_int.to_bytes(32, "big").hex())


def _field(value, name):
    if isinstance(value, dict):
        return value.get(name)
    return getattr(value, name)


@pytest.mark.integration
def test_resolvegraph_v3_bonded_step_appeal_on_studionet():
    sponsor_account = _account("sponsor")
    agent_account = _account("agent")

    factory = get_contract_factory("ResolveGraphV3")
    contract = factory.deploy(account=sponsor_account, consensus_max_rotations=4)
    sponsor = contract.connect(account=sponsor_account)
    agent = contract.connect(account=agent_account)

    Path("artifacts").mkdir(parents=True, exist_ok=True)
    Path("artifacts/resolvegraph-v3-live-address.txt").write_text(
        str(contract.address),
        encoding="utf-8",
    )
    print("RG_V3_CONTRACT=" + str(contract.address), flush=True)

    workflow_id = "rg-v3-live-appeal-v1"
    step_id = "example-domain-proof"
    reward = 1_000_000_000_000
    step_bond = reward // 5
    appeal_bond = reward // 20

    tx = sponsor.create_workflow(
        args=[
            workflow_id,
            "ResolveGraph V3 bounded appeal proof",
            (
                "Verify a documentation-domain commitment through public evidence, "
                "one bonded fresh-evidence appeal and explicit finalization."
            ),
        ]
    ).transact(wait_interval=10000, wait_retries=60)
    assert tx_execution_succeeded(tx)

    import time
    tx = sponsor.add_step(
        args=[
            workflow_id,
            step_id,
            agent_account.address,
            "Documentation verifier",
            "",
            "",
            (
                "Verify that example.com is the reserved Example Domain used for "
                "illustrative documentation rather than ordinary production use."
            ),
            (
                "PASS when the primary Example Domain page and independent IANA "
                "documentation establish that example.com is reserved for examples."
            ),
            "",
            "",
            int(time.time()) + 6 * 60 * 60,
        ]
    ).transact(value=reward, wait_interval=10000, wait_retries=60)
    assert tx_execution_succeeded(tx)

    tx = sponsor.seal_workflow(args=[workflow_id]).transact(
        wait_interval=10000, wait_retries=60
    )
    assert tx_execution_succeeded(tx)

    tx = agent.accept_step(args=[workflow_id, step_id]).transact(
        value=step_bond,
        wait_interval=10000,
        wait_retries=60,
    )
    assert tx_execution_succeeded(tx)

    tx = agent.submit_evidence(
        args=[
            workflow_id,
            step_id,
            "https://example.com",
            "https://www.iana.org/help/example-domains",
        ]
    ).transact(wait_interval=10000, wait_retries=60)
    assert tx_execution_succeeded(tx)

    tx = sponsor.resolve_step(args=[workflow_id, step_id]).transact(
        consensus_max_rotations=4,
        wait_interval=10000,
        wait_retries=180,
    )
    assert tx_execution_succeeded(tx)

    before = contract.get_step(args=[workflow_id, step_id]).call()
    assert int(_field(before, "resolution_round")) == 1
    assert int(contract.get_step_appeal_bond(args=[workflow_id, step_id]).call()) == appeal_bond
    first_decision = str(_field(before, "decision_hash"))
    print("RG_V3_INITIAL_VERDICT=" + str(_field(before, "verdict")), flush=True)
    print("RG_V3_INITIAL_DECISION=" + first_decision, flush=True)
    print("RG_V3_APPEAL_BOND=" + str(appeal_bond), flush=True)

    tx = sponsor.challenge_step(
        args=[
            workflow_id,
            step_id,
            "https://www.rfc-editor.org/rfc/rfc2606",
            (
                "RFC 2606 is fresh independent evidence for the one bounded appeal "
                "and should be evaluated before the step decision becomes final."
            ),
        ]
    ).transact(
        value=appeal_bond,
        wait_interval=10000,
        wait_retries=60,
    )
    assert tx_execution_succeeded(tx)

    challenged = contract.get_step(args=[workflow_id, step_id]).call()
    assert str(_field(challenged, "status")) == "CHALLENGED"
    assert int(_field(challenged, "challenge_bond_posted")) == appeal_bond

    tx = sponsor.resolve_step_challenge(args=[workflow_id, step_id]).transact(
        consensus_max_rotations=4,
        wait_interval=10000,
        wait_retries=180,
    )
    assert tx_execution_succeeded(tx)

    after = contract.get_step(args=[workflow_id, step_id]).call()
    assert int(_field(after, "resolution_round")) == 2
    assert int(_field(after, "challenge_count")) == 1
    assert str(_field(after, "decision_hash")) != first_decision

    tx = sponsor.finalize_step_decision(args=[workflow_id, step_id]).transact(
        wait_interval=10000,
        wait_retries=60,
    )
    assert tx_execution_succeeded(tx)

    final = contract.get_step(args=[workflow_id, step_id]).call()
    assert bool(_field(final, "decision_finalized")) is True
    assert bool(_field(final, "challenge_bond_settled")) is True
    assert int(_field(final, "decision_finalized_at")) > 0
    assert str(_field(final, "status")) in (
        "RESOLVED_PASS",
        "RESOLVED_FAIL",
        "RESOLVED_UNDETERMINED",
    )

    print("RG_V3_FINAL_VERDICT=" + str(_field(final, "verdict")), flush=True)
    print(
        "RG_V3_APPEAL_OUTCOME_CHANGED=" +
        str(bool(_field(final, "challenge_outcome_changed"))).lower(),
        flush=True,
    )
    print("RG_V3_FINAL_DECISION=" + str(_field(final, "decision_hash")), flush=True)

    assert str(_field(final, "verdict")) == "PASS"
    tx = sponsor.settle_passed_step(args=[workflow_id, step_id]).transact(
        wait_interval=10000,
        wait_retries=60,
    )
    assert tx_execution_succeeded(tx)

    paid = contract.get_step(args=[workflow_id, step_id]).call()
    assert str(_field(paid, "status")) == "PAID"
    print("RG_V3_STEP_FINAL_STATUS=PAID", flush=True)

    tx = sponsor.complete_workflow(args=[workflow_id]).transact(
        wait_interval=10000,
        wait_retries=60,
    )
    assert tx_execution_succeeded(tx)
    completed = contract.get_workflow(args=[workflow_id]).call()
    assert str(_field(completed, "status")) == "COMPLETED"
    print("RG_V3_WORKFLOW_FINAL_STATUS=COMPLETED", flush=True)

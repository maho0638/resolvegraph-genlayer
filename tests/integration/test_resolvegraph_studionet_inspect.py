"""Read-only inspection of the canonical ResolveGraph Studionet deployment.

This test MUST NOT submit transactions or deploy contracts. It is used to resume
an interrupted live proof safely by observing the already-recorded transaction
and contract state.
"""

from pathlib import Path

import pytest
from gltest import get_contract_factory


CONTRACT_ADDRESS = "0x881665b7331CcE0a2f66A01aF14BB7CA14464FF0"
TX_HASH = "0x2e18f088dc023d718924ece2eb9165e0738e1a7ffaaf61719ba67628568f3c51"
WORKFLOW_ID = "rg-live-failure-v1"
STEP_ID = "api-proof"


def _field(value, name):
    if isinstance(value, dict):
        return value.get(name)
    return getattr(value, name)


@pytest.mark.integration
def test_inspect_existing_resolvegraph_studionet_state(gl_client, default_account):
    tx = gl_client.get_transaction(transaction_hash=TX_HASH)
    print("RG_INSPECT_TX_HASH=" + TX_HASH, flush=True)
    print("RG_INSPECT_TX_STATUS=" + str(tx.get("status_name", tx.get("status", ""))), flush=True)
    print("RG_INSPECT_TX_RESULT=" + str(tx.get("result_name", "")), flush=True)
    print("RG_INSPECT_TX_ROUNDS=" + str(tx.get("num_of_rounds", "")), flush=True)
    print("RG_INSPECT_TX_LAST_ROUND=" + str(tx.get("last_round", "")), flush=True)

    try:
        rpc_status = gl_client.provider.make_request(
            method="gen_getTransactionStatus",
            params=[{"txId": TX_HASH}],
        )
        print("RG_INSPECT_RPC_STATUS=" + str(rpc_status), flush=True)
    except Exception as exc:
        print("RG_INSPECT_RPC_STATUS_UNAVAILABLE=" + repr(exc), flush=True)

    factory = get_contract_factory("ResolveGraph")
    contract = factory.build_contract(
        contract_address=CONTRACT_ADDRESS,
        account=default_account,
    )

    step = contract.get_step(args=[WORKFLOW_ID, STEP_ID]).call()
    workflow = contract.get_workflow(args=[WORKFLOW_ID]).call()

    print("RG_INSPECT_CONTRACT=" + CONTRACT_ADDRESS, flush=True)
    print("RG_INSPECT_STEP_STATUS=" + str(_field(step, "status")), flush=True)
    print("RG_INSPECT_STEP_VERDICT=" + str(_field(step, "verdict")), flush=True)
    print("RG_INSPECT_STEP_SCORE=" + str(_field(step, "score")), flush=True)
    print("RG_INSPECT_STEP_CONFIDENCE=" + str(_field(step, "confidence")), flush=True)
    print("RG_INSPECT_STEP_RESOLUTION_ROUND=" + str(_field(step, "resolution_round")), flush=True)
    print("RG_INSPECT_STEP_CHALLENGE_COUNT=" + str(_field(step, "challenge_count")), flush=True)
    print("RG_INSPECT_STEP_DECISION_HASH=" + str(_field(step, "decision_hash")), flush=True)
    print("RG_INSPECT_WORKFLOW_STATUS=" + str(_field(workflow, "status")), flush=True)
    print("RG_INSPECT_WORKFLOW_ATTRIBUTION_ROUND=" + str(_field(workflow, "attribution_round")), flush=True)
    print("RG_INSPECT_WORKFLOW_ATTRIBUTION_CHALLENGE_COUNT=" + str(_field(workflow, "attribution_challenge_count")), flush=True)
    print("RG_INSPECT_WORKFLOW_FAULT_CLASS=" + str(_field(workflow, "fault_class")), flush=True)
    print("RG_INSPECT_WORKFLOW_FAULT_STEP=" + str(_field(workflow, "fault_step_id")), flush=True)
    print("RG_INSPECT_WORKFLOW_FAULT_CONFIDENCE=" + str(_field(workflow, "fault_confidence")), flush=True)
    print("RG_INSPECT_WORKFLOW_DECISION_HASH=" + str(_field(workflow, "decision_hash")), flush=True)

    Path("artifacts").mkdir(parents=True, exist_ok=True)
    Path("artifacts/resolvegraph-live-address.txt").write_text(CONTRACT_ADDRESS, encoding="utf-8")

import json
from datetime import datetime, timedelta, timezone

import pytest


WORKFLOW_ID = "rg-attribution-boundary"
STEP_ID = "failed-delivery"
REWARD = 5000
BOND = 1000
OBJECTIVE = (
    "Exercise workflow fault attribution at the economic slashing boundary "
    "so validator-compatible confidence drift cannot change bond settlement."
)
REQUIREMENT = (
    "Publish a delivery artifact whose public evidence can be independently "
    "checked against the frozen workflow acceptance criteria."
)
RUBRIC = (
    "FAIL when the evidence contradicts the committed delivery and classify "
    "the direct failure source using the bounded ResolveGraph result fields."
)
PRIMARY = "https://deliverable.example/proof"
SUPPORT = "https://support.example/check"


@pytest.fixture(autouse=True)
def strict_direct_vm(direct_vm):
    direct_vm.strict_mocks = True
    direct_vm.check_pickling = True


def addr(account):
    return "0x" + account.hex()


def future_deadline(hours=24):
    return int((datetime.now(timezone.utc) + timedelta(hours=hours)).timestamp())


def mock_step_fail(direct_vm):
    direct_vm.clear_mocks()
    direct_vm.mock_web(
        r".*",
        {"status": 200, "body": "Controlled evidence for the failed step."},
    )
    direct_vm.mock_llm(
        r"(?s).*neutral step judge inside ResolveGraph.*",
        json.dumps(
            {
                "verdict": "FAIL",
                "score": 15,
                "confidence": 96,
                "reason_code": "CONTRADICTORY_EVIDENCE",
                "failure_class": "LOCAL",
                "causal_dependency": "",
                "rationale": "Controlled failed-step result.",
                "evidence_snapshot": "Primary evidence snapshot.",
                "support_snapshot": "Support evidence snapshot.",
            }
        ),
    )


def mock_attribution(direct_vm, confidence):
    direct_vm.clear_mocks()
    direct_vm.mock_web(
        r".*",
        {"status": 200, "body": "Controlled workflow attribution evidence."},
    )
    direct_vm.mock_llm(
        r"(?s).*workflow fault-attribution judge inside ResolveGraph.*",
        json.dumps(
            {
                "fault_step_id": STEP_ID,
                "fault_class": "PARTICIPANT",
                "fault_reason": "COMMITMENT_BREACH",
                "confidence": confidence,
                "rationale": "Controlled participant fault attribution.",
            }
        ),
    )


def prepare_failed_workflow(
    direct_vm,
    contract,
    sponsor,
    assignee,
    *,
    explicit_finalization,
):
    direct_vm.sender = sponsor
    contract.create_workflow(
        WORKFLOW_ID,
        "Attribution slash-boundary regression",
        OBJECTIVE,
    )

    direct_vm.value = REWARD
    contract.add_step(
        WORKFLOW_ID,
        STEP_ID,
        addr(assignee),
        "Delivery Agent",
        "",
        "",
        REQUIREMENT,
        RUBRIC,
        "",
        "",
        future_deadline(),
    )
    direct_vm.value = 0
    direct_vm.deal(contract.address, REWARD)
    contract.seal_workflow(WORKFLOW_ID)

    direct_vm.sender = assignee
    direct_vm.value = BOND
    contract.accept_step(WORKFLOW_ID, STEP_ID)
    direct_vm.value = 0
    direct_vm.deal(contract.address, REWARD + BOND)
    contract.submit_evidence(WORKFLOW_ID, STEP_ID, PRIMARY, SUPPORT)

    mock_step_fail(direct_vm)
    contract.resolve_step(WORKFLOW_ID, STEP_ID)

    direct_vm.warp(
        (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat()
    )
    if explicit_finalization:
        contract.finalize_step_decision(WORKFLOW_ID, STEP_ID)


@pytest.mark.parametrize(
    ("contract_path", "explicit_finalization"),
    [
        ("contracts/resolve_graph.py", False),
        ("contracts/resolve_graph_v2.py", False),
        ("contracts/resolve_graph_v3.py", True),
    ],
)
def test_validator_rejects_confidence_drift_across_slash_boundary(
    direct_vm,
    direct_deploy,
    direct_alice,
    direct_bob,
    contract_path,
    explicit_finalization,
):
    contract = direct_deploy(contract_path)
    prepare_failed_workflow(
        direct_vm,
        contract,
        direct_alice,
        direct_bob,
        explicit_finalization=explicit_finalization,
    )

    mock_attribution(direct_vm, 85)
    contract.attribute_failure(WORKFLOW_ID, STEP_ID)
    workflow = contract.get_workflow(WORKFLOW_ID)
    assert workflow.fault_class == "PARTICIPANT"
    assert int(workflow.fault_confidence) == 85

    # 85 and 75 are numerically within the old +/-10 validator tolerance,
    # but only 85 crosses the >=80 economic slashing threshold.
    mock_attribution(direct_vm, 75)
    assert direct_vm.run_validator() is False


@pytest.mark.parametrize(
    ("contract_path", "explicit_finalization"),
    [
        ("contracts/resolve_graph.py", False),
        ("contracts/resolve_graph_v2.py", False),
        ("contracts/resolve_graph_v3.py", True),
    ],
)
def test_validator_accepts_same_slash_outcome_confidence_drift(
    direct_vm,
    direct_deploy,
    direct_alice,
    direct_bob,
    contract_path,
    explicit_finalization,
):
    contract = direct_deploy(contract_path)
    prepare_failed_workflow(
        direct_vm,
        contract,
        direct_alice,
        direct_bob,
        explicit_finalization=explicit_finalization,
    )

    mock_attribution(direct_vm, 85)
    contract.attribute_failure(WORKFLOW_ID, STEP_ID)

    # Both 85 and 82 produce the same participant-bond slashing target.
    mock_attribution(direct_vm, 82)
    assert direct_vm.run_validator() is True

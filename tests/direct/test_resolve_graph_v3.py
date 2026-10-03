import json
from datetime import datetime, timedelta, timezone

import pytest


WORKFLOW_ID = "rg-v3-workflow"
STEP_ID = "delivery"
REWARD = 5000
STEP_BOND = 1000
APPEAL_BOND = 250
OBJECTIVE = (
    "Prove a bounded and bonded appeal policy for a dependency-aware "
    "ResolveGraph workflow without changing the canonical V1 deployment."
)
REQUIREMENT = (
    "Deliver the requested artifact and publish public evidence that the "
    "committed result satisfies the frozen acceptance criteria."
)
RUBRIC = (
    "PASS only when the primary evidence proves the requested result and an "
    "independent source materially corroborates the same commitment."
)
PRIMARY = "https://deliverable.example/proof"
SUPPORT = "https://support.example/check"
CHALLENGE = "https://challenge.example/counter"
ATTRIBUTION_CHALLENGE = "https://attribution.example/counter"


@pytest.fixture(autouse=True)
def strict_direct_vm(direct_vm):
    direct_vm.strict_mocks = True
    direct_vm.check_pickling = True


def addr(account):
    return "0x" + account.hex()


def future_deadline(hours=24):
    return int((datetime.now(timezone.utc) + timedelta(hours=hours)).timestamp())


def create_active(direct_vm, contract, sponsor, assignee):
    direct_vm.sender = sponsor
    contract.create_workflow(
        WORKFLOW_ID,
        "ResolveGraph V3 bonded appeal workflow",
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
    direct_vm.value = STEP_BOND
    contract.accept_step(WORKFLOW_ID, STEP_ID)
    direct_vm.value = 0
    direct_vm.deal(contract.address, REWARD + STEP_BOND)

    contract.submit_evidence(
        WORKFLOW_ID,
        STEP_ID,
        PRIMARY,
        SUPPORT,
    )


def mock_step(
    direct_vm,
    *,
    verdict="PASS",
    score=95,
    confidence=95,
    reason_code="REQUIREMENT_MET",
    failure_class="NONE",
    causal_dependency="",
):
    direct_vm.clear_mocks()
    direct_vm.mock_web(
        r".*",
        {
            "status": 200,
            "body": "Controlled public evidence for ResolveGraph V3 tests.",
        },
    )
    direct_vm.mock_llm(
        r"(?s).*neutral step judge inside ResolveGraph.*",
        json.dumps(
            {
                "verdict": verdict,
                "score": score,
                "confidence": confidence,
                "reason_code": reason_code,
                "failure_class": failure_class,
                "causal_dependency": causal_dependency,
                "rationale": "Controlled V3 step decision.",
                "evidence_snapshot": "Primary snapshot.",
                "support_snapshot": "Support snapshot.",
            }
        ),
    )


def mock_attribution(
    direct_vm,
    *,
    fault_step_id=STEP_ID,
    fault_class="PARTICIPANT",
    fault_reason="COMMITMENT_BREACH",
    confidence=95,
):
    direct_vm.clear_mocks()
    direct_vm.mock_web(
        r".*",
        {
            "status": 200,
            "body": "Controlled workflow evidence for V3 attribution.",
        },
    )
    direct_vm.mock_llm(
        r"(?s).*workflow fault-attribution judge inside ResolveGraph.*",
        json.dumps(
            {
                "fault_step_id": fault_step_id,
                "fault_class": fault_class,
                "fault_reason": fault_reason,
                "confidence": confidence,
                "rationale": "Controlled V3 attribution.",
            }
        ),
    )


def resolve_initial(direct_vm, contract, **kwargs):
    mock_step(direct_vm, **kwargs)
    contract.resolve_step(WORKFLOW_ID, STEP_ID)


def test_v3_policy_isolated(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = direct_deploy("contracts/resolve_graph_v3.py")
    create_active(direct_vm, contract, direct_alice, direct_bob)
    workflow = contract.get_workflow(WORKFLOW_ID)
    assert workflow.policy_version == "RG_V3_BOUNDED_APPEALS"
    assert int(contract.get_step_appeal_bond(WORKFLOW_ID, STEP_ID)) == APPEAL_BOND


def test_step_challenge_requires_exact_appeal_bond(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy("contracts/resolve_graph_v3.py")
    create_active(direct_vm, contract, direct_alice, direct_bob)
    resolve_initial(direct_vm, contract)

    direct_vm.sender = direct_alice
    direct_vm.value = APPEAL_BOND - 1
    with direct_vm.expect_revert("exact appeal bond"):
        contract.challenge_step(
            WORKFLOW_ID,
            STEP_ID,
            CHALLENGE,
            "Fresh evidence disputes the first-round decision.",
        )
    direct_vm.value = 0


def test_changed_step_appeal_refunds_bond_and_finalizes(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy("contracts/resolve_graph_v3.py")
    create_active(direct_vm, contract, direct_alice, direct_bob)
    resolve_initial(direct_vm, contract)

    direct_vm.sender = direct_alice
    direct_vm.value = APPEAL_BOND
    contract.challenge_step(
        WORKFLOW_ID,
        STEP_ID,
        CHALLENGE,
        "Fresh evidence materially disputes the first-round decision.",
    )
    direct_vm.value = 0

    mock_step(
        direct_vm,
        verdict="FAIL",
        score=20,
        confidence=96,
        reason_code="CONTRADICTORY_EVIDENCE",
        failure_class="LOCAL",
    )
    contract.resolve_step_challenge(WORKFLOW_ID, STEP_ID)
    returned = contract.finalize_step_decision(WORKFLOW_ID, STEP_ID)

    step = contract.get_step(WORKFLOW_ID, STEP_ID)
    assert int(returned) == APPEAL_BOND
    assert step.challenge_bond_settled is True
    assert step.challenge_outcome_changed is True
    assert step.decision_finalized is True
    assert int(step.decision_finalized_at) > 0


def test_unchanged_step_appeal_forfeits_bond_to_counterparty(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy("contracts/resolve_graph_v3.py")
    create_active(direct_vm, contract, direct_alice, direct_bob)
    resolve_initial(direct_vm, contract)

    direct_vm.sender = direct_alice
    direct_vm.value = APPEAL_BOND
    contract.challenge_step(
        WORKFLOW_ID,
        STEP_ID,
        CHALLENGE,
        "Fresh evidence requests the one permitted appeal round.",
    )
    direct_vm.value = 0

    mock_step(direct_vm)
    contract.resolve_step_challenge(WORKFLOW_ID, STEP_ID)
    transferred = contract.finalize_step_decision(WORKFLOW_ID, STEP_ID)

    step = contract.get_step(WORKFLOW_ID, STEP_ID)
    assert int(transferred) == APPEAL_BOND
    assert step.challenge_bond_settled is True
    assert step.challenge_outcome_changed is False
    assert step.decision_finalized is True


def test_unchallenged_step_requires_timeout_then_explicit_finalization(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy("contracts/resolve_graph_v3.py")
    create_active(direct_vm, contract, direct_alice, direct_bob)
    resolve_initial(direct_vm, contract)

    with direct_vm.expect_revert("challenge window"):
        contract.finalize_step_decision(WORKFLOW_ID, STEP_ID)

    direct_vm.warp(
        (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat()
    )
    assert int(contract.finalize_step_decision(WORKFLOW_ID, STEP_ID)) == 0
    assert contract.get_step(WORKFLOW_ID, STEP_ID).decision_finalized is True


def test_reward_settlement_requires_explicit_finalization(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy("contracts/resolve_graph_v3.py")
    create_active(direct_vm, contract, direct_alice, direct_bob)
    resolve_initial(direct_vm, contract)
    direct_vm.warp(
        (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat()
    )

    with direct_vm.expect_revert("not finalized"):
        contract.settle_passed_step(WORKFLOW_ID, STEP_ID)

    contract.finalize_step_decision(WORKFLOW_ID, STEP_ID)
    assert int(contract.settle_passed_step(WORKFLOW_ID, STEP_ID)) == REWARD


def test_second_step_appeal_is_rejected(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy("contracts/resolve_graph_v3.py")
    create_active(direct_vm, contract, direct_alice, direct_bob)
    resolve_initial(direct_vm, contract)

    direct_vm.sender = direct_alice
    direct_vm.value = APPEAL_BOND
    contract.challenge_step(
        WORKFLOW_ID,
        STEP_ID,
        CHALLENGE,
        "This is the one bounded appeal round for the step.",
    )
    direct_vm.value = 0
    mock_step(direct_vm)
    contract.resolve_step_challenge(WORKFLOW_ID, STEP_ID)

    direct_vm.sender = direct_alice
    direct_vm.value = APPEAL_BOND
    with direct_vm.expect_revert("already used"):
        contract.challenge_step(
            WORKFLOW_ID,
            STEP_ID,
            "https://another.example/new",
            "A second appeal must be rejected by the bounded policy.",
        )
    direct_vm.value = 0


def prepare_failed_attribution(direct_vm, contract):
    resolve_initial(
        direct_vm,
        contract,
        verdict="FAIL",
        score=15,
        confidence=96,
        reason_code="CONTRADICTORY_EVIDENCE",
        failure_class="LOCAL",
    )
    direct_vm.warp(
        (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat()
    )
    contract.finalize_step_decision(WORKFLOW_ID, STEP_ID)
    mock_attribution(direct_vm)
    contract.attribute_failure(WORKFLOW_ID, STEP_ID)


def test_attribution_appeal_requires_bond_and_can_change_root_cause(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy("contracts/resolve_graph_v3.py")
    create_active(direct_vm, contract, direct_alice, direct_bob)
    prepare_failed_attribution(direct_vm, contract)

    assert int(contract.get_attribution_appeal_bond(WORKFLOW_ID)) == APPEAL_BOND

    direct_vm.sender = direct_bob
    direct_vm.value = APPEAL_BOND - 1
    with direct_vm.expect_revert("exact appeal bond"):
        contract.challenge_attribution(
            WORKFLOW_ID,
            ATTRIBUTION_CHALLENGE,
            "Fresh workflow-level evidence disputes the root-cause result.",
        )
    direct_vm.value = 0

    direct_vm.sender = direct_bob
    direct_vm.value = APPEAL_BOND
    contract.challenge_attribution(
        WORKFLOW_ID,
        ATTRIBUTION_CHALLENGE,
        "Fresh workflow-level evidence disputes the root-cause result.",
    )
    direct_vm.value = 0

    mock_attribution(
        direct_vm,
        fault_step_id="",
        fault_class="EXTERNAL",
        fault_reason="EXTERNAL_FAILURE",
        confidence=94,
    )
    contract.resolve_attribution_challenge(WORKFLOW_ID)
    returned = contract.finalize_attribution(WORKFLOW_ID)

    workflow = contract.get_workflow(WORKFLOW_ID)
    assert int(returned) == APPEAL_BOND
    assert workflow.initial_fault_class == "PARTICIPANT"
    assert workflow.fault_class == "EXTERNAL"
    assert workflow.attribution_challenge_outcome_changed is True
    assert workflow.attribution_finalized is True


def test_failed_workflow_cannot_settle_before_attribution_finalization(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy("contracts/resolve_graph_v3.py")
    create_active(direct_vm, contract, direct_alice, direct_bob)
    prepare_failed_attribution(direct_vm, contract)

    with direct_vm.expect_revert("settlement-ready"):
        contract.settle_failed_workflow(WORKFLOW_ID)

    direct_vm.warp(
        (datetime.now(timezone.utc) + timedelta(hours=4)).isoformat()
    )
    contract.finalize_attribution(WORKFLOW_ID)
    settled = contract.settle_failed_workflow(WORKFLOW_ID)
    assert int(settled) > 0
    assert contract.get_workflow(WORKFLOW_ID).status == "FAILED_SETTLED"


def test_attribution_appeal_refunds_when_slash_target_changes(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy("contracts/resolve_graph_v3.py")
    create_active(direct_vm, contract, direct_alice, direct_bob)

    resolve_initial(
        direct_vm,
        contract,
        verdict="FAIL",
        score=15,
        confidence=96,
        reason_code="CONTRADICTORY_EVIDENCE",
        failure_class="LOCAL",
    )
    direct_vm.warp(
        (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat()
    )
    contract.finalize_step_decision(WORKFLOW_ID, STEP_ID)

    # Round 1 crosses the >=80 participant-bond slashing boundary.
    mock_attribution(direct_vm, confidence=85)
    contract.attribute_failure(WORKFLOW_ID, STEP_ID)

    direct_vm.sender = direct_bob
    direct_vm.value = APPEAL_BOND
    contract.challenge_attribution(
        WORKFLOW_ID,
        ATTRIBUTION_CHALLENGE,
        "Fresh evidence changes the economic slashing consequence.",
    )
    direct_vm.value = 0

    # Same fault label/reason, but no participant slash after the appeal.
    mock_attribution(direct_vm, confidence=75)
    contract.resolve_attribution_challenge(WORKFLOW_ID)
    returned = contract.finalize_attribution(WORKFLOW_ID)

    workflow = contract.get_workflow(WORKFLOW_ID)
    assert int(workflow.initial_fault_confidence) == 85
    assert int(workflow.fault_confidence) == 75
    assert workflow.initial_fault_class == "PARTICIPANT"
    assert workflow.fault_class == "PARTICIPANT"
    assert workflow.attribution_challenge_outcome_changed is True
    assert int(returned) == APPEAL_BOND

import json
from datetime import datetime, timedelta, timezone

import pytest


WORKFLOW_ID = "rg-workflow-1"
STEP_ID = "collect"
REWARD = 5000
BOND = 1000
OBJECTIVE = (
    "Coordinate multiple independent agents to produce and verify a release "
    "artifact with auditable evidence and deterministic settlement."
)
REQUIREMENT = (
    "Publish the requested release artifact and provide public evidence that "
    "the committed deliverable is complete and accessible."
)
RUBRIC = (
    "Pass only when the public deliverable satisfies the committed scope and "
    "independent support evidence materially corroborates completion."
)
EVIDENCE_URL = "https://deliverable.example/proof"
SUPPORT_URL = "https://support.example/check"
CHALLENGE_URL = "https://challenge.example/counter"


@pytest.fixture(autouse=True)
def strict_direct_vm(direct_vm):
    direct_vm.strict_mocks = True
    direct_vm.check_pickling = True


def addr(account):
    return "0x" + account.hex()


def future_deadline(hours=24):
    return int((datetime.now(timezone.utc) + timedelta(hours=hours)).timestamp())


def create_workflow(direct_vm, contract, sponsor, workflow_id=WORKFLOW_ID):
    direct_vm.sender = sponsor
    contract.create_workflow(
        workflow_id,
        "ResolveGraph integration workflow",
        OBJECTIVE,
    )


def add_step(
    direct_vm,
    contract,
    sponsor,
    assignee,
    step_id=STEP_ID,
    dependency_a="",
    dependency_b="",
    reward=REWARD,
    deadline=None,
    role_label="Builder Agent",
):
    direct_vm.sender = sponsor
    direct_vm.value = reward
    contract.add_step(
        WORKFLOW_ID,
        step_id,
        addr(assignee),
        role_label,
        "eip155:1:0x0000000000000000000000000000000000000001#agent-7",
        "https://agent.example/.well-known/agent-card.json",
        REQUIREMENT,
        RUBRIC,
        dependency_a,
        dependency_b,
        deadline or future_deadline(),
    )
    direct_vm.value = 0


def seal(direct_vm, contract, sponsor):
    direct_vm.sender = sponsor
    contract.seal_workflow(WORKFLOW_ID)


def accept(direct_vm, contract, assignee, step_id=STEP_ID, bond=BOND):
    direct_vm.sender = assignee
    direct_vm.value = bond
    contract.accept_step(WORKFLOW_ID, step_id)
    direct_vm.value = 0


def create_active_single(direct_vm, contract, sponsor, assignee):
    create_workflow(direct_vm, contract, sponsor)
    add_step(direct_vm, contract, sponsor, assignee)
    direct_vm.deal(contract.address, REWARD)
    seal(direct_vm, contract, sponsor)
    accept(direct_vm, contract, assignee)
    direct_vm.deal(contract.address, REWARD + BOND)


def submit_single(direct_vm, contract, assignee):
    direct_vm.sender = assignee
    contract.submit_evidence(
        WORKFLOW_ID,
        STEP_ID,
        EVIDENCE_URL,
        SUPPORT_URL,
    )


def mock_step_result(
    direct_vm,
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
            "body": "Controlled public evidence for ResolveGraph direct tests.",
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
                "rationale": "Controlled direct-test judgment.",
                "evidence_snapshot": "Primary evidence snapshot.",
                "support_snapshot": "Independent support snapshot.",
            }
        ),
    )


def mock_attribution(
    direct_vm,
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
            "body": "Controlled workflow evidence for fault attribution.",
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
                "rationale": "Controlled attribution for direct testing.",
            }
        ),
    )


def resolve_pass(direct_vm, contract):
    mock_step_result(direct_vm)
    contract.resolve_step(WORKFLOW_ID, STEP_ID)


def test_create_workflow_records_sponsor_and_policy(
    direct_vm, direct_deploy, direct_alice
):
    contract = direct_deploy("contracts/resolve_graph.py")
    create_workflow(direct_vm, contract, direct_alice)
    workflow = contract.get_workflow(WORKFLOW_ID)

    assert workflow.status == "DRAFT"
    assert str(workflow.sponsor).lower() == addr(direct_alice).lower()
    assert workflow.policy_version == "RG_V1_MULTI_AGENT_FAULT"
    assert int(workflow.step_count) == 0


def test_duplicate_workflow_id_is_rejected(
    direct_vm, direct_deploy, direct_alice
):
    contract = direct_deploy("contracts/resolve_graph.py")
    create_workflow(direct_vm, contract, direct_alice)

    with direct_vm.expect_revert("already exists"):
        create_workflow(direct_vm, contract, direct_alice)


def test_only_sponsor_can_add_steps(
    direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie
):
    contract = direct_deploy("contracts/resolve_graph.py")
    create_workflow(direct_vm, contract, direct_alice)

    direct_vm.sender = direct_charlie
    direct_vm.value = REWARD
    with direct_vm.expect_revert("Only the workflow sponsor"):
        contract.add_step(
            WORKFLOW_ID,
            STEP_ID,
            addr(direct_bob),
            "Builder",
            "",
            "",
            REQUIREMENT,
            RUBRIC,
            "",
            "",
            future_deadline(),
        )


def test_step_reward_determines_twenty_percent_bond(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy("contracts/resolve_graph.py")
    create_workflow(direct_vm, contract, direct_alice)
    add_step(direct_vm, contract, direct_alice, direct_bob)

    step = contract.get_step(WORKFLOW_ID, STEP_ID)
    assert int(step.reward) == REWARD
    assert int(step.bond_required) == BOND
    assert step.status == "PENDING_ACCEPTANCE"


def test_sponsor_cannot_assign_step_to_self(
    direct_vm, direct_deploy, direct_alice
):
    contract = direct_deploy("contracts/resolve_graph.py")
    create_workflow(direct_vm, contract, direct_alice)

    direct_vm.sender = direct_alice
    direct_vm.value = REWARD
    with direct_vm.expect_revert("Sponsor cannot"):
        contract.add_step(
            WORKFLOW_ID,
            STEP_ID,
            addr(direct_alice),
            "Self",
            "",
            "",
            REQUIREMENT,
            RUBRIC,
            "",
            "",
            future_deadline(),
        )


def test_unknown_dependency_is_rejected(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy("contracts/resolve_graph.py")
    create_workflow(direct_vm, contract, direct_alice)

    with direct_vm.expect_revert("Dependency step not found"):
        add_step(
            direct_vm,
            contract,
            direct_alice,
            direct_bob,
            dependency_a="missing-step",
        )


def test_dependent_deadline_must_be_later(
    direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie
):
    contract = direct_deploy("contracts/resolve_graph.py")
    create_workflow(direct_vm, contract, direct_alice)
    first_deadline = future_deadline(48)
    add_step(
        direct_vm,
        contract,
        direct_alice,
        direct_bob,
        step_id="first",
        deadline=first_deadline,
    )

    with direct_vm.expect_revert("deadline must be later"):
        add_step(
            direct_vm,
            contract,
            direct_alice,
            direct_charlie,
            step_id="second",
            dependency_a="first",
            deadline=future_deadline(24),
        )


def test_empty_workflow_cannot_be_sealed(
    direct_vm, direct_deploy, direct_alice
):
    contract = direct_deploy("contracts/resolve_graph.py")
    create_workflow(direct_vm, contract, direct_alice)

    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("at least one step"):
        contract.seal_workflow(WORKFLOW_ID)


def test_exact_bond_is_required(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy("contracts/resolve_graph.py")
    create_workflow(direct_vm, contract, direct_alice)
    add_step(direct_vm, contract, direct_alice, direct_bob)
    seal(direct_vm, contract, direct_alice)

    direct_vm.sender = direct_bob
    direct_vm.value = BOND - 1
    with direct_vm.expect_revert("Exact participant bond"):
        contract.accept_step(WORKFLOW_ID, STEP_ID)


def test_assignee_acceptance_updates_stats(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy("contracts/resolve_graph.py")
    create_active_single(direct_vm, contract, direct_alice, direct_bob)

    step = contract.get_step(WORKFLOW_ID, STEP_ID)
    stats = contract.get_participant_stats(addr(direct_bob))
    assert step.status == "ACCEPTED"
    assert int(step.bond_posted) == BOND
    assert int(stats.steps_accepted) == 1


def test_evidence_requires_independent_domains(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy("contracts/resolve_graph.py")
    create_active_single(direct_vm, contract, direct_alice, direct_bob)

    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("independent domains"):
        contract.submit_evidence(
            WORKFLOW_ID,
            STEP_ID,
            "https://example.com/a",
            "https://www.example.com/b",
        )


def test_pass_resolution_opens_challenge_window(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy("contracts/resolve_graph.py")
    create_active_single(direct_vm, contract, direct_alice, direct_bob)
    submit_single(direct_vm, contract, direct_bob)
    resolve_pass(direct_vm, contract)

    step = contract.get_step(WORKFLOW_ID, STEP_ID)
    assert step.status == "RESOLVED_PASS"
    assert step.verdict == "PASS"
    assert int(step.score) == 95
    assert len(step.decision_hash) == 64
    assert contract.is_step_settlement_ready(WORKFLOW_ID, STEP_ID) is False


def test_low_confidence_result_fails_closed(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy("contracts/resolve_graph.py")
    create_active_single(direct_vm, contract, direct_alice, direct_bob)
    submit_single(direct_vm, contract, direct_bob)

    mock_step_result(
        direct_vm,
        verdict="PASS",
        score=95,
        confidence=40,
        reason_code="REQUIREMENT_MET",
        failure_class="NONE",
    )
    contract.resolve_step(WORKFLOW_ID, STEP_ID)
    step = contract.get_step(WORKFLOW_ID, STEP_ID)

    assert step.status == "RESOLVED_UNDETERMINED"
    assert step.verdict == "UNDETERMINED"
    assert step.reason_code == "EVIDENCE_GAP"


def test_pass_below_score_floor_becomes_fail(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy("contracts/resolve_graph.py")
    create_active_single(direct_vm, contract, direct_alice, direct_bob)
    submit_single(direct_vm, contract, direct_bob)

    mock_step_result(
        direct_vm,
        verdict="PASS",
        score=55,
        confidence=95,
        reason_code="REQUIREMENT_MET",
        failure_class="NONE",
    )
    contract.resolve_step(WORKFLOW_ID, STEP_ID)

    step = contract.get_step(WORKFLOW_ID, STEP_ID)
    assert step.verdict == "FAIL"
    assert step.failure_class == "LOCAL"


def test_validator_rejects_changed_decisive_step_result(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy("contracts/resolve_graph.py")
    create_active_single(direct_vm, contract, direct_alice, direct_bob)
    submit_single(direct_vm, contract, direct_bob)
    resolve_pass(direct_vm, contract)

    mock_step_result(
        direct_vm,
        verdict="FAIL",
        score=25,
        confidence=97,
        reason_code="EVIDENCE_GAP",
        failure_class="LOCAL",
    )
    assert direct_vm.run_validator() is False


def test_step_challenge_requires_fresh_domain(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy("contracts/resolve_graph.py")
    create_active_single(direct_vm, contract, direct_alice, direct_bob)
    submit_single(direct_vm, contract, direct_bob)
    resolve_pass(direct_vm, contract)

    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("fresh domain"):
        contract.challenge_step(
            WORKFLOW_ID,
            STEP_ID,
            "https://www.deliverable.example/new",
            "Sponsor disputes the stored result using new material evidence.",
        )


def test_fresh_challenge_can_flip_pass_to_fail(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy("contracts/resolve_graph.py")
    create_active_single(direct_vm, contract, direct_alice, direct_bob)
    submit_single(direct_vm, contract, direct_bob)
    resolve_pass(direct_vm, contract)

    direct_vm.sender = direct_alice
    contract.challenge_step(
        WORKFLOW_ID,
        STEP_ID,
        CHALLENGE_URL,
        "Fresh counterevidence materially disputes the claimed completion.",
    )
    mock_step_result(
        direct_vm,
        verdict="FAIL",
        score=20,
        confidence=96,
        reason_code="CONTRADICTORY_EVIDENCE",
        failure_class="LOCAL",
    )
    contract.resolve_step_challenge(WORKFLOW_ID, STEP_ID)

    step = contract.get_step(WORKFLOW_ID, STEP_ID)
    assert step.status == "RESOLVED_FAIL"
    assert step.initial_verdict == "PASS"
    assert int(step.resolution_round) == 2
    assert int(step.challenge_count) == 1
    assert contract.is_step_settlement_ready(WORKFLOW_ID, STEP_ID) is True


def test_passed_reward_cannot_settle_during_challenge_window(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy("contracts/resolve_graph.py")
    create_active_single(direct_vm, contract, direct_alice, direct_bob)
    submit_single(direct_vm, contract, direct_bob)
    resolve_pass(direct_vm, contract)

    with direct_vm.expect_revert("challenge window"):
        contract.settle_passed_step(WORKFLOW_ID, STEP_ID)


def test_passed_reward_settles_but_bond_remains_locked(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy("contracts/resolve_graph.py")
    create_active_single(direct_vm, contract, direct_alice, direct_bob)
    submit_single(direct_vm, contract, direct_bob)
    resolve_pass(direct_vm, contract)

    direct_vm.warp(
        (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat()
    )
    paid = contract.settle_passed_step(WORKFLOW_ID, STEP_ID)
    step = contract.get_step(WORKFLOW_ID, STEP_ID)

    assert int(paid) == REWARD
    assert step.status == "PAID"
    assert step.reward_settled is True
    assert step.bond_settled is False


def test_dependency_unlocks_only_after_prerequisite_paid(
    direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie
):
    contract = direct_deploy("contracts/resolve_graph.py")
    create_workflow(direct_vm, contract, direct_alice)
    add_step(
        direct_vm,
        contract,
        direct_alice,
        direct_bob,
        step_id="first",
        deadline=future_deadline(24),
    )
    add_step(
        direct_vm,
        contract,
        direct_alice,
        direct_charlie,
        step_id="second",
        dependency_a="first",
        reward=4000,
        deadline=future_deadline(48),
    )
    direct_vm.deal(contract.address, 9000)
    seal(direct_vm, contract, direct_alice)

    accept(direct_vm, contract, direct_bob, "first", 1000)
    direct_vm.deal(contract.address, 10000)
    accept(direct_vm, contract, direct_charlie, "second", 800)
    direct_vm.deal(contract.address, 10800)

    direct_vm.sender = direct_charlie
    with direct_vm.expect_revert("dependencies are not PAID"):
        contract.submit_evidence(
            WORKFLOW_ID,
            "second",
            "https://second.example/proof",
            "https://second-support.example/proof",
        )

    direct_vm.sender = direct_bob
    contract.submit_evidence(
        WORKFLOW_ID,
        "first",
        EVIDENCE_URL,
        SUPPORT_URL,
    )
    mock_step_result(direct_vm)
    contract.resolve_step(WORKFLOW_ID, "first")
    direct_vm.warp(
        (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat()
    )
    contract.settle_passed_step(WORKFLOW_ID, "first")

    assert contract.is_step_unlocked(WORKFLOW_ID, "second") is True


def test_completed_workflow_returns_all_bonds(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy("contracts/resolve_graph.py")
    create_active_single(direct_vm, contract, direct_alice, direct_bob)
    submit_single(direct_vm, contract, direct_bob)
    resolve_pass(direct_vm, contract)
    direct_vm.warp(
        (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat()
    )
    contract.settle_passed_step(WORKFLOW_ID, STEP_ID)

    returned = contract.complete_workflow(WORKFLOW_ID)
    workflow = contract.get_workflow(WORKFLOW_ID)
    step = contract.get_step(WORKFLOW_ID, STEP_ID)
    stats = contract.get_participant_stats(addr(direct_bob))

    assert int(returned) == BOND
    assert workflow.status == "COMPLETED"
    assert step.bond_settled is True
    assert int(stats.bonds_returned) == 1
    assert int(stats.total_bond_returned) == BOND


def test_failed_step_can_enter_fault_attribution(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy("contracts/resolve_graph.py")
    create_active_single(direct_vm, contract, direct_alice, direct_bob)
    submit_single(direct_vm, contract, direct_bob)

    mock_step_result(
        direct_vm,
        verdict="FAIL",
        score=15,
        confidence=96,
        reason_code="EVIDENCE_GAP",
        failure_class="LOCAL",
    )
    contract.resolve_step(WORKFLOW_ID, STEP_ID)
    direct_vm.warp(
        (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat()
    )

    mock_attribution(direct_vm)
    contract.attribute_failure(WORKFLOW_ID, STEP_ID)

    workflow = contract.get_workflow(WORKFLOW_ID)
    assert workflow.status == "ATTRIBUTED"
    assert workflow.fault_step_id == STEP_ID
    assert workflow.fault_class == "PARTICIPANT"
    assert int(workflow.fault_confidence) == 95
    assert len(workflow.decision_hash) == 64
    assert contract.is_attribution_settlement_ready(WORKFLOW_ID) is False


def test_validator_rejects_changed_fault_attribution(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy("contracts/resolve_graph.py")
    create_active_single(direct_vm, contract, direct_alice, direct_bob)
    submit_single(direct_vm, contract, direct_bob)
    mock_step_result(
        direct_vm,
        verdict="FAIL",
        score=20,
        confidence=95,
        reason_code="EVIDENCE_GAP",
        failure_class="LOCAL",
    )
    contract.resolve_step(WORKFLOW_ID, STEP_ID)
    direct_vm.warp(
        (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat()
    )
    mock_attribution(direct_vm)
    contract.attribute_failure(WORKFLOW_ID, STEP_ID)

    mock_attribution(
        direct_vm,
        fault_step_id="",
        fault_class="EXTERNAL",
        fault_reason="EXTERNAL_FAILURE",
        confidence=95,
    )
    assert direct_vm.run_validator() is False


def test_attribution_challenge_requires_workflow_participant(
    direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie
):
    contract = direct_deploy("contracts/resolve_graph.py")
    create_active_single(direct_vm, contract, direct_alice, direct_bob)
    submit_single(direct_vm, contract, direct_bob)
    mock_step_result(
        direct_vm,
        verdict="FAIL",
        score=20,
        confidence=95,
        reason_code="EVIDENCE_GAP",
        failure_class="LOCAL",
    )
    contract.resolve_step(WORKFLOW_ID, STEP_ID)
    direct_vm.warp(
        (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat()
    )
    mock_attribution(direct_vm)
    contract.attribute_failure(WORKFLOW_ID, STEP_ID)

    direct_vm.sender = direct_charlie
    with direct_vm.expect_revert("workflow participant"):
        contract.challenge_attribution(
            WORKFLOW_ID,
            "https://fresh.example/attribution",
            "Unrelated wallet should not be able to challenge attribution.",
        )


def test_attribution_challenge_can_change_fault_to_external(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy("contracts/resolve_graph.py")
    create_active_single(direct_vm, contract, direct_alice, direct_bob)
    submit_single(direct_vm, contract, direct_bob)
    mock_step_result(
        direct_vm,
        verdict="FAIL",
        score=20,
        confidence=95,
        reason_code="EVIDENCE_GAP",
        failure_class="LOCAL",
    )
    contract.resolve_step(WORKFLOW_ID, STEP_ID)
    direct_vm.warp(
        (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat()
    )
    mock_attribution(direct_vm)
    contract.attribute_failure(WORKFLOW_ID, STEP_ID)

    direct_vm.sender = direct_bob
    contract.challenge_attribution(
        WORKFLOW_ID,
        "https://external-cause.example/report",
        "Fresh evidence shows the primary cause was external infrastructure.",
    )

    mock_attribution(
        direct_vm,
        fault_step_id="",
        fault_class="EXTERNAL",
        fault_reason="EXTERNAL_FAILURE",
        confidence=94,
    )
    contract.resolve_attribution_challenge(WORKFLOW_ID)

    workflow = contract.get_workflow(WORKFLOW_ID)
    assert workflow.status == "ATTRIBUTED"
    assert workflow.fault_class == "EXTERNAL"
    assert workflow.fault_step_id == ""
    assert int(workflow.attribution_round) == 2
    assert contract.is_attribution_settlement_ready(WORKFLOW_ID) is True


def test_high_confidence_participant_fault_slashes_bond(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy("contracts/resolve_graph.py")
    create_active_single(direct_vm, contract, direct_alice, direct_bob)
    submit_single(direct_vm, contract, direct_bob)
    mock_step_result(
        direct_vm,
        verdict="FAIL",
        score=10,
        confidence=98,
        reason_code="EVIDENCE_GAP",
        failure_class="LOCAL",
    )
    contract.resolve_step(WORKFLOW_ID, STEP_ID)
    direct_vm.warp(
        (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat()
    )
    mock_attribution(direct_vm, confidence=95)
    contract.attribute_failure(WORKFLOW_ID, STEP_ID)

    direct_vm.warp(
        (datetime.now(timezone.utc) + timedelta(hours=4)).isoformat()
    )
    settled = contract.settle_failed_workflow(WORKFLOW_ID)

    workflow = contract.get_workflow(WORKFLOW_ID)
    stats = contract.get_participant_stats(addr(direct_bob))
    assert int(settled) == REWARD + BOND
    assert workflow.status == "FAILED_SETTLED"
    assert int(stats.bonds_slashed) == 1
    assert int(stats.total_bond_slashed) == BOND


def test_external_fault_returns_participant_bond(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy("contracts/resolve_graph.py")
    create_active_single(direct_vm, contract, direct_alice, direct_bob)
    submit_single(direct_vm, contract, direct_bob)
    mock_step_result(
        direct_vm,
        verdict="FAIL",
        score=20,
        confidence=95,
        reason_code="SOURCE_UNAVAILABLE",
        failure_class="EXTERNAL",
    )
    contract.resolve_step(WORKFLOW_ID, STEP_ID)
    direct_vm.warp(
        (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat()
    )
    mock_attribution(
        direct_vm,
        fault_step_id="",
        fault_class="EXTERNAL",
        fault_reason="EXTERNAL_FAILURE",
        confidence=95,
    )
    contract.attribute_failure(WORKFLOW_ID, STEP_ID)

    direct_vm.warp(
        (datetime.now(timezone.utc) + timedelta(hours=4)).isoformat()
    )
    settled = contract.settle_failed_workflow(WORKFLOW_ID)

    stats = contract.get_participant_stats(addr(direct_bob))
    assert int(settled) == REWARD + BOND
    assert int(stats.bonds_returned) == 1
    assert int(stats.bonds_slashed) == 0


def test_low_confidence_participant_attribution_does_not_slash(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy("contracts/resolve_graph.py")
    create_active_single(direct_vm, contract, direct_alice, direct_bob)
    submit_single(direct_vm, contract, direct_bob)
    mock_step_result(
        direct_vm,
        verdict="FAIL",
        score=15,
        confidence=95,
        reason_code="EVIDENCE_GAP",
        failure_class="LOCAL",
    )
    contract.resolve_step(WORKFLOW_ID, STEP_ID)
    direct_vm.warp(
        (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat()
    )
    mock_attribution(direct_vm, confidence=75)
    contract.attribute_failure(WORKFLOW_ID, STEP_ID)

    direct_vm.warp(
        (datetime.now(timezone.utc) + timedelta(hours=4)).isoformat()
    )
    contract.settle_failed_workflow(WORKFLOW_ID)

    stats = contract.get_participant_stats(addr(direct_bob))
    assert int(stats.bonds_returned) == 1
    assert int(stats.bonds_slashed) == 0


def test_missed_deadline_creates_deterministic_participant_fault(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy("contracts/resolve_graph.py")
    create_workflow(direct_vm, contract, direct_alice)
    add_step(
        direct_vm,
        contract,
        direct_alice,
        direct_bob,
        deadline=future_deadline(1),
    )
    direct_vm.deal(contract.address, REWARD)
    seal(direct_vm, contract, direct_alice)
    accept(direct_vm, contract, direct_bob)
    direct_vm.deal(contract.address, REWARD + BOND)

    direct_vm.warp(
        (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat()
    )
    contract.mark_missed_deadline(WORKFLOW_ID, STEP_ID)

    workflow = contract.get_workflow(WORKFLOW_ID)
    assert workflow.status == "ATTRIBUTED"
    assert workflow.fault_step_id == STEP_ID
    assert workflow.fault_class == "PARTICIPANT"
    assert workflow.fault_reason == "MISSED_DEADLINE"
    assert int(workflow.fault_confidence) == 100


def test_draft_cancellation_refunds_all_rewards(
    direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie
):
    contract = direct_deploy("contracts/resolve_graph.py")
    create_workflow(direct_vm, contract, direct_alice)
    add_step(
        direct_vm,
        contract,
        direct_alice,
        direct_bob,
        step_id="one",
        reward=5000,
        deadline=future_deadline(24),
    )
    add_step(
        direct_vm,
        contract,
        direct_alice,
        direct_charlie,
        step_id="two",
        reward=4000,
        deadline=future_deadline(36),
    )
    direct_vm.deal(contract.address, 9000)

    direct_vm.sender = direct_alice
    refunded = contract.cancel_draft_workflow(WORKFLOW_ID)

    assert int(refunded) == 9000
    assert contract.get_workflow(WORKFLOW_ID).status == "CANCELLED"

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


def test_workflow_index_supports_frontend_discovery(
    direct_vm, direct_deploy, direct_alice
):
    contract = direct_deploy("contracts/resolve_graph.py")
    create_workflow(direct_vm, contract, direct_alice, workflow_id="wf-a")
    create_workflow(direct_vm, contract, direct_alice, workflow_id="wf-b")

    assert int(contract.get_workflow_count()) == 2
    assert contract.get_workflow_id_by_index(0) == "wf-a"
    assert contract.get_workflow_id_by_index(1) == "wf-b"


def test_workflow_index_out_of_range_is_rejected(
    direct_vm, direct_deploy, direct_alice
):
    contract = direct_deploy("contracts/resolve_graph.py")
    create_workflow(direct_vm, contract, direct_alice)

    with direct_vm.expect_revert("Workflow index out of range"):
        contract.get_workflow_id_by_index(1)


def test_zero_reward_step_is_rejected(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy("contracts/resolve_graph.py")
    create_workflow(direct_vm, contract, direct_alice)
    direct_vm.sender = direct_alice
    direct_vm.value = 0
    with direct_vm.expect_revert("reward must be greater than zero"):
        contract.add_step(
            WORKFLOW_ID,
            "zero",
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


def test_maximum_eight_steps_is_enforced(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy("contracts/resolve_graph.py")
    create_workflow(direct_vm, contract, direct_alice)
    for i in range(8):
        add_step(
            direct_vm,
            contract,
            direct_alice,
            direct_bob,
            step_id=f"step-{i}",
            reward=1000,
            deadline=future_deadline(24 + i),
        )

    with direct_vm.expect_revert("Maximum workflow steps"):
        add_step(
            direct_vm,
            contract,
            direct_alice,
            direct_bob,
            step_id="step-8",
            reward=1000,
            deadline=future_deadline(40),
        )


def test_duplicate_dependencies_are_rejected(
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

    with direct_vm.expect_revert("Dependencies must be distinct"):
        add_step(
            direct_vm,
            contract,
            direct_alice,
            direct_charlie,
            step_id="second",
            dependency_a="first",
            dependency_b="first",
            deadline=future_deadline(48),
        )


def test_step_deadline_cannot_exceed_365_days(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy("contracts/resolve_graph.py")
    create_workflow(direct_vm, contract, direct_alice)

    with direct_vm.expect_revert("365 days"):
        add_step(
            direct_vm,
            contract,
            direct_alice,
            direct_bob,
            deadline=future_deadline(366 * 24),
        )


def test_step_cannot_be_added_after_seal(
    direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie
):
    contract = direct_deploy("contracts/resolve_graph.py")
    create_workflow(direct_vm, contract, direct_alice)
    add_step(direct_vm, contract, direct_alice, direct_bob)
    seal(direct_vm, contract, direct_alice)

    with direct_vm.expect_revert("already sealed"):
        add_step(
            direct_vm,
            contract,
            direct_alice,
            direct_charlie,
            step_id="late",
        )


def test_only_sponsor_can_seal(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy("contracts/resolve_graph.py")
    create_workflow(direct_vm, contract, direct_alice)
    add_step(direct_vm, contract, direct_alice, direct_bob)
    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("Only the workflow sponsor"):
        contract.seal_workflow(WORKFLOW_ID)


def test_only_assignee_can_accept(
    direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie
):
    contract = direct_deploy("contracts/resolve_graph.py")
    create_workflow(direct_vm, contract, direct_alice)
    add_step(direct_vm, contract, direct_alice, direct_bob)
    seal(direct_vm, contract, direct_alice)

    direct_vm.sender = direct_charlie
    direct_vm.value = BOND
    with direct_vm.expect_revert("assigned participant"):
        contract.accept_step(WORKFLOW_ID, STEP_ID)


def test_accept_after_deadline_is_rejected(
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
    seal(direct_vm, contract, direct_alice)
    direct_vm.warp(
        (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat()
    )
    direct_vm.sender = direct_bob
    direct_vm.value = BOND
    with direct_vm.expect_revert("deadline has passed"):
        contract.accept_step(WORKFLOW_ID, STEP_ID)


def test_only_assignee_can_submit_evidence(
    direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie
):
    contract = direct_deploy("contracts/resolve_graph.py")
    create_active_single(direct_vm, contract, direct_alice, direct_bob)
    direct_vm.sender = direct_charlie
    with direct_vm.expect_revert("assigned participant"):
        contract.submit_evidence(
            WORKFLOW_ID, STEP_ID, EVIDENCE_URL, SUPPORT_URL
        )


def test_evidence_requires_https(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy("contracts/resolve_graph.py")
    create_active_single(direct_vm, contract, direct_alice, direct_bob)
    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("must use HTTPS"):
        contract.submit_evidence(
            WORKFLOW_ID,
            STEP_ID,
            "http://deliverable.example/proof",
            SUPPORT_URL,
        )


def test_www_and_trailing_dot_cannot_fake_independent_evidence(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy("contracts/resolve_graph.py")
    create_active_single(direct_vm, contract, direct_alice, direct_bob)
    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("independent domains"):
        contract.submit_evidence(
            WORKFLOW_ID,
            STEP_ID,
            "https://example.com/proof",
            "https://www.example.com./support",
        )


def test_userinfo_url_is_rejected(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy("contracts/resolve_graph.py")
    create_active_single(direct_vm, contract, direct_alice, direct_bob)
    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("hostname is invalid"):
        contract.submit_evidence(
            WORKFLOW_ID,
            STEP_ID,
            "https://example.com@evil.example/proof",
            SUPPORT_URL,
        )


def test_cannot_resolve_without_submission(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy("contracts/resolve_graph.py")
    create_active_single(direct_vm, contract, direct_alice, direct_bob)
    with direct_vm.expect_revert("no unresolved evidence"):
        contract.resolve_step(WORKFLOW_ID, STEP_ID)


def test_unauthorized_wallet_cannot_challenge_step(
    direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie
):
    contract = direct_deploy("contracts/resolve_graph.py")
    create_active_single(direct_vm, contract, direct_alice, direct_bob)
    submit_single(direct_vm, contract, direct_bob)
    resolve_pass(direct_vm, contract)

    direct_vm.sender = direct_charlie
    with direct_vm.expect_revert("sponsor or assignee"):
        contract.challenge_step(
            WORKFLOW_ID,
            STEP_ID,
            CHALLENGE_URL,
            "This unrelated wallet must not be able to challenge the step.",
        )


def test_step_challenge_after_deadline_is_rejected(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy("contracts/resolve_graph.py")
    create_active_single(direct_vm, contract, direct_alice, direct_bob)
    submit_single(direct_vm, contract, direct_bob)
    resolve_pass(direct_vm, contract)
    direct_vm.warp(
        (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat()
    )
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("challenge window has closed"):
        contract.challenge_step(
            WORKFLOW_ID,
            STEP_ID,
            CHALLENGE_URL,
            "Fresh evidence arrived too late for the guaranteed challenge window.",
        )


def test_second_step_challenge_is_rejected(
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
        "Fresh evidence requests one allowed second consensus round.",
    )
    mock_step_result(direct_vm)
    contract.resolve_step_challenge(WORKFLOW_ID, STEP_ID)

    with direct_vm.expect_revert("challenge already used"):
        contract.challenge_step(
            WORKFLOW_ID,
            STEP_ID,
            "https://fourth.example/evidence",
            "A second challenge must not be accepted for the same step.",
        )


def test_step_decision_hash_changes_after_challenge_round(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy("contracts/resolve_graph.py")
    create_active_single(direct_vm, contract, direct_alice, direct_bob)
    submit_single(direct_vm, contract, direct_bob)
    resolve_pass(direct_vm, contract)
    first_hash = contract.get_step(WORKFLOW_ID, STEP_ID).decision_hash

    direct_vm.sender = direct_alice
    contract.challenge_step(
        WORKFLOW_ID,
        STEP_ID,
        CHALLENGE_URL,
        "Fresh evidence is used to produce a separately auditable decision round.",
    )
    mock_step_result(direct_vm)
    contract.resolve_step_challenge(WORKFLOW_ID, STEP_ID)
    second_hash = contract.get_step(WORKFLOW_ID, STEP_ID).decision_hash

    assert len(first_hash) == 64
    assert len(second_hash) == 64
    assert first_hash != second_hash


def test_step_snapshots_are_bounded(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy("contracts/resolve_graph.py")
    create_active_single(direct_vm, contract, direct_alice, direct_bob)
    submit_single(direct_vm, contract, direct_bob)

    direct_vm.clear_mocks()
    direct_vm.mock_web(
        r".*",
        {"status": 200, "body": "Evidence body."},
    )
    direct_vm.mock_llm(
        r"(?s).*neutral step judge inside ResolveGraph.*",
        json.dumps(
            {
                "verdict": "PASS",
                "score": 95,
                "confidence": 95,
                "reason_code": "REQUIREMENT_MET",
                "failure_class": "NONE",
                "causal_dependency": "",
                "rationale": "R" * 2000,
                "evidence_snapshot": "E" * 2000,
                "support_snapshot": "S" * 2000,
            }
        ),
    )
    contract.resolve_step(WORKFLOW_ID, STEP_ID)
    step = contract.get_step(WORKFLOW_ID, STEP_ID)
    assert len(step.rationale) <= 650
    assert len(step.evidence_snapshot) <= 650
    assert len(step.support_snapshot) <= 650


def test_low_consensus_confidence_normalizes_attribution_to_undetermined(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy("contracts/resolve_graph.py")
    create_active_single(direct_vm, contract, direct_alice, direct_bob)
    submit_single(direct_vm, contract, direct_bob)
    mock_step_result(
        direct_vm,
        verdict="FAIL",
        score=10,
        confidence=95,
        reason_code="EVIDENCE_GAP",
        failure_class="LOCAL",
    )
    contract.resolve_step(WORKFLOW_ID, STEP_ID)
    direct_vm.warp(
        (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat()
    )
    mock_attribution(direct_vm, confidence=60)
    contract.attribute_failure(WORKFLOW_ID, STEP_ID)
    workflow = contract.get_workflow(WORKFLOW_ID)

    assert workflow.fault_class == "UNDETERMINED"
    assert workflow.fault_step_id == ""
    assert workflow.fault_reason == "INSUFFICIENT_EVIDENCE"


def test_invalid_participant_fault_step_fails_closed(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy("contracts/resolve_graph.py")
    create_active_single(direct_vm, contract, direct_alice, direct_bob)
    submit_single(direct_vm, contract, direct_bob)
    mock_step_result(
        direct_vm,
        verdict="FAIL",
        score=10,
        confidence=95,
        reason_code="EVIDENCE_GAP",
        failure_class="LOCAL",
    )
    contract.resolve_step(WORKFLOW_ID, STEP_ID)
    direct_vm.warp(
        (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat()
    )
    mock_attribution(
        direct_vm,
        fault_step_id="invented-step",
        fault_class="PARTICIPANT",
        confidence=99,
    )
    contract.attribute_failure(WORKFLOW_ID, STEP_ID)
    workflow = contract.get_workflow(WORKFLOW_ID)

    assert workflow.fault_class == "UNDETERMINED"
    assert workflow.fault_step_id == ""


def test_attribution_challenge_requires_fresh_domain(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy("contracts/resolve_graph.py")
    create_active_single(direct_vm, contract, direct_alice, direct_bob)
    submit_single(direct_vm, contract, direct_bob)
    mock_step_result(
        direct_vm,
        verdict="FAIL",
        score=10,
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
    with direct_vm.expect_revert("fresh domain"):
        contract.challenge_attribution(
            WORKFLOW_ID,
            "https://www.deliverable.example/new",
            "The challenge must not reuse an evidence domain from the workflow.",
        )


def test_attribution_challenge_after_deadline_is_rejected(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy("contracts/resolve_graph.py")
    create_active_single(direct_vm, contract, direct_alice, direct_bob)
    submit_single(direct_vm, contract, direct_bob)
    mock_step_result(
        direct_vm,
        verdict="FAIL",
        score=10,
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
    direct_vm.warp(
        (datetime.now(timezone.utc) + timedelta(hours=4)).isoformat()
    )

    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("challenge window has closed"):
        contract.challenge_attribution(
            WORKFLOW_ID,
            "https://fresh.example/late",
            "This attribution challenge is intentionally submitted after expiry.",
        )


def test_failed_workflow_cannot_settle_during_attribution_window(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy("contracts/resolve_graph.py")
    create_active_single(direct_vm, contract, direct_alice, direct_bob)
    submit_single(direct_vm, contract, direct_bob)
    mock_step_result(
        direct_vm,
        verdict="FAIL",
        score=10,
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

    with direct_vm.expect_revert("not settlement-ready"):
        contract.settle_failed_workflow(WORKFLOW_ID)


def test_failed_workflow_cannot_settle_twice(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy("contracts/resolve_graph.py")
    create_active_single(direct_vm, contract, direct_alice, direct_bob)
    submit_single(direct_vm, contract, direct_bob)
    mock_step_result(
        direct_vm,
        verdict="FAIL",
        score=10,
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
    direct_vm.warp(
        (datetime.now(timezone.utc) + timedelta(hours=4)).isoformat()
    )
    contract.settle_failed_workflow(WORKFLOW_ID)

    with direct_vm.expect_revert("not settlement-ready"):
        contract.settle_failed_workflow(WORKFLOW_ID)


def test_workflow_cannot_complete_until_every_step_is_paid(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy("contracts/resolve_graph.py")
    create_active_single(direct_vm, contract, direct_alice, direct_bob)
    with direct_vm.expect_revert("Every workflow step must be PAID"):
        contract.complete_workflow(WORKFLOW_ID)


def test_completed_workflow_cannot_complete_twice(
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
    contract.complete_workflow(WORKFLOW_ID)

    with direct_vm.expect_revert("Workflow is not active"):
        contract.complete_workflow(WORKFLOW_ID)


def test_only_sponsor_can_cancel_draft(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy("contracts/resolve_graph.py")
    create_workflow(direct_vm, contract, direct_alice)
    add_step(direct_vm, contract, direct_alice, direct_bob)
    direct_vm.deal(contract.address, REWARD)

    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("Only the workflow sponsor"):
        contract.cancel_draft_workflow(WORKFLOW_ID)


def test_sealed_workflow_cannot_be_cancelled_as_draft(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy("contracts/resolve_graph.py")
    create_workflow(direct_vm, contract, direct_alice)
    add_step(direct_vm, contract, direct_alice, direct_bob)
    seal(direct_vm, contract, direct_alice)

    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("Only a draft workflow"):
        contract.cancel_draft_workflow(WORKFLOW_ID)


def test_attribution_decision_hash_changes_after_challenge(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy("contracts/resolve_graph.py")
    create_active_single(direct_vm, contract, direct_alice, direct_bob)
    submit_single(direct_vm, contract, direct_bob)
    mock_step_result(
        direct_vm,
        verdict="FAIL",
        score=10,
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
    first_hash = contract.get_workflow(WORKFLOW_ID).decision_hash

    direct_vm.sender = direct_bob
    contract.challenge_attribution(
        WORKFLOW_ID,
        "https://external-cause.example/report",
        "Fresh evidence requests a second workflow attribution consensus round.",
    )
    mock_attribution(
        direct_vm,
        fault_step_id="",
        fault_class="EXTERNAL",
        fault_reason="EXTERNAL_FAILURE",
        confidence=95,
    )
    contract.resolve_attribution_challenge(WORKFLOW_ID)
    second_hash = contract.get_workflow(WORKFLOW_ID).decision_hash

    assert len(first_hash) == 64
    assert len(second_hash) == 64
    assert first_hash != second_hash


def test_upstream_failure_requires_real_dependency(
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
        failure_class="UPSTREAM",
        causal_dependency="invented",
    )
    contract.resolve_step(WORKFLOW_ID, STEP_ID)
    step = contract.get_step(WORKFLOW_ID, STEP_ID)

    assert step.failure_class == "UNDETERMINED"
    assert step.causal_dependency == ""


def test_same_agent_multiple_steps_counts_workflow_completion_once(
    direct_vm, direct_deploy, direct_alice, direct_bob
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
        direct_bob,
        step_id="two",
        reward=5000,
        deadline=future_deadline(36),
    )
    direct_vm.deal(contract.address, 10000)
    seal(direct_vm, contract, direct_alice)

    accept(direct_vm, contract, direct_bob, "one", 1000)
    direct_vm.deal(contract.address, 11000)
    accept(direct_vm, contract, direct_bob, "two", 1000)
    direct_vm.deal(contract.address, 12000)

    for sid, primary, support in (
        ("one", "https://one.example/proof", "https://one-support.example/proof"),
        ("two", "https://two.example/proof", "https://two-support.example/proof"),
    ):
        direct_vm.sender = direct_bob
        contract.submit_evidence(WORKFLOW_ID, sid, primary, support)
        mock_step_result(direct_vm)
        contract.resolve_step(WORKFLOW_ID, sid)

    direct_vm.warp(
        (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat()
    )
    contract.settle_passed_step(WORKFLOW_ID, "one")
    contract.settle_passed_step(WORKFLOW_ID, "two")
    contract.complete_workflow(WORKFLOW_ID)

    stats = contract.get_participant_stats(addr(direct_bob))
    assert int(stats.bonds_returned) == 2
    assert int(stats.workflows_completed) == 1
    assert int(stats.total_bond_returned) == 2000


def test_a2a_endpoint_must_be_https_when_supplied(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy("contracts/resolve_graph.py")
    create_workflow(direct_vm, contract, direct_alice)
    direct_vm.sender = direct_alice
    direct_vm.value = REWARD
    with direct_vm.expect_revert("A2A endpoint must be a valid HTTPS URL"):
        contract.add_step(
            WORKFLOW_ID,
            "bad-a2a",
            addr(direct_bob),
            "Worker Agent",
            "eip155:1:0x0000000000000000000000000000000000000001#agent-7",
            "http://agent.example/.well-known/agent-card.json",
            REQUIREMENT,
            RUBRIC,
            "",
            "",
            future_deadline(),
        )


def test_unaccepted_expired_assignment_does_not_blame_assignee(
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
    direct_vm.warp(
        (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat()
    )

    contract.mark_missed_deadline(WORKFLOW_ID, STEP_ID)
    workflow = contract.get_workflow(WORKFLOW_ID)

    assert workflow.status == "ATTRIBUTED"
    assert workflow.failed_step_id == STEP_ID
    assert workflow.fault_class == "UNDETERMINED"
    assert workflow.fault_step_id == ""
    assert workflow.fault_reason == "INSUFFICIENT_EVIDENCE"


def test_submitted_step_cannot_be_mislabeled_missed_deadline(
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
    submit_single(direct_vm, contract, direct_bob)
    direct_vm.warp(
        (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat()
    )

    with direct_vm.expect_revert("accepted-unsubmitted step"):
        contract.mark_missed_deadline(WORKFLOW_ID, STEP_ID)

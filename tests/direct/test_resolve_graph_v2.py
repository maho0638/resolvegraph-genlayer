import hashlib
from datetime import datetime, timedelta, timezone

import pytest


WORKFLOW_ID = "rg-v2-workflow"
REWARD = 5000
BOND = 1000
OBJECTIVE = (
    "Verify that immutable content-addressed workflow recipes bind reusable "
    "policy text and economics to a concrete multi-agent step."
)
REQUIREMENT = (
    "Deliver the requested software change and publish immutable evidence that "
    "identifies the exact revision being reviewed."
)
RUBRIC = (
    "PASS only when the primary source proves the requested change exists in "
    "the identified revision and independent support corroborates the result."
)


@pytest.fixture(autouse=True)
def strict_direct_vm(direct_vm):
    direct_vm.strict_mocks = True
    direct_vm.check_pickling = True


def addr(account):
    return "0x" + account.hex()


def future_deadline(hours=24):
    return int((datetime.now(timezone.utc) + timedelta(hours=hours)).timestamp())


def expected_recipe_hash(
    recipe_id="software-delivery",
    version="v1",
    name="Software delivery",
    role_label="Delivery Agent",
    requirement=REQUIREMENT,
    rubric=RUBRIC,
    evidence_type="GITHUB_COMMIT",
):
    fields = (
        "RG_RECIPE_V1",
        recipe_id,
        version,
        name,
        role_label,
        requirement,
        rubric,
        evidence_type,
        "3600",
        "5",
        "STEP_REWARD_PLUS_LOCKED_BOND",
    )
    payload = "".join(f"{len(str(value))}:{value}" for value in fields)
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def register_default(direct_vm, contract, publisher):
    direct_vm.sender = publisher
    return contract.register_recipe(
        "software-delivery",
        "v1",
        "Software delivery",
        "Delivery Agent",
        REQUIREMENT,
        RUBRIC,
        "github_commit",
    )


def create_workflow(direct_vm, contract, sponsor):
    direct_vm.sender = sponsor
    contract.create_workflow(
        WORKFLOW_ID,
        "ResolveGraph V2 recipe workflow",
        OBJECTIVE,
    )


def test_v2_workflow_policy_version_is_isolated(
    direct_vm, direct_deploy, direct_alice
):
    contract = direct_deploy("contracts/resolve_graph_v2.py")
    create_workflow(direct_vm, contract, direct_alice)
    workflow = contract.get_workflow(WORKFLOW_ID)
    assert workflow.policy_version == "RG_V2_IMMUTABLE_RECIPES"


def test_recipe_registration_is_content_addressed_and_readable(
    direct_vm, direct_deploy, direct_alice
):
    contract = direct_deploy("contracts/resolve_graph_v2.py")
    recipe_hash = register_default(direct_vm, contract, direct_alice)

    assert recipe_hash == expected_recipe_hash()
    assert int(contract.get_recipe_count()) == 1
    assert contract.get_recipe_hash_by_index(0) == recipe_hash

    recipe = contract.get_recipe(recipe_hash)
    assert recipe.id == "software-delivery"
    assert recipe.version == "v1"
    assert recipe.role_label == "Delivery Agent"
    assert recipe.requirement == REQUIREMENT
    assert recipe.rubric == RUBRIC
    assert recipe.evidence_type == "GITHUB_COMMIT"
    assert int(recipe.challenge_window_seconds) == 3600
    assert int(recipe.bond_divisor) == 5
    assert recipe.payout_mode == "STEP_REWARD_PLUS_LOCKED_BOND"
    assert recipe.recipe_hash == recipe_hash
    assert str(recipe.publisher).lower() == addr(direct_alice).lower()


def test_recipe_cannot_be_overwritten(
    direct_vm, direct_deploy, direct_alice
):
    contract = direct_deploy("contracts/resolve_graph_v2.py")
    recipe_hash = register_default(direct_vm, contract, direct_alice)

    with direct_vm.expect_revert("already registered"):
        register_default(direct_vm, contract, direct_alice)

    assert int(contract.get_recipe_count()) == 1
    assert contract.get_recipe(recipe_hash).requirement == REQUIREMENT


def test_recipe_version_changes_content_hash(
    direct_vm, direct_deploy, direct_alice
):
    contract = direct_deploy("contracts/resolve_graph_v2.py")
    v1 = register_default(direct_vm, contract, direct_alice)

    direct_vm.sender = direct_alice
    v2 = contract.register_recipe(
        "software-delivery",
        "v2",
        "Software delivery",
        "Delivery Agent",
        REQUIREMENT,
        RUBRIC,
        "github_commit",
    )

    assert v1 != v2
    assert int(contract.get_recipe_count()) == 2
    assert contract.get_recipe(v1).version == "v1"
    assert contract.get_recipe(v2).version == "v2"


def test_add_step_from_recipe_freezes_registered_policy(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy("contracts/resolve_graph_v2.py")
    recipe_hash = register_default(direct_vm, contract, direct_alice)
    create_workflow(direct_vm, contract, direct_alice)

    direct_vm.sender = direct_alice
    direct_vm.value = REWARD
    contract.add_step_from_recipe(
        WORKFLOW_ID,
        "build",
        addr(direct_bob),
        recipe_hash,
        "eip155:1:0x0000000000000000000000000000000000000001#agent-42",
        "https://agent.example/.well-known/agent-card.json",
        "",
        "",
        future_deadline(),
    )
    direct_vm.value = 0

    step = contract.get_step(WORKFLOW_ID, "build")
    assert step.recipe_id == "software-delivery"
    assert step.recipe_version == "v1"
    assert step.recipe_hash == recipe_hash
    assert step.role_label == "Delivery Agent"
    assert step.requirement == REQUIREMENT
    assert step.rubric == RUBRIC
    assert int(step.reward) == REWARD
    assert int(step.bond_required) == BOND


def test_unknown_recipe_hash_cannot_create_step(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy("contracts/resolve_graph_v2.py")
    create_workflow(direct_vm, contract, direct_alice)

    direct_vm.sender = direct_alice
    direct_vm.value = REWARD
    with direct_vm.expect_revert("Recipe not found"):
        contract.add_step_from_recipe(
            WORKFLOW_ID,
            "build",
            addr(direct_bob),
            "0" * 64,
            "",
            "",
            "",
            "",
            future_deadline(),
        )
    direct_vm.value = 0

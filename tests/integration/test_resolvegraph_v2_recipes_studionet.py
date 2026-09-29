"""Live Studionet proof for the ResolveGraph V2 immutable recipe registry.

This test intentionally isolates the V2 registry from the canonical V1 settlement
contract. It deploys ResolveGraphV2, registers three reusable content-addressed
recipes, and proves that a workflow step can be instantiated from the frozen
recipe hash without changing the active V1 production contract.
"""

import hashlib
import time
from pathlib import Path

import pytest
from genlayer_py import create_account
from gltest import get_contract_factory
from gltest.assertions import tx_execution_succeeded


_SECP256K1_N = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141


def _field(value, name):
    if isinstance(value, dict):
        return value.get(name)
    return getattr(value, name)


def _studionet_account(label: str):
    digest = hashlib.sha256(
        ("resolvegraph-v2-recipe-proof:" + label).encode()
    ).digest()
    key_int = (int.from_bytes(digest, "big") % (_SECP256K1_N - 1)) + 1
    return create_account("0x" + key_int.to_bytes(32, "big").hex())


def _recipe_hash(recipe):
    fields = (
        "RG_RECIPE_V1",
        recipe["id"],
        recipe["version"],
        recipe["name"],
        recipe["role"],
        recipe["requirement"],
        recipe["rubric"],
        recipe["evidence_type"].upper(),
        "3600",
        "5",
        "STEP_REWARD_PLUS_LOCKED_BOND",
    )
    payload = "".join(f"{len(str(value))}:{value}" for value in fields)
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


RECIPES = [
    {
        "id": "software-delivery",
        "version": "v1",
        "name": "Software delivery",
        "role": "Delivery Agent",
        "requirement": (
            "Deliver the agreed software change and publish immutable evidence "
            "that identifies the exact revision being reviewed."
        ),
        "rubric": (
            "PASS only when the primary source proves the requested change exists "
            "in the identified revision and the independent support source "
            "corroborates the result."
        ),
        "evidence_type": "github_commit",
    },
    {
        "id": "research-verification",
        "version": "v1",
        "name": "Research verification",
        "role": "Research Agent",
        "requirement": (
            "Produce a concise research conclusion supported by public primary "
            "evidence and an independent corroborating source."
        ),
        "rubric": (
            "PASS only when the conclusion directly answers the stated objective, "
            "the cited evidence supports the material claims, and the independent "
            "source corroborates the decisive facts."
        ),
        "evidence_type": "public_research",
    },
    {
        "id": "service-sla",
        "version": "v1",
        "name": "Service SLA",
        "role": "Service Agent",
        "requirement": (
            "Satisfy the stated service-level commitment before the deadline and "
            "publish evidence of the delivered result."
        ),
        "rubric": (
            "PASS only when the evidence proves the service commitment was met "
            "within scope and time; otherwise preserve the causal failure class "
            "for downstream attribution."
        ),
        "evidence_type": "service_sla",
    },
]


@pytest.mark.integration
def test_resolvegraph_v2_recipe_registry_on_studionet():
    sponsor_account = _studionet_account("sponsor")
    agent_account = _studionet_account("agent")

    factory = get_contract_factory("ResolveGraphV2")
    contract = factory.deploy(account=sponsor_account, consensus_max_rotations=4)
    sponsor = contract.connect(account=sponsor_account)

    Path("artifacts").mkdir(parents=True, exist_ok=True)
    Path("artifacts/resolvegraph-v2-live-address.txt").write_text(
        str(contract.address),
        encoding="utf-8",
    )
    print("RG_V2_CONTRACT=" + str(contract.address), flush=True)
    print("RG_V2_PUBLISHER=" + str(sponsor_account.address), flush=True)

    registered = []
    for recipe in RECIPES:
        tx = sponsor.register_recipe(
            args=[
                recipe["id"],
                recipe["version"],
                recipe["name"],
                recipe["role"],
                recipe["requirement"],
                recipe["rubric"],
                recipe["evidence_type"],
            ]
        ).transact(wait_interval=10000, wait_retries=60)
        assert tx_execution_succeeded(tx)

        index = len(registered)
        recipe_hash = contract.get_recipe_hash_by_index(args=[index]).call()
        expected = _recipe_hash(recipe)
        assert str(recipe_hash) == expected

        stored = contract.get_recipe(args=[recipe_hash]).call()
        assert str(_field(stored, "id")) == recipe["id"]
        assert str(_field(stored, "version")) == recipe["version"]
        assert str(_field(stored, "requirement")) == recipe["requirement"]
        assert str(_field(stored, "rubric")) == recipe["rubric"]
        assert str(_field(stored, "recipe_hash")) == expected
        assert int(_field(stored, "challenge_window_seconds")) == 3600
        assert int(_field(stored, "bond_divisor")) == 5

        registered.append(expected)
        print(
            "RG_V2_RECIPE_" + recipe["id"].upper().replace("-", "_") + "=" + expected,
            flush=True,
        )

    assert int(contract.get_recipe_count().call()) == 3

    workflow_id = "rg-v2-live-recipe-v1"
    tx = sponsor.create_workflow(
        args=[
            workflow_id,
            "ResolveGraph V2 immutable recipe proof",
            "Instantiate a real workflow step from a content-addressed immutable policy recipe and prove the exact recipe hash survives in step state.",
        ]
    ).transact(wait_interval=10000, wait_retries=60)
    assert tx_execution_succeeded(tx)

    reward = 1_000_000_000_000
    tx = sponsor.add_step_from_recipe(
        args=[
            workflow_id,
            "delivery",
            agent_account.address,
            registered[0],
            "eip155:1:0x0000000000000000000000000000000000000001#agent-42",
            "https://agent.example/.well-known/agent-card.json",
            "",
            "",
            int(time.time()) + 6 * 60 * 60,
        ]
    ).transact(value=reward, wait_interval=10000, wait_retries=60)
    assert tx_execution_succeeded(tx)

    step = contract.get_step(args=[workflow_id, "delivery"]).call()
    assert str(_field(step, "recipe_id")) == "software-delivery"
    assert str(_field(step, "recipe_version")) == "v1"
    assert str(_field(step, "recipe_hash")) == registered[0]
    assert str(_field(step, "requirement")) == RECIPES[0]["requirement"]
    assert str(_field(step, "rubric")) == RECIPES[0]["rubric"]
    assert int(_field(step, "bond_required")) == reward // 5

    tx = sponsor.seal_workflow(args=[workflow_id]).transact(
        wait_interval=10000,
        wait_retries=60,
    )
    assert tx_execution_succeeded(tx)

    workflow = contract.get_workflow(args=[workflow_id]).call()
    assert str(_field(workflow, "status")) == "ACTIVE"
    assert str(_field(workflow, "policy_version")) == "RG_V2_IMMUTABLE_RECIPES"

    print("RG_V2_WORKFLOW=" + workflow_id, flush=True)
    print("RG_V2_WORKFLOW_STATUS=" + str(_field(workflow, "status")), flush=True)
    print("RG_V2_STEP_RECIPE_HASH=" + str(_field(step, "recipe_hash")), flush=True)

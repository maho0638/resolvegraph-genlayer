from datetime import datetime, timedelta, timezone

import pytest


ESCROW = 5000
TX = "0x" + "11" * 32
TX2 = "0x" + "22" * 32
BLOCK = "0x" + "aa" * 32
ADAPTER = "ab" * 32
FROM = "0x" + "12" * 20
TO = "0x" + "34" * 20
TOPIC = "0x" + "56" * 32


@pytest.fixture(autouse=True)
def strict_direct_vm(direct_vm):
    direct_vm.strict_mocks = True
    direct_vm.check_pickling = True


def addr(account):
    return "0x" + account.hex()


def future(minutes=60):
    return int((datetime.now(timezone.utc) + timedelta(minutes=minutes)).timestamp())


def create(direct_vm, contract, sponsor, beneficiary, relayer, intent="intent-1", confirmations=12):
    direct_vm.sender = sponsor
    direct_vm.value = ESCROW
    contract.create_intent(
        intent,
        addr(beneficiary),
        addr(relayer),
        1,
        FROM,
        TO,
        TO,
        TOPIC,
        0,
        confirmations,
        future(),
    )
    direct_vm.value = 0
    direct_vm.deal(contract.address, ESCROW)


def prove(direct_vm, contract, relayer, intent="intent-1", tx=TX, confirmations=12, event_found=True):
    direct_vm.sender = relayer
    return contract.submit_relayer_proof(
        intent,
        tx,
        15725407,
        BLOCK,
        FROM,
        TO,
        0,
        confirmations,
        event_found,
        ADAPTER,
    )


def test_create_intent_records_relayer_and_policy(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie):
    contract = direct_deploy("contracts/cross_chain_settlement.py")
    create(direct_vm, contract, direct_alice, direct_bob, direct_charlie)
    item = contract.get_intent("intent-1")
    assert item.status == "ACTIVE"
    assert item.policy_version == "RG_XCHAIN_RELAYER_V1"
    assert int(item.escrow) == ESCROW
    assert int(contract.get_intent_count()) == 1


def test_only_configured_relayer_can_submit(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie):
    contract = direct_deploy("contracts/cross_chain_settlement.py")
    create(direct_vm, contract, direct_alice, direct_bob, direct_charlie)
    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("configured relayer"):
        contract.submit_relayer_proof("intent-1", TX, 1, BLOCK, FROM, TO, 0, 12, True, ADAPTER)


def test_proof_requires_expected_fields_event_and_confirmations(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie):
    contract = direct_deploy("contracts/cross_chain_settlement.py")
    create(direct_vm, contract, direct_alice, direct_bob, direct_charlie, confirmations=12)

    direct_vm.sender = direct_charlie
    with direct_vm.expect_revert("insufficient confirmations"):
        contract.submit_relayer_proof("intent-1", TX, 1, BLOCK, FROM, TO, 0, 11, True, ADAPTER)

    with direct_vm.expect_revert("Expected external event"):
        contract.submit_relayer_proof("intent-1", TX, 1, BLOCK, FROM, TO, 0, 12, False, ADAPTER)

    with direct_vm.expect_revert("recipient"):
        contract.submit_relayer_proof("intent-1", TX, 1, BLOCK, FROM, "0x" + "99" * 20, 0, 12, True, ADAPTER)


def test_external_tx_replay_is_rejected_across_intents(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie):
    contract = direct_deploy("contracts/cross_chain_settlement.py")
    create(direct_vm, contract, direct_alice, direct_bob, direct_charlie, "intent-1")
    prove(direct_vm, contract, direct_charlie, "intent-1", TX, 100)

    create(direct_vm, contract, direct_alice, direct_bob, direct_charlie, "intent-2")
    direct_vm.sender = direct_charlie
    with direct_vm.expect_revert("already consumed"):
        contract.submit_relayer_proof("intent-2", TX, 15725407, BLOCK, FROM, TO, 0, 100, True, ADAPTER)


def test_deep_confirmation_proof_can_finalize_immediately(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie):
    contract = direct_deploy("contracts/cross_chain_settlement.py")
    create(direct_vm, contract, direct_alice, direct_bob, direct_charlie, confirmations=12)
    proof = prove(direct_vm, contract, direct_charlie, confirmations=100)
    assert len(proof) == 64

    direct_vm.sender = direct_alice
    amount = contract.finalize_intent("intent-1")
    assert int(amount) == ESCROW
    assert contract.get_intent("intent-1").status == "SETTLED"
    assert contract.is_external_tx_consumed(1, TX) is True


def test_shallow_proof_can_be_reorged_then_refunded(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie):
    contract = direct_deploy("contracts/cross_chain_settlement.py")
    create(direct_vm, contract, direct_alice, direct_bob, direct_charlie, confirmations=12)
    prove(direct_vm, contract, direct_charlie, confirmations=12)

    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("Reorg dispute"):
        contract.finalize_intent("intent-1")

    direct_vm.sender = direct_charlie
    contract.report_reorg("intent-1", "Canonical chain reorganized the attested block before finality.")

    direct_vm.sender = direct_alice
    assert int(contract.refund_intent("intent-1")) == ESCROW
    assert contract.get_intent("intent-1").status == "REFUNDED"


def test_shallow_proof_finalizes_after_reorg_window(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie):
    contract = direct_deploy("contracts/cross_chain_settlement.py")
    create(direct_vm, contract, direct_alice, direct_bob, direct_charlie, confirmations=12)
    prove(direct_vm, contract, direct_charlie, confirmations=12)

    direct_vm.warp((datetime.now(timezone.utc) + timedelta(minutes=20)).isoformat())
    direct_vm.sender = direct_bob
    assert int(contract.finalize_intent("intent-1")) == ESCROW
    assert contract.get_intent("intent-1").status == "SETTLED"


def test_expired_unproven_intent_refunds_sponsor(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie):
    contract = direct_deploy("contracts/cross_chain_settlement.py")
    create(direct_vm, contract, direct_alice, direct_bob, direct_charlie)
    direct_vm.warp((datetime.now(timezone.utc) + timedelta(hours=2)).isoformat())
    direct_vm.sender = direct_alice
    assert int(contract.refund_intent("intent-1")) == ESCROW
    assert contract.get_intent("intent-1").status == "REFUNDED"

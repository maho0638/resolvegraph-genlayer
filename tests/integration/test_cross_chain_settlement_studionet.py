"""Live Studionet proof for relayer-attested cross-chain-conditioned GEN settlement."""

import hashlib
from pathlib import Path

import pytest
from genlayer_py import create_account
from gltest import get_contract_factory
from gltest.assertions import tx_execution_succeeded


_SECP256K1_N = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141

ETH_TX = "0x85d995eba9763907fdf35cd2034144dd9d53ce32cbec21349d4b12823c6860c5"
ETH_BLOCK = 15725407
ETH_BLOCK_HASH = "0xa957d47df264a31badc3ae823e10ac1d444b098d9b73d204c40426e57f47e8c3"
ETH_FROM = "0x6221a9c005f6e47eb398fd867784cacfdcfff4e7"
WETH = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"
APPROVAL_TOPIC = "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925"
ADAPTER_DIGEST = "702b57448a292ae70ec6d7eb7ff11527df7d2391624ec78a919def40ac60133e"


def account(label: str):
    digest = hashlib.sha256(("resolvegraph-xchain-proof:" + label).encode()).digest()
    key_int = (int.from_bytes(digest, "big") % (_SECP256K1_N - 1)) + 1
    return create_account("0x" + key_int.to_bytes(32, "big").hex())


def field(value, name):
    if isinstance(value, dict):
        return value.get(name)
    return getattr(value, name)


@pytest.mark.integration
def test_cross_chain_conditioned_settlement_on_studionet():
    import time

    sponsor_account = account("sponsor")
    beneficiary_account = account("beneficiary")
    relayer_account = account("relayer")

    factory = get_contract_factory("CrossChainSettlementAdapter")
    contract = factory.deploy(account=sponsor_account)

    Path("artifacts").mkdir(parents=True, exist_ok=True)
    Path("artifacts/resolvegraph-xchain-live-address.txt").write_text(
        str(contract.address), encoding="utf-8"
    )
    print("RG_XCHAIN_CONTRACT=" + str(contract.address), flush=True)

    sponsor = contract.connect(account=sponsor_account)
    relayer = contract.connect(account=relayer_account)
    beneficiary = contract.connect(account=beneficiary_account)

    intent_id = "rg-xchain-mainnet-proof-v1"
    escrow = 1_000_000_000_000

    tx = sponsor.create_intent(
        args=[
            intent_id,
            beneficiary_account.address,
            relayer_account.address,
            1,
            ETH_FROM,
            WETH,
            WETH,
            APPROVAL_TOPIC,
            0,
            12,
            int(time.time()) + 6 * 60 * 60,
        ]
    ).transact(value=escrow, wait_interval=10000, wait_retries=60)
    assert tx_execution_succeeded(tx)

    tx = relayer.submit_relayer_proof(
        args=[
            intent_id,
            ETH_TX,
            ETH_BLOCK,
            ETH_BLOCK_HASH,
            ETH_FROM,
            WETH,
            0,
            10_000_000,
            True,
            ADAPTER_DIGEST,
        ]
    ).transact(wait_interval=10000, wait_retries=60)
    assert tx_execution_succeeded(tx)

    proven = contract.get_intent(args=[intent_id]).call()
    assert str(field(proven, "status")) == "PROVEN"
    assert str(field(proven, "external_tx_hash")).lower() == ETH_TX
    assert str(field(proven, "source_adapter_digest")) == ADAPTER_DIGEST
    assert int(field(proven, "observed_confirmations")) == 10_000_000
    assert int(field(proven, "finalize_after")) <= int(time.time()) + 10

    tx = beneficiary.finalize_intent(args=[intent_id]).transact(
        wait_interval=10000, wait_retries=60
    )
    assert tx_execution_succeeded(tx)

    settled = contract.get_intent(args=[intent_id]).call()
    assert str(field(settled, "status")) == "SETTLED"
    assert contract.is_external_tx_consumed(args=[1, ETH_TX]).call() is True

    print("RG_XCHAIN_INTENT=" + intent_id, flush=True)
    print("RG_XCHAIN_SOURCE_TX=" + ETH_TX, flush=True)
    print("RG_XCHAIN_ADAPTER_DIGEST=" + ADAPTER_DIGEST, flush=True)
    print("RG_XCHAIN_FINAL_STATUS=SETTLED", flush=True)

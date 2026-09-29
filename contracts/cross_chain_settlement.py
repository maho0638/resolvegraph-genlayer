# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

import hashlib
from dataclasses import dataclass
from datetime import datetime, timezone
from genlayer import *


MAX_INTENTS = 128
MAX_EXPIRY_SECONDS = 30 * 24 * 60 * 60
MAX_CONFIRMATIONS = 4096
REORG_DISPUTE_SECONDS = 15 * 60
DEEP_FINALITY_MARGIN = 64
POLICY_VERSION = "RG_XCHAIN_RELAYER_V1"


@gl.evm.contract_interface
class _Recipient:
    class View:
        pass

    class Write:
        pass


@allow_storage
@dataclass
class SettlementIntent:
    id: str
    sponsor: Address
    beneficiary: Address
    relayer: Address
    source_chain_id: u256
    expected_from: str
    expected_to: str
    expected_event_contract: str
    expected_event_topic0: str
    min_value_wei: u256
    required_confirmations: u256
    expires_at: u256
    escrow: u256
    status: str
    external_tx_hash: str
    external_block_number: u256
    external_block_hash: str
    external_from: str
    external_to: str
    external_value_wei: u256
    observed_confirmations: u256
    source_adapter_digest: str
    proof_digest: str
    proof_submitted_at: u256
    finalize_after: u256
    settled_at: u256
    refunded_at: u256
    reorg_reason: str
    policy_version: str


class CrossChainSettlementAdapter(gl.Contract):
    intents: TreeMap[str, SettlementIntent]
    intent_index: TreeMap[str, str]
    intent_count: u256
    consumed_external_txs: TreeMap[str, bool]

    def __init__(self):
        pass

    def _now(self) -> int:
        return int(datetime.now(timezone.utc).timestamp())

    def _zero_address(self) -> Address:
        return Address(b"\x00" * 20)

    def _parse_address(self, address) -> Address:
        if type(address) in (int, str):
            if isinstance(address, int):
                address = "0x" + format(address, "040x")
            address = Address(address)
        return address

    def _external_address(self, value: str) -> str:
        value = value.strip().lower()
        if not value:
            return ""
        if len(value) != 42 or not value.startswith("0x"):
            raise gl.vm.UserError("External address must be 20-byte 0x hex")
        try:
            int(value[2:], 16)
        except Exception:
            raise gl.vm.UserError("External address must be 20-byte 0x hex")
        return value

    def _hash32(self, value: str, label: str) -> str:
        value = value.strip().lower()
        if len(value) != 66 or not value.startswith("0x"):
            raise gl.vm.UserError(label + " must be 32-byte 0x hex")
        try:
            int(value[2:], 16)
        except Exception:
            raise gl.vm.UserError(label + " must be 32-byte 0x hex")
        return value

    def _digest64(self, value: str, label: str) -> str:
        value = value.strip().lower()
        if len(value) != 64:
            raise gl.vm.UserError(label + " must be 64-character SHA-256 hex")
        try:
            int(value, 16)
        except Exception:
            raise gl.vm.UserError(label + " must be 64-character SHA-256 hex")
        return value

    def _tx_key(self, chain_id: int, tx_hash: str) -> str:
        return str(chain_id) + ":" + tx_hash.lower()

    def _proof_digest(
        self,
        intent_id: str,
        source_chain_id: int,
        tx_hash: str,
        block_number: int,
        block_hash: str,
        external_from: str,
        external_to: str,
        value_wei: int,
        confirmations: int,
        event_found: bool,
        source_adapter_digest: str,
    ) -> str:
        fields = (
            "RG_XCHAIN_PROOF_V1",
            intent_id,
            str(source_chain_id),
            tx_hash,
            str(block_number),
            block_hash,
            external_from,
            external_to,
            str(value_wei),
            str(confirmations),
            "true" if event_found else "false",
            source_adapter_digest,
        )
        payload = ""
        for field in fields:
            text = str(field)
            payload += str(len(text)) + ":" + text
        return hashlib.sha256(payload.encode("utf-8")).hexdigest()

    @gl.public.write.payable
    def create_intent(
        self,
        intent_id: str,
        beneficiary: Address,
        relayer: Address,
        source_chain_id: u256,
        expected_from: str,
        expected_to: str,
        expected_event_contract: str,
        expected_event_topic0: str,
        min_value_wei: u256,
        required_confirmations: u256,
        expires_at: u256,
    ) -> None:
        intent_id = intent_id.strip()
        if not intent_id or len(intent_id) > 96:
            raise gl.vm.UserError("Invalid intent ID")
        if intent_id in self.intents:
            raise gl.vm.UserError("Intent already exists")
        if int(self.intent_count) >= MAX_INTENTS:
            raise gl.vm.UserError("Maximum intent count reached")
        if gl.message.value == u256(0):
            raise gl.vm.UserError("Escrow must be greater than zero")

        beneficiary_addr = self._parse_address(beneficiary)
        relayer_addr = self._parse_address(relayer)
        if beneficiary_addr == self._zero_address() or relayer_addr == self._zero_address():
            raise gl.vm.UserError("Beneficiary and relayer cannot be zero address")

        chain_id = int(source_chain_id)
        if chain_id not in (1, 11155111):
            raise gl.vm.UserError("Supported source chains are Ethereum and Sepolia")

        expected_from = self._external_address(expected_from)
        expected_to = self._external_address(expected_to)
        expected_event_contract = self._external_address(expected_event_contract)
        expected_event_topic0 = expected_event_topic0.strip().lower()
        if expected_event_topic0:
            expected_event_topic0 = self._hash32(
                expected_event_topic0, "Expected event topic"
            )
            if not expected_event_contract:
                raise gl.vm.UserError("Event contract is required with event topic")

        confirmations = int(required_confirmations)
        if confirmations < 1 or confirmations > MAX_CONFIRMATIONS:
            raise gl.vm.UserError("Required confirmations out of range")

        now = self._now()
        expiry = int(expires_at)
        if expiry <= now:
            raise gl.vm.UserError("Intent expiry must be in the future")
        if expiry > now + MAX_EXPIRY_SECONDS:
            raise gl.vm.UserError("Intent expiry cannot exceed 30 days")

        index = int(self.intent_count)
        self.intents[intent_id] = SettlementIntent(
            id=intent_id,
            sponsor=gl.message.sender_address,
            beneficiary=beneficiary_addr,
            relayer=relayer_addr,
            source_chain_id=source_chain_id,
            expected_from=expected_from,
            expected_to=expected_to,
            expected_event_contract=expected_event_contract,
            expected_event_topic0=expected_event_topic0,
            min_value_wei=min_value_wei,
            required_confirmations=required_confirmations,
            expires_at=expires_at,
            escrow=gl.message.value,
            status="ACTIVE",
            external_tx_hash="",
            external_block_number=u256(0),
            external_block_hash="",
            external_from="",
            external_to="",
            external_value_wei=u256(0),
            observed_confirmations=u256(0),
            source_adapter_digest="",
            proof_digest="",
            proof_submitted_at=u256(0),
            finalize_after=u256(0),
            settled_at=u256(0),
            refunded_at=u256(0),
            reorg_reason="",
            policy_version=POLICY_VERSION,
        )
        self.intent_index[str(index)] = intent_id
        self.intent_count = u256(index + 1)

    @gl.public.write
    def submit_relayer_proof(
        self,
        intent_id: str,
        tx_hash: str,
        block_number: u256,
        block_hash: str,
        external_from: str,
        external_to: str,
        value_wei: u256,
        observed_confirmations: u256,
        event_found: bool,
        source_adapter_digest: str,
    ) -> str:
        if intent_id not in self.intents:
            raise gl.vm.UserError("Intent not found")
        intent = self.intents[intent_id]
        if intent.status != "ACTIVE":
            raise gl.vm.UserError("Intent is not active")
        if intent.relayer != gl.message.sender_address:
            raise gl.vm.UserError("Only the configured relayer can submit proof")
        if self._now() > int(intent.expires_at):
            raise gl.vm.UserError("Intent has expired")

        tx_hash = self._hash32(tx_hash, "Transaction hash")
        block_hash = self._hash32(block_hash, "Block hash")
        source_adapter_digest = self._digest64(
            source_adapter_digest, "Source adapter digest"
        )
        external_from = self._external_address(external_from)
        external_to = self._external_address(external_to)

        if intent.expected_from and external_from != intent.expected_from:
            raise gl.vm.UserError("External sender does not match intent")
        if intent.expected_to and external_to != intent.expected_to:
            raise gl.vm.UserError("External recipient does not match intent")
        if int(value_wei) < int(intent.min_value_wei):
            raise gl.vm.UserError("External value is below intent minimum")
        if int(observed_confirmations) < int(intent.required_confirmations):
            raise gl.vm.UserError("External proof has insufficient confirmations")
        if intent.expected_event_topic0 and not event_found:
            raise gl.vm.UserError("Expected external event was not found")
        if int(block_number) <= 0:
            raise gl.vm.UserError("External block number is invalid")

        tx_key = self._tx_key(int(intent.source_chain_id), tx_hash)
        if tx_key in self.consumed_external_txs and self.consumed_external_txs[tx_key]:
            raise gl.vm.UserError("External transaction proof already consumed")

        proof_digest = self._proof_digest(
            intent_id,
            int(intent.source_chain_id),
            tx_hash,
            int(block_number),
            block_hash,
            external_from,
            external_to,
            int(value_wei),
            int(observed_confirmations),
            event_found,
            source_adapter_digest,
        )

        now = self._now()
        margin = int(observed_confirmations) - int(intent.required_confirmations)
        finality_delay = 0 if margin >= DEEP_FINALITY_MARGIN else REORG_DISPUTE_SECONDS

        self.consumed_external_txs[tx_key] = True
        intent.external_tx_hash = tx_hash
        intent.external_block_number = block_number
        intent.external_block_hash = block_hash
        intent.external_from = external_from
        intent.external_to = external_to
        intent.external_value_wei = value_wei
        intent.observed_confirmations = observed_confirmations
        intent.source_adapter_digest = source_adapter_digest
        intent.proof_digest = proof_digest
        intent.proof_submitted_at = u256(now)
        intent.finalize_after = u256(now + finality_delay)
        intent.status = "PROVEN"
        return proof_digest

    @gl.public.write
    def report_reorg(self, intent_id: str, reason: str) -> None:
        if intent_id not in self.intents:
            raise gl.vm.UserError("Intent not found")
        intent = self.intents[intent_id]
        if intent.status != "PROVEN":
            raise gl.vm.UserError("Intent proof is not pending finality")
        if intent.relayer != gl.message.sender_address:
            raise gl.vm.UserError("Only the configured relayer can report reorg")
        if self._now() >= int(intent.finalize_after):
            raise gl.vm.UserError("Proof finality window is closed")
        reason = reason.strip()
        if len(reason) < 10 or len(reason) > 500:
            raise gl.vm.UserError("Reorg reason must be 10-500 characters")
        intent.reorg_reason = reason
        intent.status = "REORGED"

    @gl.public.write
    def finalize_intent(self, intent_id: str) -> u256:
        if intent_id not in self.intents:
            raise gl.vm.UserError("Intent not found")
        intent = self.intents[intent_id]
        if intent.status != "PROVEN":
            raise gl.vm.UserError("Intent is not proven")
        if self._now() < int(intent.finalize_after):
            raise gl.vm.UserError("Reorg dispute window is still active")
        if gl.message.sender_address not in (intent.sponsor, intent.beneficiary):
            raise gl.vm.UserError("Only sponsor or beneficiary can finalize")
        if self.balance < intent.escrow:
            raise gl.vm.UserError("Contract balance is insufficient")

        amount = intent.escrow
        intent.status = "SETTLED"
        intent.settled_at = u256(self._now())
        _Recipient(intent.beneficiary).emit_transfer(value=amount)
        return amount

    @gl.public.write
    def refund_intent(self, intent_id: str) -> u256:
        if intent_id not in self.intents:
            raise gl.vm.UserError("Intent not found")
        intent = self.intents[intent_id]
        if intent.sponsor != gl.message.sender_address:
            raise gl.vm.UserError("Only sponsor can refund")
        refundable = (
            intent.status == "REORGED"
            or (intent.status == "ACTIVE" and self._now() > int(intent.expires_at))
        )
        if not refundable:
            raise gl.vm.UserError("Intent is not refundable")
        if self.balance < intent.escrow:
            raise gl.vm.UserError("Contract balance is insufficient")

        amount = intent.escrow
        intent.status = "REFUNDED"
        intent.refunded_at = u256(self._now())
        _Recipient(intent.sponsor).emit_transfer(value=amount)
        return amount

    @gl.public.view
    def get_intent(self, intent_id: str) -> SettlementIntent:
        if intent_id not in self.intents:
            raise gl.vm.UserError("Intent not found")
        return self.intents[intent_id]

    @gl.public.view
    def get_intent_count(self) -> u256:
        return self.intent_count

    @gl.public.view
    def get_intent_id_by_index(self, index: u256) -> str:
        if int(index) < 0 or int(index) >= int(self.intent_count):
            raise gl.vm.UserError("Intent index out of range")
        return self.intent_index[str(int(index))]

    @gl.public.view
    def is_external_tx_consumed(self, source_chain_id: u256, tx_hash: str) -> bool:
        tx_hash = self._hash32(tx_hash, "Transaction hash")
        key = self._tx_key(int(source_chain_id), tx_hash)
        if key not in self.consumed_external_txs:
            return False
        return self.consumed_external_txs[key]

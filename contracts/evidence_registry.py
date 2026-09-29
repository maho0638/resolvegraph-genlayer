# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

import hashlib
from dataclasses import dataclass
from datetime import datetime, timezone
from genlayer import *


MAX_RECORDS = 256
MAX_WORKFLOW_ID = 120
MAX_STEP_ID = 96
MAX_URL = 1200
MAX_CONTENT_TYPE = 120
MAX_AUTHOR = 160
MAX_RUBRIC_RELATION = 700
MAX_IMMUTABLE_REF = 180

SOURCE_TYPES = (
    "WEB",
    "GITHUB_COMMIT",
    "GITHUB_PR",
    "GITHUB_CI",
    "ETHEREUM_TX",
    "ARTIFACT",
)
ROLES = ("PRIMARY", "SUPPORT", "CHALLENGE")
REF_KINDS = (
    "SHA256",
    "GIT_COMMIT_SHA",
    "GITHUB_PR_HEAD_SHA",
    "GITHUB_RUN_ID",
    "ETH_TX_HASH",
    "IPFS_CID",
    "NONE",
)


@allow_storage
@dataclass
class EvidenceArchive:
    digest: str
    subject_contract: Address
    workflow_id: str
    step_id: str
    decision_round: u256
    role: str
    source_type: str
    source_url: str
    content_type: str
    content_hash: str
    immutable_ref_kind: str
    immutable_ref: str
    author: str
    rubric_relation: str
    fetched_at: u256
    publisher: Address
    created_at: u256


class ResolveGraphEvidenceRegistry(gl.Contract):
    records: TreeMap[str, EvidenceArchive]
    record_index: TreeMap[str, str]
    slot_index: TreeMap[str, str]
    record_count: u256

    def __init__(self):
        pass

    def _now(self) -> int:
        return int(datetime.now(timezone.utc).timestamp())

    def _parse_address(self, address) -> Address:
        if type(address) in (int, str):
            if isinstance(address, int):
                address = "0x" + format(address, "040x")
            address = Address(address)
        return address

    def _slot_key(
        self,
        subject_contract: Address,
        workflow_id: str,
        step_id: str,
        decision_round: u256,
        role: str,
    ) -> str:
        return (
            str(subject_contract).lower()
            + "|"
            + workflow_id
            + "|"
            + step_id
            + "|"
            + str(int(decision_round))
            + "|"
            + role
        )

    def _canonical_digest(
        self,
        subject_contract: Address,
        workflow_id: str,
        step_id: str,
        decision_round: u256,
        role: str,
        source_type: str,
        source_url: str,
        content_type: str,
        content_hash: str,
        immutable_ref_kind: str,
        immutable_ref: str,
        author: str,
        rubric_relation: str,
        fetched_at: u256,
    ) -> str:
        fields = (
            "RG_EVIDENCE_ARCHIVE_V1",
            str(subject_contract).lower(),
            workflow_id,
            step_id,
            str(int(decision_round)),
            role,
            source_type,
            source_url,
            content_type,
            content_hash,
            immutable_ref_kind,
            immutable_ref,
            author,
            rubric_relation,
            str(int(fetched_at)),
        )
        payload = ""
        for value in fields:
            text = str(value)
            payload += str(len(text)) + ":" + text
        return hashlib.sha256(payload.encode("utf-8")).hexdigest()

    def _validate_hex(self, value: str, length: int, label: str) -> None:
        if len(value) != length:
            raise gl.vm.UserError(label + " has invalid length")
        for ch in value.lower():
            if ch not in "0123456789abcdef":
                raise gl.vm.UserError(label + " must be lowercase hex")

    @gl.public.write
    def register_evidence(
        self,
        subject_contract: Address,
        workflow_id: str,
        step_id: str,
        decision_round: u256,
        role: str,
        source_type: str,
        source_url: str,
        content_type: str,
        content_hash: str,
        immutable_ref_kind: str,
        immutable_ref: str,
        author: str,
        rubric_relation: str,
        fetched_at: u256,
    ) -> str:
        if int(self.record_count) >= MAX_RECORDS:
            raise gl.vm.UserError("Maximum evidence archive count reached")

        subject_contract = self._parse_address(subject_contract)
        workflow_id = workflow_id.strip()
        step_id = step_id.strip()
        role = role.strip().upper()
        source_type = source_type.strip().upper()
        source_url = source_url.strip()
        content_type = content_type.strip().lower()
        content_hash = content_hash.strip().lower()
        immutable_ref_kind = immutable_ref_kind.strip().upper()
        immutable_ref = immutable_ref.strip()
        author = author.strip()
        rubric_relation = rubric_relation.strip()

        if not workflow_id or len(workflow_id) > MAX_WORKFLOW_ID:
            raise gl.vm.UserError("Invalid workflow ID")
        if not step_id or len(step_id) > MAX_STEP_ID:
            raise gl.vm.UserError("Invalid step ID")
        if int(decision_round) < 1 or int(decision_round) > 16:
            raise gl.vm.UserError("Decision round must be 1-16")
        if role not in ROLES:
            raise gl.vm.UserError("Unsupported evidence role")
        if source_type not in SOURCE_TYPES:
            raise gl.vm.UserError("Unsupported source type")
        if immutable_ref_kind not in REF_KINDS:
            raise gl.vm.UserError("Unsupported immutable reference kind")
        if not source_url.startswith("https://") or len(source_url) > MAX_URL:
            raise gl.vm.UserError("Evidence URL must be bounded HTTPS")
        if not content_type or len(content_type) > MAX_CONTENT_TYPE:
            raise gl.vm.UserError("Invalid content type")
        self._validate_hex(content_hash, 64, "Content hash")
        if len(immutable_ref) > MAX_IMMUTABLE_REF:
            raise gl.vm.UserError("Immutable reference too long")
        if immutable_ref_kind != "NONE" and not immutable_ref:
            raise gl.vm.UserError("Immutable reference is required")
        if immutable_ref_kind == "GIT_COMMIT_SHA":
            self._validate_hex(immutable_ref.lower(), 40, "Git commit SHA")
        if immutable_ref_kind == "GITHUB_PR_HEAD_SHA":
            self._validate_hex(immutable_ref.lower(), 40, "GitHub PR head SHA")
        if immutable_ref_kind == "ETH_TX_HASH":
            ref = immutable_ref.lower()
            if ref.startswith("0x"):
                ref = ref[2:]
            self._validate_hex(ref, 64, "Ethereum transaction hash")
        if len(author) > MAX_AUTHOR:
            raise gl.vm.UserError("Author field too long")
        if not rubric_relation or len(rubric_relation) > MAX_RUBRIC_RELATION:
            raise gl.vm.UserError("Rubric relation is required and bounded")

        now = self._now()
        fetched = int(fetched_at)
        if fetched <= 0 or fetched > now + 300:
            raise gl.vm.UserError("Fetched-at timestamp is invalid")
        if fetched < now - 366 * 24 * 60 * 60:
            raise gl.vm.UserError("Fetched-at timestamp is too old")

        slot = self._slot_key(
            subject_contract,
            workflow_id,
            step_id,
            decision_round,
            role,
        )
        if slot in self.slot_index:
            raise gl.vm.UserError("Evidence slot is already archived")

        digest = self._canonical_digest(
            subject_contract,
            workflow_id,
            step_id,
            decision_round,
            role,
            source_type,
            source_url,
            content_type,
            content_hash,
            immutable_ref_kind,
            immutable_ref,
            author,
            rubric_relation,
            fetched_at,
        )
        if digest in self.records:
            raise gl.vm.UserError("Evidence digest is already registered")

        index = int(self.record_count)
        self.records[digest] = EvidenceArchive(
            digest=digest,
            subject_contract=subject_contract,
            workflow_id=workflow_id,
            step_id=step_id,
            decision_round=decision_round,
            role=role,
            source_type=source_type,
            source_url=source_url,
            content_type=content_type,
            content_hash=content_hash,
            immutable_ref_kind=immutable_ref_kind,
            immutable_ref=immutable_ref,
            author=author,
            rubric_relation=rubric_relation,
            fetched_at=fetched_at,
            publisher=gl.message.sender_address,
            created_at=u256(now),
        )
        self.record_index[str(index)] = digest
        self.slot_index[slot] = digest
        self.record_count = u256(index + 1)
        return digest

    @gl.public.view
    def get_record_count(self) -> u256:
        return self.record_count

    @gl.public.view
    def get_record_hash_by_index(self, index: u256) -> str:
        if int(index) < 0 or int(index) >= int(self.record_count):
            raise gl.vm.UserError("Evidence archive index out of range")
        return self.record_index[str(int(index))]

    @gl.public.view
    def get_record(self, digest: str) -> EvidenceArchive:
        digest = digest.strip().lower()
        if digest not in self.records:
            raise gl.vm.UserError("Evidence archive not found")
        return self.records[digest]

    @gl.public.view
    def get_record_hash_for_slot(
        self,
        subject_contract: Address,
        workflow_id: str,
        step_id: str,
        decision_round: u256,
        role: str,
    ) -> str:
        subject_contract = self._parse_address(subject_contract)
        slot = self._slot_key(
            subject_contract,
            workflow_id.strip(),
            step_id.strip(),
            decision_round,
            role.strip().upper(),
        )
        if slot not in self.slot_index:
            return ""
        return self.slot_index[slot]

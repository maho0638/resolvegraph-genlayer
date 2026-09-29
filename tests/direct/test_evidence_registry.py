import hashlib
from datetime import datetime, timezone

import pytest


SUBJECT = "0x1111111111111111111111111111111111111111"
WORKFLOW = "wf-typed"
STEP = "build"


@pytest.fixture(autouse=True)
def strict_direct_vm(direct_vm):
    direct_vm.strict_mocks = True
    direct_vm.check_pickling = True


def now():
    return int(datetime.now(timezone.utc).timestamp())


def expected_digest(
    role="PRIMARY",
    source_type="WEB",
    source_url="https://example.com",
    content_type="text/html",
    content_hash="a" * 64,
    immutable_ref_kind="SHA256",
    immutable_ref="a" * 64,
    author="Example Domains",
    relation="Supports rubric item 1: requested delivery is publicly reachable.",
    fetched_at=None,
):
    fetched_at = now() if fetched_at is None else fetched_at
    fields = (
        "RG_EVIDENCE_ARCHIVE_V1",
        SUBJECT.lower(),
        WORKFLOW,
        STEP,
        "1",
        role,
        source_type,
        source_url,
        content_type,
        content_hash,
        immutable_ref_kind,
        immutable_ref,
        author,
        relation,
        str(fetched_at),
    )
    payload = "".join(f"{len(str(value))}:{value}" for value in fields)
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def register_default(direct_vm, contract, publisher, fetched_at):
    direct_vm.sender = publisher
    return contract.register_evidence(
        SUBJECT,
        WORKFLOW,
        STEP,
        1,
        "primary",
        "web",
        "https://example.com",
        "text/html",
        "a" * 64,
        "sha256",
        "a" * 64,
        "Example Domains",
        "Supports rubric item 1: requested delivery is publicly reachable.",
        fetched_at,
    )


def test_archive_digest_is_content_addressed(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/evidence_registry.py")
    fetched = now()
    digest = register_default(direct_vm, contract, direct_alice, fetched)

    assert digest == expected_digest(fetched_at=fetched)
    assert int(contract.get_record_count()) == 1
    assert contract.get_record_hash_by_index(0) == digest

    record = contract.get_record(digest)
    assert record.workflow_id == WORKFLOW
    assert record.step_id == STEP
    assert record.role == "PRIMARY"
    assert record.source_type == "WEB"
    assert record.content_hash == "a" * 64
    assert record.immutable_ref_kind == "SHA256"
    assert record.rubric_relation.startswith("Supports rubric item 1")


def test_evidence_slot_is_immutable(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/evidence_registry.py")
    fetched = now()
    register_default(direct_vm, contract, direct_alice, fetched)

    with direct_vm.expect_revert("slot is already archived"):
        register_default(direct_vm, contract, direct_alice, fetched)


def test_challenge_round_creates_distinct_digest(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/evidence_registry.py")
    fetched = now()
    initial = register_default(direct_vm, contract, direct_alice, fetched)

    direct_vm.sender = direct_alice
    challenged = contract.register_evidence(
        SUBJECT,
        WORKFLOW,
        STEP,
        2,
        "challenge",
        "web",
        "https://www.rfc-editor.org/rfc/rfc2606",
        "text/html",
        "b" * 64,
        "sha256",
        "b" * 64,
        "RFC Editor",
        "Challenges rubric item 1 with fresh independent evidence.",
        fetched,
    )

    assert initial != challenged
    assert int(contract.get_record_count()) == 2
    assert (
        contract.get_record_hash_for_slot(
            SUBJECT, WORKFLOW, STEP, 2, "challenge"
        )
        == challenged
    )


def test_git_commit_requires_full_sha(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/evidence_registry.py")
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("invalid length"):
        contract.register_evidence(
            SUBJECT,
            WORKFLOW,
            STEP,
            1,
            "primary",
            "github_commit",
            "https://github.com/example/repo/commit/abc123",
            "application/vnd.github+json",
            "c" * 64,
            "git_commit_sha",
            "abc123",
            "octocat",
            "Supports exact-code revision requirement.",
            now(),
        )


def test_unknown_source_type_rejected(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/evidence_registry.py")
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("Unsupported source type"):
        contract.register_evidence(
            SUBJECT,
            WORKFLOW,
            STEP,
            1,
            "primary",
            "ftp",
            "https://example.com",
            "text/plain",
            "d" * 64,
            "sha256",
            "d" * 64,
            "",
            "Supports the rubric.",
            now(),
        )


def test_future_fetch_time_rejected(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/evidence_registry.py")
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("Fetched-at timestamp is invalid"):
        contract.register_evidence(
            SUBJECT,
            WORKFLOW,
            STEP,
            1,
            "primary",
            "web",
            "https://example.com",
            "text/html",
            "e" * 64,
            "sha256",
            "e" * 64,
            "",
            "Supports the rubric.",
            now() + 1000,
        )

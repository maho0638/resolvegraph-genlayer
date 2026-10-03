"""Live Studionet proof for immutable typed ResolveGraph evidence archives."""

import hashlib
import urllib.request
from pathlib import Path

import pytest
from genlayer_py import create_account
from gltest import get_contract_factory
from gltest.assertions import tx_execution_succeeded


_SECP256K1_N = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141
SUBJECT_CONTRACT = Path(".github/resolvegraph-evidence-subject.txt").read_text(
    encoding="utf-8"
).strip()
WORKFLOW_ID = "rg-live-success-v1"
STEP_ID = "source-check"


def _account(label: str):
    digest = hashlib.sha256(
        ("resolvegraph-evidence-registry-proof:" + label).encode()
    ).digest()
    key_int = (int.from_bytes(digest, "big") % (_SECP256K1_N - 1)) + 1
    return create_account("0x" + key_int.to_bytes(32, "big").hex())


def _field(value, name):
    if isinstance(value, dict):
        return value.get(name)
    return getattr(value, name)


def _fetch(url: str):
    request = urllib.request.Request(
        url,
        headers={"User-Agent": "ResolveGraph-Evidence-Archive/1.0"},
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        body = response.read()
        content_type = response.headers.get_content_type()
    return body, content_type


@pytest.mark.integration
def test_typed_evidence_registry_on_studionet():
    publisher_account = _account("publisher")
    factory = get_contract_factory("ResolveGraphEvidenceRegistry")
    contract = factory.deploy(account=publisher_account, consensus_max_rotations=4)
    publisher = contract.connect(account=publisher_account)

    Path("artifacts").mkdir(parents=True, exist_ok=True)
    Path("artifacts/resolvegraph-evidence-registry-address.txt").write_text(
        str(contract.address),
        encoding="utf-8",
    )

    print("RG_EVIDENCE_REGISTRY=" + str(contract.address), flush=True)
    print("RG_EVIDENCE_PUBLISHER=" + str(publisher_account.address), flush=True)
    print("RG_EVIDENCE_SUBJECT=" + SUBJECT_CONTRACT, flush=True)

    evidence = [
        {
            "round": 1,
            "role": "PRIMARY",
            "url": "https://example.com",
            "author": "IANA Example Domains",
            "relation": (
                "Supports the source-check requirement by providing the canonical "
                "Example Domain page referenced by the adjudicated delivery."
            ),
        },
        {
            "round": 1,
            "role": "SUPPORT",
            "url": "https://www.iana.org/help/example-domains",
            "author": "Internet Assigned Numbers Authority",
            "relation": (
                "Independently corroborates the reserved example-domain policy "
                "used by the step acceptance rubric."
            ),
        },
        {
            "round": 2,
            "role": "CHALLENGE",
            "url": "https://www.rfc-editor.org/rfc/rfc2606",
            "author": "RFC Editor",
            "relation": (
                "Fresh challenge evidence for the second decision round, binding "
                "the re-evaluation to RFC 2606."
            ),
        },
    ]

    hashes = []
    for item in evidence:
        body, content_type = _fetch(item["url"])
        content_hash = hashlib.sha256(body).hexdigest()
        fetched_at = int(__import__("time").time())

        tx = publisher.register_evidence(
            args=[
                SUBJECT_CONTRACT,
                WORKFLOW_ID,
                STEP_ID,
                item["round"],
                item["role"],
                "WEB",
                item["url"],
                content_type,
                content_hash,
                "SHA256",
                content_hash,
                item["author"],
                item["relation"],
                fetched_at,
            ]
        ).transact(wait_interval=10000, wait_retries=60)
        assert tx_execution_succeeded(tx)

        digest = contract.get_record_hash_for_slot(
            args=[
                SUBJECT_CONTRACT,
                WORKFLOW_ID,
                STEP_ID,
                item["round"],
                item["role"],
            ]
        ).call()
        assert len(str(digest)) == 64

        stored = contract.get_record(args=[digest]).call()
        assert str(_field(stored, "workflow_id")) == WORKFLOW_ID
        assert str(_field(stored, "step_id")) == STEP_ID
        assert str(_field(stored, "role")) == item["role"]
        assert str(_field(stored, "source_type")) == "WEB"
        assert str(_field(stored, "source_url")) == item["url"]
        assert str(_field(stored, "content_hash")) == content_hash
        assert str(_field(stored, "immutable_ref")) == content_hash
        assert str(_field(stored, "rubric_relation")) == item["relation"]
        hashes.append(str(digest))
        prefix = "RG_EVIDENCE_" + item["role"]
        print(prefix + "_DIGEST=" + str(digest), flush=True)
        print(prefix + "_CONTENT_HASH=" + str(_field(stored, "content_hash")), flush=True)
        print(prefix + "_CONTENT_TYPE=" + str(_field(stored, "content_type")), flush=True)
        print(prefix + "_FETCHED_AT=" + str(int(_field(stored, "fetched_at"))), flush=True)
        print(prefix + "_CREATED_AT=" + str(int(_field(stored, "created_at"))), flush=True)

    assert int(contract.get_record_count().call()) == 3
    assert len(set(hashes)) == 3
    assert hashes[0] != hashes[2]

    Path("artifacts/resolvegraph-evidence-registry-hashes.txt").write_text(
        "\n".join(hashes) + "\n",
        encoding="utf-8",
    )

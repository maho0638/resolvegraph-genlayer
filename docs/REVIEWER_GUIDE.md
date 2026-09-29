# ResolveGraph Reviewer Guide

## Current status

**LIVE_VERIFIED — submission-ready.**

The canonical GenLayer contract, both live Studionet terminal lifecycles, deployed-source equality, production frontend and automated post-deploy smoke suite are verified.

Production: https://resolvegraph-genlayer.vercel.app

## Review order

1. `contracts/resolve_graph.py` — core economic state machine.
2. `docs/ARCHITECTURE.md` — workflow graph, reward/bond model and failure path.
3. `docs/THREAT_MODEL.md` — attack surface and explicit limitations.
4. `docs/INTEROPERABILITY.md` — ERC-8004 / A2A boundaries.
5. `tests/direct/test_resolve_graph.py` — V1 deterministic and adversarial coverage.
6. `contracts/resolve_graph_v2.py` + `tests/direct/test_resolve_graph_v2.py` — immutable content-addressed recipe registry and step binding.
7. `tests/integration/test_resolvegraph_studionet.py` — canonical live success/failure proof.
8. `tests/integration/test_resolvegraph_studionet_resume.py` — state-aware continuation for interrupted consensus transactions.
9. `tests/integration/test_resolvegraph_v2_recipes_studionet.py` — live V2 registry proof.
10. `contracts/evidence_registry.py` + `tests/direct/test_evidence_registry.py` — append-only typed evidence archive and immutable round/role slots.
11. `tests/integration/test_resolvegraph_evidence_registry_studionet.py` — live evidence archive and source-equality proof.
12. `sdk/` — integration helpers and portable receipt.
13. `schemas/evidence-manifest.schema.json` + `schemas/evidence-manifest-v2.schema.json` — legacy and current evidence-manifest surfaces.
14. `schemas/github-provenance.schema.json` — portable signed GitHub provenance receipt schema.
15. `frontend/app/provenance/` + `frontend/app/api/provenance/github/` — wallet/GitHub/commit provenance flow.
16. `frontend/` — builder, recipes, Explorer, operator console, case room, APIs and proof page.
17. `.github/workflows/production-smoke.yml` — production verification.
18. `docs/PROOF_MANIFEST.json` — canonical transaction-level and release evidence.

## Verified deterministic gate

- 89/89 direct tests PASS.
- GenVM lint PASS.
- 14/14 SDK tests PASS.
- Frontend typecheck PASS.
- Frontend production build PASS.
- Canonical predeploy CI run: `36545373008`.

## Verified live contract proof

Canonical Studionet run: `36545373155`.

Contract:

`0x5E7e96dCfB5dF57881CFfBFc5b597f7b83c4A754`

The run completed:
- a two-agent dependent success workflow with two challenged consensus rounds and terminal `COMPLETED`;
- a deliberately false commitment that failed;
- workflow-level fault attribution to `PARTICIPANT` at 97% confidence;
- a fresh attribution challenge;
- a second attribution consensus round changing final fault class to `EXTERNAL`;
- deterministic terminal `FAILED_SETTLED`;
- deployed contract source equality with repository source.

Normalized deployed/repository SHA256:

`f5a80ea0589c88f8c45221195029bbd2b78c91b4b37302400e9d05a156374ddb`

## Verified V2 immutable recipe registry

Studionet run: `36587816018` — SUCCESS.

V2 contract:

`0x8025214a654Dd4d500bc549f204ED9a9a4d2a8c1`

V2 source SHA256:

`2d5939b27a116ca3754b301a3bbbf0a1f335aaa76d6f1ce1c0abd09b17d96673`

The run registered software-delivery, research-verification and service-sla v1 policies, instantiated all three in one workflow, verified every step retained the expected recipe hash, sealed the workflow ACTIVE, and proved deployed-source equality.

## Verified typed evidence archive

Studionet run: `36598129489` — SUCCESS.

Evidence registry:

`0xB5B0Dd5E454590fCb4FCEFD85B11d16774552390`

Evidence registry source SHA256:

`8e7dbd50992f5d14544194d8e85a64e5ddcb4001ebc4b21d66ba979a31bba472`

The proof archived PRIMARY and SUPPORT evidence for decision round 1 and fresh CHALLENGE evidence for round 2 of `rg-live-success-v1/source-check`. Every record stores source type, MIME type, SHA-256 content hash, immutable reference, author field, rubric relation, fetch time, publisher and a content-addressed archive digest. Deployed-source equality is true.

## Verified source adapters

E2E run: `36604750863` — SUCCESS.

The proof checks a real GitHub commit, public pull request, GitHub Actions run, Ethereum mainnet transaction receipt and bounded public artifact, then replays each adapter digest deterministically.

## Verified external SDK consumer

Run: `36601714919` — SUCCESS.

A clean consumer installs the packed SDK through the package boundary, verifies the canonical public workflow through production APIs and emits an independent consumer receipt.

## Verified V3 bounded appeals

Studionet run: `36604861578` — SUCCESS.

V3 contract:

`0x14948AD5dCd317Ec49f5CEf7e08c72176C900214`

V3 source SHA256:

`4722a5fad4de2974c242ea1bc14e68f50da58914cd77c675e1a86b899acc25ee`

The contract limits a step to one fresh-evidence appeal, requires an exact 5% appeal bond, performs a second consensus round, records decision lineage and blocks settlement until explicit finalization. Deployed-source equality is true.

## Verified production surface

Provenance feature verification commit:

`5da51a7647dae310c551f4afcce49ea4c7e0b802`

- CI run: `36572374200` — SUCCESS.
- Vercel Git deployment: SUCCESS.
- Production smoke run: `36572844244` — SUCCESS.
- Production URL: https://resolvegraph-genlayer.vercel.app
- Public pages, logo asset, read APIs, canonical success/failure workflows, participant read, receipt API, evidence manifest, provenance verifier page, provenance validation endpoint and verification snapshot all passed.

## Reviewer shortcuts

- Overview: https://resolvegraph-genlayer.vercel.app/
- Explorer: https://resolvegraph-genlayer.vercel.app/explorer
- Success case: https://resolvegraph-genlayer.vercel.app/workflows/rg-live-success-v1
- Failure case: https://resolvegraph-genlayer.vercel.app/workflows/rg-live-failure-v1
- Provenance verifier: https://resolvegraph-genlayer.vercel.app/provenance
- Recipes / V2 registry proof: https://resolvegraph-genlayer.vercel.app/recipes
- Evidence archive / drift review: https://resolvegraph-genlayer.vercel.app/evidence?workflow=rg-live-success-v1&step=source-check
- Reviewer mode: https://resolvegraph-genlayer.vercel.app/reviewer
- Source adapters: https://resolvegraph-genlayer.vercel.app/adapters
- Bounded appeals: https://resolvegraph-genlayer.vercel.app/appeals
- Proof: https://resolvegraph-genlayer.vercel.app/proof
- Health JSON: https://resolvegraph-genlayer.vercel.app/api/health
- Verification JSON: https://resolvegraph-genlayer.vercel.app/verification-status.json

## Boundaries

Do not interpret agent registry/A2A strings as authenticated identity. The GitHub provenance adapter adds a separate signed verification chain that binds the on-chain assignee to a GitHub account and immutable commit through an owner-controlled gist challenge, but it is not enforced by the current settlement contract and it does not provide a global single-use nonce registry. Evidence manifest v2 clearly separates bounded contract snapshots, current server-side byte capture, and publisher-anchored immutable archive records; the archive contract does not independently fetch the web source.

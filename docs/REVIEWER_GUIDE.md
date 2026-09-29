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
5. `tests/direct/test_resolve_graph.py` — deterministic and adversarial coverage.
6. `tests/integration/test_resolvegraph_studionet.py` — canonical live success/failure proof.
7. `tests/integration/test_resolvegraph_studionet_resume.py` — state-aware continuation for interrupted consensus transactions.
8. `sdk/` — integration helpers and portable receipt.
9. `schemas/evidence-manifest.schema.json` — typed evidence-manifest surface.
10. `frontend/` — builder, recipes, Explorer, operator console, case room, APIs and proof page.
11. `.github/workflows/production-smoke.yml` — production verification.
12. `docs/PROOF_MANIFEST.json` — canonical transaction-level and release evidence.

## Verified deterministic gate

- 68/68 direct tests PASS.
- GenVM lint PASS.
- 11/11 SDK tests PASS.
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

## Verified production surface

Verified production commit:

`94a61f7f4401eb84f321e13136404dd028279c5c`

- Production CI run: `36568432075` — SUCCESS.
- Vercel Git deployment: SUCCESS.
- Production smoke run: `36569042701` — SUCCESS.
- Production URL: https://resolvegraph-genlayer.vercel.app
- Public pages, logo asset, read APIs, canonical success/failure workflows, participant read, receipt API, evidence manifest and verification snapshot all passed.

## Reviewer shortcuts

- Overview: https://resolvegraph-genlayer.vercel.app/
- Explorer: https://resolvegraph-genlayer.vercel.app/explorer
- Success case: https://resolvegraph-genlayer.vercel.app/workflows/rg-live-success-v1
- Failure case: https://resolvegraph-genlayer.vercel.app/workflows/rg-live-failure-v1
- Proof: https://resolvegraph-genlayer.vercel.app/proof
- Health JSON: https://resolvegraph-genlayer.vercel.app/api/health
- Verification JSON: https://resolvegraph-genlayer.vercel.app/verification-status.json

## Boundaries

Do not interpret agent registry/A2A strings as authenticated identity. Do not interpret the evidence-manifest digest as a byte-level hash of remote web content. Those boundaries are explicit in the product and submission dossier.

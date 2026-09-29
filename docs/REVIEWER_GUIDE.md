# ResolveGraph Reviewer Guide

## Current status

The canonical contract and both live Studionet lifecycles are verified. Production promotion is the final gate; treat the project as submission-ready only after the proof manifest is marked `LIVE_VERIFIED` with `submission_ready: true`.

## Review order

1. `contracts/resolve_graph.py` — core economic state machine.
2. `docs/ARCHITECTURE.md` — workflow graph, reward/bond model and failure path.
3. `docs/THREAT_MODEL.md` — attack surface and explicit limitations.
4. `docs/INTEROPERABILITY.md` — ERC-8004 / A2A boundaries.
5. `tests/direct/test_resolve_graph.py` — deterministic and adversarial coverage.
6. `tests/integration/test_resolvegraph_studionet.py` — canonical live success/failure proof.
7. `tests/integration/test_resolvegraph_studionet_resume.py` — state-aware continuation for interrupted consensus transactions.
8. `sdk/` — integration helpers and portable receipt.
9. `frontend/` — product surface and reviewer proof page.
10. `docs/PROOF_MANIFEST.json` — canonical transaction-level evidence.

## Verified predeploy gate

- 68/68 direct tests PASS.
- GenVM lint PASS.
- 11/11 SDK tests PASS.
- Frontend typecheck PASS.
- Frontend production build PASS.
- Canonical CI run: `36545373008`.

## Verified live proof

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

## Production promotion

Vercel remains the final controlled step. After production deployment, smoke-test the overview, explorer, workflow case room, operator console, participant ledger, developer page, proof page and read-only APIs before marking the dossier submission-ready.

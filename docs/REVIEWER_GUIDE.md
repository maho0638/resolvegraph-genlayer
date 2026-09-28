# ResolveGraph Reviewer Guide

## Current status

DEVELOPMENT — do not treat this repository as a finished Portal submission until the proof manifest says `LIVE_VERIFIED` and `submission_ready` is true.

## Review order

1. `contracts/resolve_graph.py` — core economic state machine.
2. `docs/ARCHITECTURE.md` — workflow graph, reward/bond model and failure path.
3. `docs/THREAT_MODEL.md` — attack surface and explicit limitations.
4. `docs/INTEROPERABILITY.md` — ERC-8004 / A2A boundaries.
5. `tests/direct/test_resolve_graph.py` — deterministic and adversarial coverage.
6. `sdk/` — integration helpers and portable receipt.
7. `frontend/` — complete product surface.
8. `docs/PROOF_MANIFEST.json` — canonical evidence after live verification.

## Predeploy verification

```bash
python -m pip install -r requirements.txt
pytest tests/direct -v
genvm-lint check contracts/resolve_graph.py

cd sdk
npm install
npm test

cd ../frontend
npm install
npm run typecheck
npm run build
```

## Live verification

The Studionet workflow is intentionally manual-only:

```bash
gltest tests/integration/test_resolvegraph_studionet.py -v -s --network studionet
```

It exercises both a successful dependent workflow and a failed workflow with challenge, fault attribution, re-attribution and terminal settlement.

## Production promotion

Vercel is the final step, not the development environment. A production URL is added only after the complete contract/SDK/frontend/live-proof gate succeeds.

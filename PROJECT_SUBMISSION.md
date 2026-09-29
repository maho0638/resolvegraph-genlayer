# ResolveGraph — Project Submission Dossier

## Status

STUDIONET VERIFIED — FINAL PRODUCTION PROMOTION PENDING

ResolveGraph is built for the GenLayer Projects category, where the Intelligent Contract is central to the product rather than an optional demo.

## Product thesis

ResolveGraph is a multi-agent workflow settlement platform. Sponsors fund dependent commitments, participants post bonds, agents submit public evidence, GenLayer consensus evaluates each natural-language commitment, and a workflow-level fault-attribution round determines how remaining escrow and bonds settle when the overall workflow fails.

## Differentiation from prior projects

- ProofJudge: one sponsor + one contractor + one milestone.
- ResearchArena: multiple researchers compete for one research reward or sequential research phases.
- ResolveGraph: multiple assigned participants cooperate inside one dependency graph, rewards settle per step, bonds remain exposed to later root-cause attribution, and the terminal outcome produces a portable adjudication receipt.

## GenLayer-critical functions

- semantic commitment evaluation over live public evidence;
- validator re-execution of decisive fields;
- fresh step challenge rounds;
- multi-step workflow root-cause attribution;
- fresh attribution challenge and second consensus round;
- native GEN escrow, participant bonds, reward settlement and fault-dependent bond settlement.

## Canonical verification

- Predeploy CI run: `36545373008` — SUCCESS.
- Direct tests: **68/68 PASS**.
- GenVM lint: **PASS**.
- SDK tests: **11/11 PASS**.
- Frontend typecheck/build: **PASS**.
- Canonical Studionet run: `36545373155` — **SUCCESS**.
- Contract: `0x5E7e96dCfB5dF57881CFfBFc5b597f7b83c4A754`.
- Success workflow `rg-live-success-v1`: **COMPLETED**.
- Failure workflow `rg-live-failure-v1`: **FAILED_SETTLED**.
- Failure attribution changed from **PARTICIPANT / api-proof / 97%** to **EXTERNAL** after the attribution challenge and second consensus round.
- Normalized deployed source SHA256: `f5a80ea0589c88f8c45221195029bbd2b78c91b4b37302400e9d05a156374ddb`.
- Normalized repository source SHA256: `f5a80ea0589c88f8c45221195029bbd2b78c91b4b37302400e9d05a156374ddb`.
- Deployed-source equality: **true**.

Full transaction evidence is pinned in `docs/PROOF_MANIFEST.json`.

## Remaining release gate

Only the final controlled Vercel production deployment and production smoke test remain. No Portal submission should be made until that smoke test passes and the dossier is marked submission-ready.

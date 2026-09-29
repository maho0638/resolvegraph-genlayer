# ResolveGraph — Project Submission Dossier

## Status

**LIVE_VERIFIED — SUBMISSION READY**

ResolveGraph is built for the GenLayer Projects category, where the Intelligent Contract is central to the product rather than an optional demo.

Production: https://resolvegraph-genlayer.vercel.app

## Product thesis

ResolveGraph is a multi-agent workflow settlement platform. Sponsors fund dependent commitments, participants post bonds, agents submit public evidence, GenLayer consensus evaluates each natural-language commitment, and a workflow-level fault-attribution round determines how remaining escrow and bonds settle when the overall workflow fails.

The product is not limited to deciding whether one deliverable is good or bad. It preserves the dependency graph, keeps participant bonds exposed to downstream root-cause review, supports fresh challenge evidence, separates semantic judgment from deterministic settlement, and exports machine-readable receipts and evidence manifests.

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

## Product / reviewer surface

- workflow builder with versioned recipe starters;
- operator console for every lifecycle write;
- public Explorer using production server-side read APIs;
- per-workflow case room with challenge decision lineage;
- participant settlement ledger;
- TypeScript SDK and portable receipt API;
- signed GitHub delivery provenance verifier and portable provenance receipt;
- typed decision-bound evidence manifest API;
- reviewer proof page;
- automated production smoke workflow.

## Canonical verification

- Predeploy CI run: `36545373008` — **SUCCESS**.
- Direct tests: **68/68 PASS**.
- GenVM lint: **PASS**.
- SDK tests: **14/14 PASS**.
- Frontend typecheck/build: **PASS**.
- Canonical Studionet run: `36545373155` — **SUCCESS**.
- Contract: `0x5E7e96dCfB5dF57881CFfBFc5b597f7b83c4A754`.
- Success workflow `rg-live-success-v1`: **COMPLETED**.
- Failure workflow `rg-live-failure-v1`: **FAILED_SETTLED**.
- Failure attribution changed from **PARTICIPANT / api-proof / 97%** to **EXTERNAL** after the attribution challenge and second consensus round.
- Normalized deployed source SHA256: `f5a80ea0589c88f8c45221195029bbd2b78c91b4b37302400e9d05a156374ddb`.
- Normalized repository source SHA256: `f5a80ea0589c88f8c45221195029bbd2b78c91b4b37302400e9d05a156374ddb`.
- Deployed-source equality: **true**.
- Provenance feature verification commit: `5da51a7647dae310c551f4afcce49ea4c7e0b802`.
- Provenance feature CI run: `36572374200` — **SUCCESS**.
- Provenance feature production smoke run: `36572844244` — **SUCCESS**.
- Smoke coverage includes overview, Explorer, operator console, recipes, participant ledger, provenance verifier, developer page, proof page, canonical case room, logo asset, health API, workflow API, step API, participant API, portable receipt, evidence manifest, provenance endpoint validation, canonical success/failure state and public verification snapshot.

Full transaction evidence is pinned in `docs/PROOF_MANIFEST.json`.

## Explicit trust boundaries

- ERC-8004-style references and A2A endpoints are metadata references, not identity proof.
- The GitHub provenance adapter independently verifies the on-chain assignee wallet signature, frozen step-policy digest, GitHub commit association and owner-controlled gist challenge. It emits an external receipt; it does not alter the current contract's payout rules and it does not maintain a global single-use nonce registry.
- The evidence-manifest digest covers contract-stored evidence metadata, bounded snapshots, commitment fields and decision fields. It does **not** claim a byte-level hash of the remote web source.
- The verified contract is on **GenLayer Studionet**; the frontend is a production web deployment, not a mainnet claim.
- Cross-chain settlement and a dedicated on-chain recipe registry are not claimed by this release. Signed GitHub provenance is implemented as an external verification layer, not as on-chain settlement enforcement.

## Release gate

All defined release gates are complete. The dossier is submission-ready.

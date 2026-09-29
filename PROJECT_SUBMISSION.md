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
- separately deployed V2 immutable content-addressed recipe registry;
- operator console for every lifecycle write;
- public Explorer using production server-side read APIs;
- per-workflow case room with challenge decision lineage;
- participant settlement ledger;
- TypeScript SDK and portable receipt API;
- signed GitHub delivery provenance verifier and portable provenance receipt;
- typed evidence manifest v2, bounded remote-byte capture, immutable Studionet evidence archive and drift-review UI;
- reviewer proof page with a single-case graph/evidence/decision/transaction timeline;
- GitHub commit/PR/CI, Ethereum transaction/event and artifact source adapters;
- isolated V3 bounded bonded appeal policy;
- automated production smoke workflow.

## Canonical verification

- Predeploy CI run: `36545373008` — **SUCCESS**.
- Direct tests: **89/89 PASS**.
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
- V2 immutable recipe registry Studionet run: `36587816018` — **SUCCESS** after retrying a transient GenLayer gateway 502.
- V2 contract: `0x8025214a654Dd4d500bc549f204ED9a9a4d2a8c1`.
- V2 source SHA256: `2d5939b27a116ca3754b301a3bbbf0a1f335aaa76d6f1ce1c0abd09b17d96673`.
- V2 deployed-source equality: **true**.
- V2 live workflow `rg-v2-live-recipe-v1`: **ACTIVE**, with software-delivery, research-verification and service-sla steps each bound to its immutable recipe hash.
- Typed evidence registry Studionet run: `36598129489` — **SUCCESS**.
- Evidence registry: `0xB5B0Dd5E454590fCb4FCEFD85B11d16774552390`.
- Evidence registry source SHA256: `8e7dbd50992f5d14544194d8e85a64e5ddcb4001ebc4b21d66ba979a31bba472`.
- Evidence registry deployed-source equality: **true**.
- Canonical archive proof: `rg-live-success-v1/source-check` has round-1 PRIMARY/SUPPORT and round-2 CHALLENGE archive records with distinct content-addressed digests.
- Source adapter E2E proof: `36604750863` — **SUCCESS**.
- External SDK consumer proof: `36601714919` — **SUCCESS**.
- V3 bounded appeals proof: `36604861578` — **SUCCESS**.
- V3 contract: `0x14948AD5dCd317Ec49f5CEf7e08c72176C900214`.
- V3 source SHA256: `4722a5fad4de2974c242ea1bc14e68f50da58914cd77c675e1a86b899acc25ee`.
- V3 deployed-source equality: **true**.
- Smoke coverage includes overview, Explorer, operator console, recipes, participant ledger, provenance verifier, developer page, proof page, canonical case room, logo asset, health API, workflow API, step API, participant API, portable receipt, evidence manifest, provenance endpoint validation, canonical success/failure state and public verification snapshot.

Full transaction evidence is pinned in `docs/PROOF_MANIFEST.json`.

## Explicit trust boundaries

- ERC-8004-style references and A2A endpoints are metadata references, not identity proof.
- The GitHub provenance adapter independently verifies the on-chain assignee wallet signature, frozen step-policy digest, GitHub commit association and owner-controlled gist challenge. It emits an external receipt; it does not alter the current contract's payout rules and it does not maintain a global single-use nonce registry.
- Evidence manifest v2 distinguishes contract snapshots from remote-byte captures. The capture API performs a bounded public-HTTPS fetch and computes SHA-256; the evidence-registry contract makes submitted capture metadata immutable and records its publisher, but the registry contract itself does not fetch the remote bytes. Reviewers can therefore distinguish a byte-capture claim from the publisher that anchored it.
- The verified contract is on **GenLayer Studionet**; the frontend is a production web deployment, not a mainnet claim.
- Cross-chain settlement is not claimed by this release. The dedicated on-chain recipe registry is implemented and live-verified in the separate V2 contract; it is not silently substituted for the canonical V1 settlement contract used by the production builder. Signed GitHub provenance remains an external verification layer, not on-chain settlement enforcement.

## Release gate

All defined release gates are complete. The dossier is submission-ready.

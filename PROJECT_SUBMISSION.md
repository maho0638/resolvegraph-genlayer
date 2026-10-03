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

- Development CI is re-run on the final promoted commit before production deployment.
- Direct tests: **103/103 PASS**.
- GenVM lint: **PASS**.
- SDK tests: **18/18 PASS**.
- Frontend typecheck/build: **PASS**.
- Canonical Studionet completion run: `37131853576` — **SUCCESS** after read-only recovery inspection of a delayed consensus transaction.
- Contract: `0x881665b7331CcE0a2f66A01aF14BB7CA14464FF0`.
- Success workflow `rg-live-success-v1`: **COMPLETED**.
- Failure workflow `rg-live-failure-v1`: **FAILED_SETTLED**.
- The failure path received a second attribution consensus round and finalized as **PARTICIPANT / api-proof** before deterministic settlement.
- Normalized deployed source SHA256: `f5a80ea0589c88f8c45221195029bbd2b78c91b4b37302400e9d05a156374ddb`.
- Normalized repository source SHA256: `f5a80ea0589c88f8c45221195029bbd2b78c91b4b37302400e9d05a156374ddb`.
- Deployed-source equality: **true**.
- Provenance feature verification commit: `5da51a7647dae310c551f4afcce49ea4c7e0b802`.
- Provenance feature CI run: `36572374200` — **SUCCESS**.
- Provenance feature production smoke run: `36572844244` — **SUCCESS**.
- V2 immutable recipe registry Studionet run: `37117935627` — **SUCCESS**.
- V2 contract: `0x58De3354F739D6E1C9DBe1857B072262D96e5EE2`.
- V2 source SHA256: `2d5939b27a116ca3754b301a3bbbf0a1f335aaa76d6f1ce1c0abd09b17d96673`.
- V2 deployed-source equality: **true**.
- V2 live workflow `rg-v2-live-recipe-v1`: **ACTIVE**, with software-delivery, research-verification and service-sla steps each bound to its immutable recipe hash.
- Typed evidence registry Studionet run: `37132147367` — **SUCCESS**.
- Evidence registry: `0x7436623f5bc064179546344b587fe9BF30B71004`.
- Evidence registry source SHA256: `8e7dbd50992f5d14544194d8e85a64e5ddcb4001ebc4b21d66ba979a31bba472`.
- Evidence registry deployed-source equality: **true**.
- Canonical archive proof: `rg-live-success-v1/source-check` has round-1 PRIMARY/SUPPORT and round-2 CHALLENGE archive records with distinct content-addressed digests.
- Source adapter E2E proof: `36604750863` — **SUCCESS**.
- External SDK consumer proof: `36601714919` — **SUCCESS**.
- V3 bounded appeals proof: `37117935576` — **SUCCESS**.
- V3 contract: `0x8d9c489A2854faFa2bBd2E258B8C0AA9d0Da5F3F`.
- V3 source SHA256: `3f3f357e48cafbd8899f7296057d3cd57bfde3472c83c5f98adacd59b6efdfba`.
- V3 deployed-source equality: **true**.
- Cross-chain conditioned settlement proof: `36606957197` — **SUCCESS**.
- Cross-chain contract: `0x0ca7432339C86ab01118f46D847A11EF94CB4BAA`.
- Cross-chain source SHA256: `67af44ce57eb4c672b156372c7fd042a0896d24794b788c897915b7f7993a4d0`.
- The live intent `rg-xchain-mainnet-proof-v1` reached **SETTLED** using the canonical Ethereum adapter digest from source-adapter run `36604750863`.
- Smoke coverage includes overview, Explorer, operator console, recipes, participant ledger, provenance verifier, developer page, proof page, canonical case room, logo asset, health API, workflow API, step API, participant API, portable receipt, evidence manifest, provenance endpoint validation, canonical success/failure state and public verification snapshot.

Full transaction evidence is pinned in `docs/PROOF_MANIFEST.json`.

## Explicit trust boundaries

- ERC-8004-style references and A2A endpoints are metadata references, not identity proof.
- The GitHub provenance adapter independently verifies the on-chain assignee wallet signature, frozen step-policy digest, GitHub commit association and owner-controlled gist challenge. It emits an external receipt; it does not alter the current contract's payout rules and it does not maintain a global single-use nonce registry.
- Evidence manifest v2 distinguishes contract snapshots from remote-byte captures. The capture API performs a bounded public-HTTPS fetch and computes SHA-256; the evidence-registry contract makes submitted capture metadata immutable and records its publisher, but the registry contract itself does not fetch the remote bytes. Reviewers can therefore distinguish a byte-capture claim from the publisher that anchored it.
- The verified contract is on **GenLayer Studionet**; the frontend is a production web deployment, not a mainnet claim.
- Cross-chain functionality is claimed only as relayer-attested conditioned GEN settlement, not as a trust-free token bridge. The promoted V1 consensus-guard contract is the production builder target; the dedicated V2 recipe registry and V3 appeal contract remain explicit, separately verified surfaces. Signed GitHub provenance remains an external verification layer, not on-chain settlement enforcement.

## Release gate

All defined release gates are complete. The dossier is submission-ready.

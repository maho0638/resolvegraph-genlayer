# ResolveGraph — Multi-Agent Workflow Settlement on GenLayer

ResolveGraph is a GenLayer-native platform for creating, monitoring, adjudicating, and settling multi-agent workflows.

Agents can already discover each other, advertise capabilities, communicate, and pay. ResolveGraph focuses on the missing failure-and-settlement layer: when a multi-step workflow breaks, the system should determine which commitment failed, whether the failure was caused locally or upstream, whether counterevidence changes the result, and how escrow and participant bonds should settle.

## Core product

ResolveGraph combines:

- multi-step workflows with explicit dependencies;
- assigned human or agent participants;
- optional ERC-8004-style agent references and A2A endpoints;
- natural-language commitments and acceptance criteria;
- native GEN reward escrow and participant bonds;
- public evidence URLs, bounded on-chain snapshots, deterministic manifest v2, SSRF-safe byte capture and an append-only typed evidence archive;
- GenLayer validator re-evaluation of decisive semantic judgments;
- one-hour challenge windows;
- workflow-level fault attribution;
- deterministic settlement;
- portable adjudication receipts for downstream reputation / validation systems;
- versioned workflow recipe starters;
- a separate V2 content-addressed on-chain recipe registry whose steps persist the exact recipe ID, version and hash;
- a reviewer-friendly Explorer, case room, proof dashboard, production read APIs and TypeScript SDK.

## Why GenLayer

Traditional smart contracts can hold funds and enforce deterministic state transitions, but they cannot inspect arbitrary public evidence and decide whether a natural-language commitment was satisfied or which participant caused a multi-agent workflow to fail.

ResolveGraph keeps semantic judgment inside GenLayer consensus and keeps economic consequences deterministic.

## Verification policy

Promotion order:

1. contract design;
2. direct tests;
3. adversarial validator tests;
4. GenVM lint;
5. SDK tests;
6. frontend typecheck and production build;
7. Studionet full lifecycle;
8. deployed-source/hash verification;
9. production-like network review;
10. one controlled Vercel production deployment;
11. automated post-deploy smoke tests;
12. Portal submission dossier.

## Verified release

- Direct tests: **97/97 PASS**
- GenVM lint: **PASS**
- SDK tests: **18/18 PASS**
- Frontend typecheck/build: **PASS**
- Canonical Studionet lifecycle run: **36545373155 — SUCCESS**
- Canonical contract: `0x5E7e96dCfB5dF57881CFfBFc5b597f7b83c4A754`
- Success case: `rg-live-success-v1 — COMPLETED`
- Failure case: `rg-live-failure-v1 — FAILED_SETTLED`
- Final challenged failure attribution: **EXTERNAL**
- Deployed source equality: **true**
- Production URL: https://resolvegraph-genlayer.vercel.app
- Provenance feature CI: **36572374200 — SUCCESS**
- Provenance feature production smoke: **36572844244 — SUCCESS**
- Signed GitHub provenance verifier: wallet ↔ on-chain assignee ↔ frozen step policy ↔ GitHub account ↔ immutable commit SHA ↔ owner-controlled gist challenge.
- Provenance feature verification commit: `5da51a7647dae310c551f4afcce49ea4c7e0b802`
- V2 immutable recipe registry Studionet run: **36587816018 — SUCCESS**
- V2 contract: `0x8025214a654Dd4d500bc549f204ED9a9a4d2a8c1`
- V2 policy: `RG_V2_IMMUTABLE_RECIPES`
- V2 live workflow: `rg-v2-live-recipe-v1 — ACTIVE — 3 recipe-bound steps`
- V2 deployed/repository source SHA256: `2d5939b27a116ca3754b301a3bbbf0a1f335aaa76d6f1ce1c0abd09b17d96673`
- V2 deployed-source equality: **true**
- Typed evidence registry Studionet run: **36598129489 — SUCCESS**
- Evidence registry: `0xB5B0Dd5E454590fCb4FCEFD85B11d16774552390`
- Evidence registry deployed/repository source SHA256: `8e7dbd50992f5d14544194d8e85a64e5ddcb4001ebc4b21d66ba979a31bba472`
- Evidence registry deployed-source equality: **true**
- Canonical archived evidence: round 1 PRIMARY + SUPPORT, round 2 CHALLENGE for `rg-live-success-v1/source-check`
- Source adapters proof: **36604750863 — SUCCESS** (GitHub commit/PR/CI, Ethereum receipt, artifact capture, digest replay)
- External SDK consumer proof: **36601714919 — SUCCESS**
- V3 bounded appeals proof: **36604861578 — SUCCESS**
- V3 contract: `0x14948AD5dCd317Ec49f5CEf7e08c72176C900214`
- V3 source SHA256: `4722a5fad4de2974c242ea1bc14e68f50da58914cd77c675e1a86b899acc25ee`
- V3 deployed-source equality: **true**
- Cross-chain settlement proof: **36606957197 — SUCCESS**
- Cross-chain settlement contract: `0x0ca7432339C86ab01118f46D847A11EF94CB4BAA`
- Cross-chain source SHA256: `67af44ce57eb4c672b156372c7fd042a0896d24794b788c897915b7f7993a4d0`
- External source adapter digest: `702b57448a292ae70ec6d7eb7ff11527df7d2391624ec78a919def40ac60133e`
- Cross-chain trust boundary: sponsor-selected relayer attestation; no token-bridge claim.

## Status

**LIVE_VERIFIED — SUBMISSION READY**

The proof manifest at `docs/PROOF_MANIFEST.json` is the canonical machine-readable release record. The GitHub provenance adapter is an external verification receipt. The V2 recipe registry and typed evidence archive are separately deployed, source-matched Studionet verification surfaces; the production workflow UI intentionally keeps the canonical V1 settlement contract active until an explicit migration is chosen.

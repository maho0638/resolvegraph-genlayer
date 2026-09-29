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
- public evidence URLs, bounded on-chain evidence snapshots and decision-bound evidence manifests;
- GenLayer validator re-evaluation of decisive semantic judgments;
- one-hour challenge windows;
- workflow-level fault attribution;
- deterministic settlement;
- portable adjudication receipts for downstream reputation / validation systems;
- versioned workflow recipe starters;
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

- Direct tests: **68/68 PASS**
- GenVM lint: **PASS**
- SDK tests: **11/11 PASS**
- Frontend typecheck/build: **PASS**
- Canonical Studionet lifecycle run: **36545373155 — SUCCESS**
- Canonical contract: `0x5E7e96dCfB5dF57881CFfBFc5b597f7b83c4A754`
- Success case: `rg-live-success-v1 — COMPLETED`
- Failure case: `rg-live-failure-v1 — FAILED_SETTLED`
- Final challenged failure attribution: **EXTERNAL**
- Deployed source equality: **true**
- Production URL: https://resolvegraph-genlayer.vercel.app
- Production CI: **36568432075 — SUCCESS**
- Production smoke: **36569042701 — SUCCESS**
- Verified production commit: `94a61f7f4401eb84f321e13136404dd028279c5c`

## Status

**LIVE_VERIFIED — SUBMISSION READY**

The proof manifest at `docs/PROOF_MANIFEST.json` is the canonical machine-readable release record.

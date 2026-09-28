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
- public evidence URLs and evidence hashes;
- GenLayer validator re-evaluation of decisive semantic judgments;
- one-hour challenge windows;
- workflow-level fault attribution;
- deterministic settlement;
- portable adjudication receipts for downstream reputation / validation systems;
- a reviewer-friendly proof dashboard and TypeScript SDK.

## Why GenLayer

Traditional smart contracts can hold funds and enforce deterministic state transitions, but they cannot inspect arbitrary public evidence and decide whether a natural-language commitment was satisfied or which participant caused a multi-agent workflow to fail.

ResolveGraph keeps semantic judgment inside GenLayer consensus and keeps economic consequences deterministic.

## Development policy

No production frontend deployment is performed during development.

Promotion order:

1. contract design;
2. direct tests;
3. adversarial validator tests;
4. GenVM lint;
5. SDK tests;
6. frontend production build;
7. Studionet full lifecycle;
8. deployed-source/hash verification;
9. production-like network review;
10. one controlled Vercel deployment;
11. post-deploy smoke tests;
12. Portal submission dossier.

## Status

ACTIVE DEVELOPMENT — NOT READY FOR PORTAL SUBMISSION

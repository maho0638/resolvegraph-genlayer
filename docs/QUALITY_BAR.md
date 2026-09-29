# ResolveGraph Quality Bar

ResolveGraph is not considered submission-ready because a page renders or a contract deploys.

Required gates:

- [x] bounded and documented Intelligent Contract state machine;
- [x] positive, negative, conflict and unavailable-evidence paths;
- [x] dependency graph tests;
- [x] immutable V2 recipe registry tests: duplicate rejection, version/hash separation, unknown-hash rejection and frozen step binding;
- [x] typed evidence registry tests: content-addressed digest, immutable round/role slot, challenge-round separation, typed immutable references and fetch-time validation;
- [x] role/authorization tests;
- [x] challenge-window enforcement;
- [x] validator-disagreement rejection;
- [x] low-confidence fail-closed behavior;
- [x] reward and bond accounting tests;
- [x] double-settlement prevention;
- [x] workflow fault-attribution tests;
- [x] deterministic slash threshold;
- [x] GenVM lint;
- [x] TypeScript SDK tests, including provenance scope/expiry checks;
- [x] frontend typecheck and production build;
- [x] live Studionet create/fund/accept/submit/resolve/challenge/pay flow;
- [x] separate V2 Studionet recipe-registry deployment with three registered policies, three recipe-bound steps and deployed-source equality;
- [x] separate Studionet typed evidence-registry deployment with live remote-byte SHA-256 captures, round-1/round-2 archive lineage and deployed-source equality;
- [x] live failed-workflow attribution/challenge/settlement flow;
- [x] deployed-source equality / pinned source hashes;
- [x] machine-readable proof manifest;
- [x] reviewer walkthrough;
- [x] signed GitHub provenance verifier with on-chain assignee match, wallet signature, immutable commit SHA, gist ownership challenge, scoped expiry and portable receipt schema;
- [x] controlled Vercel production deployment;
- [x] automated post-deploy smoke test;
- [x] source adapter E2E proof with digest replay;
- [x] independent SDK consumer proof;
- [x] reviewer-mode case timeline;
- [x] bounded bonded V3 appeal policy and live Studionet source-equality proof;
- [x] cross-chain conditioned settlement with relayer trust model, replay guard, confirmation threshold, reorg path, timeout/refund and live source-equality proof.

Verified production evidence:

- provenance feature commit `5da51a7647dae310c551f4afcce49ea4c7e0b802`;
- CI `36572374200` — SUCCESS;
- production smoke `36572844244` — SUCCESS.

V2 recipe registry evidence: run `36587816018` — SUCCESS; contract `0x8025214a654Dd4d500bc549f204ED9a9a4d2a8c1`; deployed-source equality true.

Typed evidence archive evidence: run `36598129489` — SUCCESS; contract `0xB5B0Dd5E454590fCb4FCEFD85B11d16774552390`; deployed-source equality true.

Target achieved for this release: a complete ecosystem product, not a screenshot/demo submission.

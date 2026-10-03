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
- final promoted-main CI must pass;
- `.github/workflows/production-smoke.yml` must pass against the matching Vercel deployment.

V2 recipe registry evidence: run `37117935627` — SUCCESS; contract `0x58De3354F739D6E1C9DBe1857B072262D96e5EE2`; deployed-source equality true.

Typed evidence archive evidence: run `37132147367` — SUCCESS; contract `0x7436623f5bc064179546344b587fe9BF30B71004`; deployed-source equality true.

Target achieved for this release: a complete ecosystem product, not a screenshot/demo submission.

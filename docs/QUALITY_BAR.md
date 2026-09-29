# ResolveGraph Quality Bar

ResolveGraph is not considered submission-ready because a page renders or a contract deploys.

Required gates:

- [x] bounded and documented Intelligent Contract state machine;
- [x] positive, negative, conflict and unavailable-evidence paths;
- [x] dependency graph tests;
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
- [x] live failed-workflow attribution/challenge/settlement flow;
- [x] deployed-source equality / pinned source hashes;
- [x] machine-readable proof manifest;
- [x] reviewer walkthrough;
- [x] signed GitHub provenance verifier with on-chain assignee match, wallet signature, immutable commit SHA, gist ownership challenge, scoped expiry and portable receipt schema;
- [x] controlled Vercel production deployment;
- [x] automated post-deploy smoke test.

Verified production evidence:

- provenance feature commit `5da51a7647dae310c551f4afcce49ea4c7e0b802`;
- CI `36572374200` — SUCCESS;
- production smoke `36572844244` — SUCCESS.

Target achieved for this release: a complete ecosystem product, not a screenshot/demo submission.

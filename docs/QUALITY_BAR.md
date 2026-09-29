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
- [x] TypeScript SDK tests;
- [x] frontend typecheck and production build;
- [x] live Studionet create/fund/accept/submit/resolve/challenge/pay flow;
- [x] live failed-workflow attribution/challenge/settlement flow;
- [x] deployed-source equality / pinned source hashes;
- [x] machine-readable proof manifest;
- [x] reviewer walkthrough;
- [x] controlled Vercel production deployment;
- [x] automated post-deploy smoke test.

Verified production evidence:

- commit `94a61f7f4401eb84f321e13136404dd028279c5c`;
- CI `36568432075` — SUCCESS;
- production smoke `36569042701` — SUCCESS.

Target achieved for this release: a complete ecosystem product, not a screenshot/demo submission.

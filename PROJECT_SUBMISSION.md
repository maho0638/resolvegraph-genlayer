# ResolveGraph — Project Submission Dossier

## Status

DEVELOPMENT — DO NOT SUBMIT YET

ResolveGraph is being built for the GenLayer Projects category, where the Intelligent Contract must be central to the product rather than an optional demo.

## Product thesis

ResolveGraph is a multi-agent workflow settlement platform. Sponsors fund dependent commitments, participants post bonds, agents submit public evidence, GenLayer consensus evaluates each natural-language commitment, and a workflow-level fault-attribution round determines how remaining escrow and bonds settle when the overall workflow fails.

## Differentiation from prior projects

- ProofJudge: one sponsor + one contractor + one milestone.
- ResearchArena: multiple researchers compete for one research reward or sequential research phases.
- ResolveGraph: multiple assigned participants cooperate inside one dependency graph, rewards settle per step, bonds remain exposed to later root-cause attribution, and the terminal outcome produces a portable adjudication receipt.

## GenLayer-critical functions

- semantic commitment evaluation over live public evidence;
- validator re-execution of decisive fields;
- fresh challenge rounds;
- multi-step workflow fault attribution;
- native GEN settlement based on consensus result.

## Submission gate

Do not submit until all of the following are pinned:

- final direct-test count;
- GenVM lint;
- SDK build/tests;
- frontend typecheck/build;
- canonical live Studionet contract;
- successful multi-step workflow lifecycle;
- failed-workflow challenge + attribution lifecycle;
- contract source hash / deployed-source verification;
- machine-readable proof manifest;
- final production deployment and post-deploy smoke test.

# ResolveGraph Next Milestone — Advanced V3 Product Integration

Status: **DEVELOPMENT — NOT YET PROMOTED**

## Goal

Turn the already verified V3 bounded-appeal protocol from an isolated proof surface into a usable product path without weakening the canonical V1 release.

The milestone focuses on product integration rather than adding unrelated features:

- interactive V3 workflow creation and funding;
- exact participant-bond handling;
- exact 5% appeal-bond handling;
- one fresh-evidence step appeal;
- explicit decision finalization before settlement;
- bounded workflow fault-attribution appeal and finalization;
- SDK builders for recipe-bound steps and bonded appeals;
- reviewer-visible decision/economic lineage.

## Promotion gate

No production deployment is allowed until all of the following are complete:

1. SDK tests and frontend typecheck/build pass.
2. Repo-wide direct tests and GenVM lint pass.
3. V3 reviewer audit covers threshold, validator, state and economic boundaries.
4. A new full V3 Studionet lifecycle proves create/fund/accept/evidence/resolve/appeal/finalize/settle.
5. Deployed V3 source hash matches repository source.
6. Reviewer proof and machine-readable verification records are updated.
7. Production is deployed once, followed by smoke verification.

The existing V1 production path remains the canonical stable release until that gate is complete.

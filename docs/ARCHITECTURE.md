# ResolveGraph Architecture

ResolveGraph is a multi-agent workflow settlement platform built around one economic state machine rather than a collection of disconnected AI demos.

## Problem boundary

Open agent protocols can describe identity, capabilities, messaging, payments and validation requests. They do not by themselves decide what should happen when a multi-party workflow partially succeeds and then fails.

ResolveGraph addresses four questions:

1. What did each participant commit to?
2. Did each step satisfy its natural-language requirement?
3. If the workflow fails, which step or participant is the primary attributable cause?
4. How should GEN escrow and participant bonds settle after challenge/re-review?

## Core workflow

`DRAFT -> ACTIVE -> COMPLETED`

or, on failure:

`DRAFT -> ACTIVE -> ATTRIBUTED -> ATTRIBUTION_CHALLENGED -> ATTRIBUTED -> FAILED_SETTLED`

Each workflow contains up to eight steps. A step can depend on up to two earlier steps, allowing branches and joins rather than only a linear checklist.

Step lifecycle:

`PENDING_ACCEPTANCE -> ACCEPTED -> SUBMITTED -> RESOLVED_* -> CHALLENGED -> RESOLVED_* -> PAID`

A successful step pays its reward only after the initial one-hour challenge window or after a fresh challenge resolution. The participant bond remains locked until the entire workflow completes. This allows later workflow-level fault attribution to slash a previously successful step if later evidence establishes that it was the root cause.

## Economic model

- sponsor funds every step with native GEN;
- assignee accepts with a deterministic participant bond;
- passed step reward is released after its challenge gate;
- participant bonds remain locked until workflow terminal settlement;
- completed workflows return all bonds;
- failed workflows perform GenLayer fault attribution first;
- if one participant is identified with high-confidence primary fault, that participant bond can be transferred to the sponsor;
- ambiguous, external or multi-party fault returns bonds rather than forcing an arbitrary slash;
- all still-unpaid step rewards return to the sponsor on failed-workflow settlement.

## Immutable recipe registry (V2)

ResolveGraph V2 adds a separate content-addressed policy registry without mutating the canonical V1 settlement deployment. A recipe hash commits to:

- recipe ID and explicit version;
- display name and role label;
- natural-language requirement and rubric;
- evidence type;
- the one-hour challenge policy;
- the 20% bond rule (bond divisor 5);
- the step-reward plus locked-bond payout mode.

The hash uses length-prefixed canonical fields before SHA-256 hashing, avoiding delimiter ambiguity. Registry entries have no update method. Re-registering identical content is rejected, and changing the version or policy content produces a different hash. `add_step_from_recipe` copies the registered policy into the step and also stores `recipe_id`, `recipe_version`, and `recipe_hash`, so later review can prove exactly which reusable policy instantiated the commitment.

Verified V2 Studionet contract:
`0x8025214a654Dd4d500bc549f204ED9a9a4d2a8c1`

Verified live workflow:
`rg-v2-live-recipe-v1` with three recipe-bound steps.

The production V1 builder is intentionally not auto-migrated to V2. This keeps the already verified settlement contract stable while V2 remains an opt-in evolution.

## Consensus boundary

GenLayer is used only for semantic decisions that deterministic code cannot make:

- whether a submitted deliverable satisfies a natural-language commitment;
- whether fresh counterevidence changes that judgment;
- which workflow step is the primary attributable cause of an overall failure.

Economic transfers, challenge timing, dependency checks, authorization, confidence floors, and slash thresholds remain deterministic.

## Agent interoperability

Each step stores optional portable agent metadata:

- agent reference, suitable for an ERC-8004 registry reference;
- A2A endpoint;
- human-readable role label.

ResolveGraph does not pretend these strings prove agent identity. They are interoperable references that can be verified by clients or future adapters.

The project will expose portable adjudication receipts so downstream ERC-8004 reputation/validation systems, agent marketplaces, or ordinary applications can consume the outcome without scraping the UI.

## Promotion policy

No Vercel deployment occurs during development.

Promotion requires direct tests, adversarial validator tests, GenVM lint, SDK tests, frontend production build, complete Studionet lifecycle, source-hash proof and final smoke checks first.

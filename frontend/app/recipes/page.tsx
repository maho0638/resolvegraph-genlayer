import Link from "next/link";
import { WORKFLOW_RECIPES, recipeLabel } from "@/lib/recipes";
import {
  serverReadV2Recipe,
  serverV2RecipeContractAddress,
} from "@/lib/server-genlayer";

const proof = {
  run: "37117935627",
  workflow: "rg-v2-live-recipe-v1",
  sourceHash:
    "271ad9bfadcf5fa0d123022097485cf0d6073ba65b1f6cf8d6e1f40938725849",
};

function asText(value: unknown) {
  return String(value ?? "");
}

async function loadRegistry() {
  const count = Number(await serverReadV2Recipe("get_recipe_count"));
  const hashes = await Promise.all(
    Array.from({ length: count }, (_, index) =>
      serverReadV2Recipe("get_recipe_hash_by_index", [index]),
    ),
  );
  const recipes = await Promise.all(
    hashes.map((hash) => serverReadV2Recipe("get_recipe", [hash])),
  );

  return recipes.map((recipe: any, index) => ({
    id: asText(recipe?.id),
    version: asText(recipe?.version),
    name: asText(recipe?.name),
    roleLabel: asText(recipe?.role_label),
    requirement: asText(recipe?.requirement),
    rubric: asText(recipe?.rubric),
    evidenceType: asText(recipe?.evidence_type),
    challengeWindowSeconds: Number(recipe?.challenge_window_seconds ?? 0),
    bondDivisor: Number(recipe?.bond_divisor ?? 0),
    payoutMode: asText(recipe?.payout_mode),
    publisher: asText(recipe?.publisher),
    recipeHash: asText(recipe?.recipe_hash || hashes[index]),
  }));
}

export default async function Recipes() {
  let liveRecipes: Awaited<ReturnType<typeof loadRegistry>> = [];
  let registryError = "";

  try {
    liveRecipes = await loadRegistry();
  } catch (error: any) {
    registryError = error?.message || "Live V2 registry read unavailable.";
  }

  const liveById = new Map(liveRecipes.map((recipe) => [recipe.id, recipe]));

  return (
    <>
      <div className="sectionHead">
        <div>
          <div className="eyebrow">Workflow Recipes</div>
          <h1 style={{ fontSize: "56px" }}>
            Reusable policy, frozen by content hash.
          </h1>
          <p className="lede">
            ResolveGraph V2 adds a separate content-addressed Studionet recipe
            registry. Recipe ID, version, role, requirement, rubric, evidence
            type and fixed challenge/bond policy are hashed into an immutable
            registry entry.
          </p>
        </div>
        <div className="actions compactActions">
          <Link className="button" href="/workflows/new">
            Use in V1 builder
          </Link>
          <a
            className="button secondary"
            href="/api/recipes"
            target="_blank"
            rel="noreferrer"
          >
            Live registry JSON
          </a>
        </div>
      </div>

      <section className="panel section emphasisPanel">
        <div className="eyebrow">V2 immutable registry · LIVE VERIFIED</div>
        <h2>Registry state is read directly from the verified Studionet contract</h2>
        <div className="proofFacts">
          <p>
            <strong>V2 contract</strong>
            <code>{serverV2RecipeContractAddress()}</code>
          </p>
          <p>
            <strong>Policy version</strong>
            <code>RG_V2_IMMUTABLE_RECIPES</code>
          </p>
          <p>
            <strong>Live registry read</strong>
            <code>
              {registryError
                ? "temporarily unavailable"
                : liveRecipes.length + " recipes · RPC verified"}
            </code>
          </p>
          <p>
            <strong>Live workflow</strong>
            <code>{proof.workflow} · ACTIVE · 3 recipe-bound steps</code>
          </p>
          <p>
            <strong>Source equality</strong>
            <code>true · {proof.sourceHash}</code>
          </p>
          <p>
            <strong>Studionet proof</strong>
            <a
              className="textLink"
              href={
                "https://github.com/maho0638/resolvegraph-genlayer/actions/runs/" +
                proof.run
              }
              target="_blank"
              rel="noreferrer"
            >
              run {proof.run} · SUCCESS ↗
            </a>
          </p>
        </div>
        {registryError ? (
          <div className="status warn">
            The static verified proof remains visible, but the live registry RPC
            read failed: {registryError}
          </div>
        ) : null}
      </section>

      <section className="grid3">
        {WORKFLOW_RECIPES.map((starter) => {
          const live = liveById.get(starter.id);
          return (
            <article className="card recipeCard" key={starter.id}>
              <div className="eyebrow">
                {live
                  ? live.name + " · " + live.version
                  : recipeLabel(starter)}
              </div>
              <h3>{starter.name}</h3>
              <p>{starter.summary}</p>

              <div className="recipeBlock">
                <strong>Immutable V2 recipe hash</strong>
                <code>
                  {live?.recipeHash || "Live registry read unavailable"}
                </code>
              </div>

              {live ? (
                <>
                  <div className="recipeBlock">
                    <strong>Registry policy</strong>
                    <span>
                      Evidence: {live.evidenceType} · challenge{" "}
                      {live.challengeWindowSeconds}s · bond 1/
                      {live.bondDivisor} · {live.payoutMode}
                    </span>
                  </div>
                  <div className="recipeBlock">
                    <strong>Publisher</strong>
                    <code>{live.publisher}</code>
                  </div>
                </>
              ) : null}

              <div className="recipeBlock">
                <strong>Commitment</strong>
                <span>{live?.requirement || starter.requirement}</span>
              </div>
              <div className="recipeBlock">
                <strong>Rubric</strong>
                <span>{live?.rubric || starter.rubric}</span>
              </div>
            </article>
          );
        })}
      </section>

      <section className="panel section">
        <div className="eyebrow">Compatibility boundary</div>
        <h2>V1 stays live; V2 is isolated and proven</h2>
        <p className="muted">
          The production workflow builder still targets the canonical V1
          settlement contract so existing live workflows are not silently
          migrated. The separate V2 contract proves the immutable recipe-registry
          design on Studionet: duplicate content cannot overwrite an existing
          recipe, a version change produces a different content hash, and each
          instantiated step stores the exact recipe ID, version and hash. A
          later migration can opt workflows into V2 explicitly rather than
          replacing the already verified V1 contract in place.
        </p>
      </section>
    </>
  );
}

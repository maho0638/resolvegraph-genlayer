import Link from "next/link";
import { WORKFLOW_RECIPES, recipeLabel } from "@/lib/recipes";

const registry = {
  contract: "0x8025214a654Dd4d500bc549f204ED9a9a4d2a8c1",
  run: "36587816018",
  workflow: "rg-v2-live-recipe-v1",
  sourceHash: "2d5939b27a116ca3754b301a3bbbf0a1f335aaa76d6f1ce1c0abd09b17d96673",
  hashes: {
    "software-delivery": "200c7cf2a38dd134d815c493795a01c65610648cf701334366eb3ae46acd1e04",
    "research-verification": "91602e091cce5964d300b3880bee3e5a7862fa4b17d1bac71ba2b3229e4a638f",
    "service-sla": "9dca5c6c8790600ca6629e4a47eebb3f71374237f1f29732c45c7ef7512942f2",
  } as Record<string, string>,
};

export default function Recipes() {
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
            registry. Recipe ID, version, role, requirement, rubric, evidence type
            and fixed challenge/bond policy are hashed into an immutable registry entry.
          </p>
        </div>
        <Link className="button" href="/workflows/new">Use in V1 builder</Link>
      </div>

      <section className="panel section emphasisPanel">
        <div className="eyebrow">V2 immutable registry · LIVE VERIFIED</div>
        <h2>Three reusable policies are registered on GenLayer Studionet</h2>
        <div className="proofFacts">
          <p><strong>V2 contract</strong><code>{registry.contract}</code></p>
          <p><strong>Policy version</strong><code>RG_V2_IMMUTABLE_RECIPES</code></p>
          <p><strong>Live workflow</strong><code>{registry.workflow} · ACTIVE · 3 recipe-bound steps</code></p>
          <p><strong>Source equality</strong><code>true · {registry.sourceHash}</code></p>
          <p>
            <strong>Studionet proof</strong>
            <a
              className="textLink"
              href={"https://github.com/maho0638/resolvegraph-genlayer/actions/runs/" + registry.run}
              target="_blank"
              rel="noreferrer"
            >
              run {registry.run} · SUCCESS ↗
            </a>
          </p>
        </div>
      </section>

      <section className="grid3">
        {WORKFLOW_RECIPES.map((recipe) => (
          <article className="card recipeCard" key={recipe.id}>
            <div className="eyebrow">{recipeLabel(recipe)}</div>
            <h3>{recipe.name}</h3>
            <p>{recipe.summary}</p>
            <div className="recipeBlock">
              <strong>Immutable V2 recipe hash</strong>
              <code>{registry.hashes[recipe.id]}</code>
            </div>
            <div className="recipeBlock">
              <strong>Commitment</strong>
              <span>{recipe.requirement}</span>
            </div>
            <div className="recipeBlock">
              <strong>Rubric</strong>
              <span>{recipe.rubric}</span>
            </div>
          </article>
        ))}
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
          instantiated step stores the exact recipe ID, version and hash. A later
          migration can opt workflows into V2 explicitly rather than replacing
          the already verified V1 contract in place.
        </p>
      </section>
    </>
  );
}

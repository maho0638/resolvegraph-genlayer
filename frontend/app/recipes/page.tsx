import Link from "next/link";
import { WORKFLOW_RECIPES, recipeLabel } from "@/lib/recipes";

export default function Recipes() {
  return (
    <>
      <div className="sectionHead">
        <div>
          <div className="eyebrow">Workflow Recipes</div>
          <h1 style={{ fontSize: "56px" }}>
            Start from a reusable policy pattern, then freeze the real commitment.
          </h1>
          <p className="lede">
            Recipes are transparent drafting helpers. When a step is created,
            its commitment, rubric, dependencies, reward and deadline become
            explicit contract inputs; sealing freezes the graph.
          </p>
        </div>
        <Link className="button" href="/workflows/new">Use a recipe</Link>
      </div>

      <section className="grid3">
        {WORKFLOW_RECIPES.map((recipe) => (
          <article className="card recipeCard" key={recipe.id}>
            <div className="eyebrow">{recipeLabel(recipe)}</div>
            <h3>{recipe.name}</h3>
            <p>{recipe.summary}</p>
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
        <div className="eyebrow">Integrity boundary</div>
        <h2>What is and is not claimed</h2>
        <p className="muted">
          This catalog is not a separate on-chain registry. It is a reviewer-visible
          set of versioned starter policies. ResolveGraph currently binds the actual
          requirement and rubric to each created step and freezes the graph when the
          sponsor seals the workflow. A future contract revision can add a dedicated
          recipe hash registry without pretending that capability exists today.
        </p>
      </section>
    </>
  );
}

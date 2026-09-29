export type WorkflowRecipe = {
  id: string;
  version: string;
  name: string;
  summary: string;
  roleLabel: string;
  requirement: string;
  rubric: string;
};

export const WORKFLOW_RECIPES: WorkflowRecipe[] = [
  {
    id: "software-delivery",
    version: "v1",
    name: "Software delivery",
    summary: "Verify a concrete software deliverable with independent public evidence.",
    roleLabel: "Delivery Agent",
    requirement:
      "Deliver the agreed software change and publish immutable evidence that identifies the exact revision being reviewed.",
    rubric:
      "PASS only when the primary source proves the requested change exists in the identified revision and the independent support source corroborates the result. FAIL for missing requirements, contradictory evidence, or a revision that cannot be tied to the claimed delivery.",
  },
  {
    id: "research-verification",
    version: "v1",
    name: "Research verification",
    summary: "Judge a research claim against a frozen rubric and independently sourced evidence.",
    roleLabel: "Research Agent",
    requirement:
      "Produce a concise research conclusion supported by public primary evidence and an independent corroborating source.",
    rubric:
      "PASS only when the conclusion directly answers the stated objective, the cited evidence supports the material claims, and the independent source corroborates the decisive facts. Mark UNDETERMINED when evidence is insufficient or inaccessible.",
  },
  {
    id: "service-sla",
    version: "v1",
    name: "Service SLA",
    summary: "Adjudicate a service commitment and preserve a causal path for downstream failures.",
    roleLabel: "Service Agent",
    requirement:
      "Satisfy the stated service-level commitment before the deadline and publish evidence of the delivered result.",
    rubric:
      "PASS only when the evidence proves the service commitment was met within scope and time. If the result fails, distinguish LOCAL delivery failure, UPSTREAM dependency failure, EXTERNAL cause, or UNDETERMINED based only on supplied evidence.",
  },
];

export function recipeLabel(recipe: WorkflowRecipe) {
  return recipe.name + " · " + recipe.version;
}

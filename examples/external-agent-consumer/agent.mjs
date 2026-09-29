import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import {
  buildPortableReceipt,
  formatGen,
  parseGithubSourceUrl,
} from "@resolvegraph/sdk";

const baseUrl =
  process.env.RESOLVEGRAPH_BASE_URL ||
  "https://resolvegraph-genlayer.vercel.app";
const workflowId = process.env.RESOLVEGRAPH_WORKFLOW || "rg-live-success-v1";
const stepId = process.env.RESOLVEGRAPH_STEP || "source-check";

async function json(path) {
  const response = await fetch(baseUrl + path, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(path + " failed with HTTP " + response.status);
  }
  return response.json();
}

const [workflowResponse, apiReceipt] = await Promise.all([
  json("/api/workflow?id=" + encodeURIComponent(workflowId)),
  json(
    "/api/receipt?workflow=" +
      encodeURIComponent(workflowId) +
      "&step=" +
      encodeURIComponent(stepId),
  ),
]);

const workflow = workflowResponse.workflow;
const step = workflowResponse.steps.find(
  (candidate) => String(candidate.id) === stepId,
);
assert.ok(step, "canonical step is missing");

const sdkReceipt = buildPortableReceipt(workflow, step);

assert.equal(sdkReceipt.schema, "resolvegraph-receipt-v1");
assert.equal(sdkReceipt.workflowId, apiReceipt.workflowId);
assert.equal(sdkReceipt.stepId, apiReceipt.stepId);
assert.equal(sdkReceipt.outcome, apiReceipt.outcome);
assert.equal(sdkReceipt.decisionHash, apiReceipt.decisionHash);
assert.equal(sdkReceipt.policyVersion, apiReceipt.policyVersion);
assert.equal(sdkReceipt.participant.toLowerCase(), apiReceipt.participant.toLowerCase());

const evidenceUrls = [
  step.evidence_url,
  step.support_url,
  step.challenge_url,
].filter(Boolean);
const githubEvidence = [];
for (const url of evidenceUrls) {
  try {
    githubEvidence.push(parseGithubSourceUrl(String(url)));
  } catch {
    // Public web evidence is allowed; only canonical GitHub forms are parsed.
  }
}

const report = {
  schema: "resolvegraph-external-consumer-proof-v1",
  sdkPackage: "@resolvegraph/sdk",
  sdkVersion: "0.1.0",
  baseUrl,
  workflowId,
  stepId,
  workflowStatus: workflow.status,
  stepStatus: step.status,
  participant: step.assignee,
  reward: formatGen(step.reward),
  bond: formatGen(step.bond_required),
  apiReceipt,
  sdkReceipt,
  receiptsMatch: true,
  parsedGithubEvidence: githubEvidence,
  verifiedAt: new Date().toISOString(),
};

await writeFile(
  "external-consumer-proof.json",
  JSON.stringify(report, null, 2) + "\n",
);

console.log("ResolveGraph external SDK consumer verified");
console.log("workflow", workflowId, workflow.status);
console.log("step", stepId, step.status);
console.log("decision", sdkReceipt.decisionHash);
console.log("reward/bond", report.reward, report.bond);

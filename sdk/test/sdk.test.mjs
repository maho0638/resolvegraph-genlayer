import test from "node:test";
import assert from "node:assert/strict";
import {
  buildAddStep,
  buildCreateWorkflow,
  buildPortableReceipt,
  buildSubmitEvidence,
  formatGen,
  normalizeAgentRef,
  parseGen,
  requiredBond,
} from "../dist/index.js";

test("GEN helpers preserve 18-decimal values", () => {
  const wei = parseGen("1.25");
  assert.equal(wei, 1250000000000000000n);
  assert.equal(formatGen(wei), "1.25 GEN");
});

test("bond helper matches contract 20 percent rule", () => {
  assert.equal(requiredBond(5000n), 1000n);
});

test("agent refs produce portable ERC-8004-style identifiers", () => {
  const result = normalizeAgentRef({
    agentRegistry: "eip155:1:0xabc",
    agentId: 7,
    a2aEndpoint: "https://agent.example/.well-known/agent-card.json",
    roleLabel: "Builder",
  });
  assert.equal(result.agentRef, "eip155:1:0xabc#agent-7");
  assert.equal(result.roleLabel, "Builder");
});

test("workflow request builder is deterministic", () => {
  assert.deepEqual(
    buildCreateWorkflow("wf-1", " Demo ", " Objective text "),
    {
      functionName: "create_workflow",
      args: ["wf-1", "Demo", "Objective text"],
    },
  );
});

test("add-step request carries payable reward", () => {
  const request = buildAddStep({
    workflowId: "wf-1",
    stepId: "step-a",
    assignee: "0x1111111111111111111111111111111111111111",
    requirement: "A sufficiently detailed requirement for this SDK test.",
    rubric: "A sufficiently detailed acceptance rubric for this SDK test.",
    deadlineUnix: 1900000000,
    rewardWei: 5000n,
  });
  assert.equal(request.functionName, "add_step");
  assert.equal(request.value, 5000n);
});

test("evidence builder rejects duplicate hostnames", () => {
  assert.throws(
    () =>
      buildSubmitEvidence(
        "wf",
        "step",
        "https://example.com/a",
        "https://www.example.com/b",
      ),
    /independent hostnames/,
  );
});

test("portable receipt exposes decision hash and outcome", () => {
  const receipt = buildPortableReceipt(
    {
      id: "wf",
      sponsor: "0x1111111111111111111111111111111111111111",
      title: "Demo",
      objective: "Demo objective",
      status: "ACTIVE",
      step_count: 1,
      policy_version: "RG_V1_MULTI_AGENT_FAULT",
    },
    {
      workflow_id: "wf",
      id: "step",
      index: 0,
      assignee: "0x2222222222222222222222222222222222222222",
      requirement: "Requirement",
      rubric: "Rubric",
      reward: 5000,
      bond_required: 1000,
      deadline: 1900000000,
      status: "RESOLVED_PASS",
      verdict: "PASS",
      score: 95,
      confidence: 94,
      decision_hash: "abc123",
    },
  );
  assert.equal(receipt.outcome, "PASS");
  assert.equal(receipt.decisionHash, "abc123");
  assert.equal(receipt.participant, "0x2222222222222222222222222222222222222222");
});

import test from "node:test";
import assert from "node:assert/strict";
import {
  buildAddStep,
  buildCreateWorkflow,
  buildGithubProvenanceMessage,
  buildPortableReceipt,
  buildSubmitEvidence,
  formatGen,
  normalizeAgentRef,
  parseGen,
  requiredBond,
  assertGithubProvenanceFresh,
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
      evidence_url: "https://primary.example/proof",
      support_url: "https://support.example/proof",
      challenge_url: "https://challenge.example/proof",
    },
  );
  assert.equal(receipt.outcome, "PASS");
  assert.equal(receipt.decisionHash, "abc123");
  assert.equal(receipt.participant, "0x2222222222222222222222222222222222222222");
  assert.equal(receipt.evidence.primary, "https://primary.example/proof");
  assert.equal(receipt.evidence.support, "https://support.example/proof");
  assert.equal(receipt.evidence.challenge, "https://challenge.example/proof");
});

test("A2A endpoint rejects non-HTTPS values", () => {
  assert.throws(
    () => normalizeAgentRef({ a2aEndpoint: "http://agent.example/card" }),
    /HTTPS/,
  );
});

test("agent registry and id must be provided together", () => {
  assert.throws(
    () => normalizeAgentRef({ agentRegistry: "eip155:1:0xabc" }),
    /provided together/,
  );
});

test("evidence builder rejects URL userinfo tricks", () => {
  assert.throws(
    () =>
      buildSubmitEvidence(
        "wf",
        "step",
        "https://example.com@evil.example/a",
        "https://support.example/b",
      ),
    /userinfo/,
  );
});

test("evidence builder rejects unsafe backslash URLs", () => {
  assert.throws(
    () =>
      buildSubmitEvidence(
        "wf",
        "step",
        "https://example.com\\@evil.example/a",
        "https://support.example/b",
      ),
    /backslash/,
  );
});

test("GitHub provenance message binds workflow, step, wallet, commit and expiry", () => {
  const base = {
    workflowId: "wf-1",
    stepId: "build",
    wallet: "0x1111111111111111111111111111111111111111",
    githubLogin: "octocat",
    commitUrl:
      "https://github.com/example/project/commit/0123456789abcdef0123456789abcdef01234567",
    policyDigest:
      "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    expiresAt: 2000000000,
    claimId: "0123456789abcdef",
  };
  const message = buildGithubProvenanceMessage(base);
  assert.match(message, /workflow:wf-1/);
  assert.match(message, /step:build/);
  assert.match(message, /repository:example\/project/);
  assert.match(message, /commit:0123456789abcdef0123456789abcdef01234567/);

  const replayed = buildGithubProvenanceMessage({
    ...base,
    stepId: "other-step",
  });
  assert.notEqual(message, replayed);
});

test("GitHub provenance requires full immutable commit SHA", () => {
  assert.throws(
    () =>
      buildGithubProvenanceMessage({
        workflowId: "wf",
        stepId: "step",
        wallet: "0x1111111111111111111111111111111111111111",
        githubLogin: "octocat",
        commitUrl: "https://github.com/example/project/commit/abc123",
        policyDigest:
          "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        expiresAt: 2000000000,
        claimId: "0123456789abcdef",
      }),
    /40-character hash/,
  );
});

test("GitHub provenance expiry rejects expired and overlong claims", () => {
  assert.doesNotThrow(() => assertGithubProvenanceFresh(1060, 1000, 100));
  assert.throws(
    () => assertGithubProvenanceFresh(999, 1000, 100),
    /expired/,
  );
  assert.throws(
    () => assertGithubProvenanceFresh(1200, 1000, 100),
    /cannot exceed/,
  );
});

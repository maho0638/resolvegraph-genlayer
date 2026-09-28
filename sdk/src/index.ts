export * from "./types.js";

import type {
  AgentIdentityRef,
  ContractWriteRequest,
  HexAddress,
  PortableAdjudicationReceipt,
  StepView,
  WorkflowView,
} from "./types.js";

const GEN_DECIMALS = 18n;

export function parseGen(value: string): bigint {
  const clean = value.trim();
  if (!/^\d+(\.\d{0,18})?$/.test(clean)) {
    throw new Error("GEN amount must be a non-negative decimal with at most 18 decimals.");
  }
  const [whole, fraction = ""] = clean.split(".");
  return BigInt(whole) * 10n ** GEN_DECIMALS + BigInt(fraction.padEnd(18, "0"));
}

export function formatGen(value: bigint | number | string, digits = 6): string {
  const amount = BigInt(value);
  const base = 10n ** GEN_DECIMALS;
  const whole = amount / base;
  const fraction = (amount % base).toString().padStart(18, "0").slice(0, digits);
  return `${whole}.${fraction.replace(/0+$/, "") || "0"} GEN`;
}

export function requiredBond(reward: bigint | number | string): bigint {
  const n = BigInt(reward);
  if (n <= 0n) throw new Error("Reward must be greater than zero.");
  const bond = n / 5n;
  return bond > 0n ? bond : 1n;
}

export function normalizeAgentRef(ref: AgentIdentityRef): {
  agentRef: string;
  a2aEndpoint: string;
  roleLabel: string;
} {
  let agentRef = "";
  if (ref.agentRegistry || ref.agentId !== undefined) {
    if (!ref.agentRegistry || ref.agentId === undefined) {
      throw new Error("agentRegistry and agentId must be provided together.");
    }
    agentRef = `${ref.agentRegistry}#agent-${String(ref.agentId)}`;
  }

  if (ref.a2aEndpoint && !ref.a2aEndpoint.startsWith("https://")) {
    throw new Error("A2A endpoint must use HTTPS.");
  }

  return {
    agentRef,
    a2aEndpoint: ref.a2aEndpoint ?? "",
    roleLabel: ref.roleLabel?.trim() ?? "",
  };
}

export function validateIndependentHttps(primary: string, support: string): void {
  const a = new URL(primary);
  const b = new URL(support);
  if (a.protocol !== "https:" || b.protocol !== "https:") {
    throw new Error("Evidence URLs must use HTTPS.");
  }
  const hostA = a.hostname.replace(/^www\./, "").replace(/\.$/, "").toLowerCase();
  const hostB = b.hostname.replace(/^www\./, "").replace(/\.$/, "").toLowerCase();
  if (hostA === hostB) {
    throw new Error("Evidence URLs must use independent hostnames.");
  }
}

export function buildCreateWorkflow(
  workflowId: string,
  title: string,
  objective: string,
): ContractWriteRequest {
  return {
    functionName: "create_workflow",
    args: [workflowId.trim(), title.trim(), objective.trim()],
  };
}

export function buildAddStep(input: {
  workflowId: string;
  stepId: string;
  assignee: HexAddress;
  identity?: AgentIdentityRef;
  requirement: string;
  rubric: string;
  dependencyA?: string;
  dependencyB?: string;
  deadlineUnix: bigint | number | string;
  rewardWei: bigint;
}): ContractWriteRequest {
  if (input.rewardWei <= 0n) throw new Error("Step reward must be greater than zero.");
  const identity = normalizeAgentRef(input.identity ?? {});
  return {
    functionName: "add_step",
    args: [
      input.workflowId,
      input.stepId,
      input.assignee,
      identity.roleLabel,
      identity.agentRef,
      identity.a2aEndpoint,
      input.requirement,
      input.rubric,
      input.dependencyA ?? "",
      input.dependencyB ?? "",
      BigInt(input.deadlineUnix),
    ],
    value: input.rewardWei,
  };
}

export function buildSealWorkflow(workflowId: string): ContractWriteRequest {
  return { functionName: "seal_workflow", args: [workflowId] };
}

export function buildAcceptStep(
  workflowId: string,
  stepId: string,
  bondWei: bigint,
): ContractWriteRequest {
  if (bondWei <= 0n) throw new Error("Bond must be greater than zero.");
  return {
    functionName: "accept_step",
    args: [workflowId, stepId],
    value: bondWei,
  };
}

export function buildSubmitEvidence(
  workflowId: string,
  stepId: string,
  primary: string,
  support: string,
): ContractWriteRequest {
  validateIndependentHttps(primary, support);
  return {
    functionName: "submit_evidence",
    args: [workflowId, stepId, primary, support],
  };
}

export function buildChallengeStep(
  workflowId: string,
  stepId: string,
  challengeUrl: string,
  note: string,
): ContractWriteRequest {
  if (!challengeUrl.startsWith("https://")) throw new Error("Challenge URL must use HTTPS.");
  return {
    functionName: "challenge_step",
    args: [workflowId, stepId, challengeUrl, note],
  };
}

export function buildChallengeAttribution(
  workflowId: string,
  challengeUrl: string,
  note: string,
): ContractWriteRequest {
  if (!challengeUrl.startsWith("https://")) throw new Error("Challenge URL must use HTTPS.");
  return {
    functionName: "challenge_attribution",
    args: [workflowId, challengeUrl, note],
  };
}

export function buildPortableReceipt(
  workflow: WorkflowView,
  step?: StepView,
): PortableAdjudicationReceipt {
  if (step) {
    return {
      schema: "resolvegraph-receipt-v1",
      workflowId: workflow.id,
      stepId: step.id,
      participant: step.assignee,
      agentRef: step.agent_ref,
      outcome: String(step.verdict || step.status),
      score: step.score === undefined ? undefined : Number(step.score),
      confidence: step.confidence === undefined ? undefined : Number(step.confidence),
      reasonCode: step.reason_code,
      faultClass: step.failure_class,
      decisionHash: step.decision_hash,
      policyVersion: workflow.policy_version,
      evidence: {},
    };
  }

  return {
    schema: "resolvegraph-receipt-v1",
    workflowId: workflow.id,
    participant: workflow.fault_actor,
    outcome: String(workflow.status),
    confidence:
      workflow.fault_confidence === undefined
        ? undefined
        : Number(workflow.fault_confidence),
    reasonCode: workflow.fault_reason,
    faultClass: workflow.fault_class,
    decisionHash: workflow.decision_hash,
    policyVersion: workflow.policy_version,
    evidence: {},
  };
}

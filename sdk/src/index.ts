export * from "./types.js";

import type {
  AgentIdentityRef,
  GithubProvenanceClaimInput,
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

  if (ref.a2aEndpoint) {
    normalizedHttpsHost(ref.a2aEndpoint);
  }

  return {
    agentRef,
    a2aEndpoint: ref.a2aEndpoint ?? "",
    roleLabel: ref.roleLabel?.trim() ?? "",
  };
}

function normalizedHttpsHost(value: string): string {
  if (value.includes("\\")) {
    throw new Error("URL contains an unsafe backslash form.");
  }

  const parsed = new URL(value);
  if (parsed.protocol !== "https:") {
    throw new Error("URL must use HTTPS.");
  }
  if (parsed.username || parsed.password) {
    throw new Error("URL userinfo is not allowed.");
  }

  return parsed.hostname
    .replace(/^www\./, "")
    .replace(/\.$/, "")
    .toLowerCase();
}

export function validateIndependentHttps(primary: string, support: string): void {
  const hostA = normalizedHttpsHost(primary);
  const hostB = normalizedHttpsHost(support);
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
  normalizedHttpsHost(challengeUrl);
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
  normalizedHttpsHost(challengeUrl);
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
      evidence: {
        primary: step.evidence_url,
        support: step.support_url,
        challenge: step.challenge_url,
      },
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

export function parseGithubCommitUrl(value: string): {
  owner: string;
  repo: string;
  sha: string;
} {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.hostname.toLowerCase() !== "github.com") {
    throw new Error("Commit URL must be an HTTPS github.com URL.");
  }
  if (url.username || url.password) {
    throw new Error("Commit URL userinfo is not allowed.");
  }

  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length !== 4 || parts[2] !== "commit") {
    throw new Error("Use a canonical GitHub commit URL.");
  }

  const owner = parts[0].toLowerCase();
  const repo = parts[1].toLowerCase();
  const sha = parts[3].toLowerCase();
  if (!/^[a-f0-9]{40}$/.test(sha)) {
    throw new Error("GitHub commit SHA must be the full 40-character hash.");
  }

  return { owner, repo, sha };
}

export function buildGithubProvenanceMessage(
  input: GithubProvenanceClaimInput,
): string {
  if (!input.workflowId.trim() || !input.stepId.trim()) {
    throw new Error("Workflow and step are required.");
  }
  if (!/^0x[a-fA-F0-9]{40}$/.test(input.wallet)) {
    throw new Error("Wallet must be a valid 20-byte EVM address.");
  }
  if (!/^[A-Za-z0-9-]{1,39}$/.test(input.githubLogin)) {
    throw new Error("GitHub login is invalid.");
  }
  if (!/^[a-f0-9]{64}$/i.test(input.policyDigest)) {
    throw new Error("Policy digest must be a 64-character SHA-256 digest.");
  }
  if (!/^[A-Za-z0-9_-]{16,128}$/.test(input.claimId)) {
    throw new Error("Claim id must be a 16-128 character nonce.");
  }
  if (!Number.isInteger(input.expiresAt) || input.expiresAt <= 0) {
    throw new Error("Expiry must be a positive Unix timestamp.");
  }

  const commit = parseGithubCommitUrl(input.commitUrl);

  return [
    "ResolveGraph GitHub Provenance v1",
    "workflow:" + input.workflowId.trim(),
    "step:" + input.stepId.trim(),
    "wallet:" + input.wallet.toLowerCase(),
    "github:" + input.githubLogin.toLowerCase(),
    "repository:" + commit.owner + "/" + commit.repo,
    "commit:" + commit.sha,
    "policy:" + input.policyDigest.toLowerCase(),
    "expires:" + String(input.expiresAt),
    "claim-id:" + input.claimId,
  ].join("\n");
}

export function assertGithubProvenanceFresh(
  expiresAt: number,
  nowUnix = Math.floor(Date.now() / 1000),
  maxFutureSeconds = 7 * 24 * 60 * 60,
): void {
  if (!Number.isInteger(expiresAt)) {
    throw new Error("Expiry must be an integer.");
  }
  if (expiresAt <= nowUnix) {
    throw new Error("Provenance claim has expired.");
  }
  if (expiresAt > nowUnix + maxFutureSeconds) {
    throw new Error("Provenance claim expiry cannot exceed seven days.");
  }
}


export type GithubSourceRef =
  | { kind: "GITHUB_COMMIT"; owner: string; repo: string; sha: string }
  | { kind: "GITHUB_PR"; owner: string; repo: string; number: number }
  | { kind: "GITHUB_CI"; owner: string; repo: string; runId: number };

export function parseGithubSourceUrl(value: string): GithubSourceRef {
  const url = new URL(value);
  if (
    url.protocol !== "https:" ||
    url.hostname.toLowerCase() !== "github.com" ||
    url.username ||
    url.password
  ) {
    throw new Error("Source must be a canonical HTTPS github.com URL.");
  }

  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length === 4 && parts[2] === "commit") {
    const sha = parts[3].toLowerCase();
    if (!/^[a-f0-9]{40}$/.test(sha)) {
      throw new Error("GitHub commit URL must contain a full 40-character SHA.");
    }
    return { kind: "GITHUB_COMMIT", owner: parts[0], repo: parts[1], sha };
  }

  if (parts.length === 4 && parts[2] === "pull") {
    const number = Number(parts[3]);
    if (!Number.isSafeInteger(number) || number < 1) {
      throw new Error("GitHub pull request number is invalid.");
    }
    return { kind: "GITHUB_PR", owner: parts[0], repo: parts[1], number };
  }

  if (
    parts.length === 5 &&
    parts[2] === "actions" &&
    parts[3] === "runs"
  ) {
    const runId = Number(parts[4]);
    if (!Number.isSafeInteger(runId) || runId < 1) {
      throw new Error("GitHub Actions run ID is invalid.");
    }
    return { kind: "GITHUB_CI", owner: parts[0], repo: parts[1], runId };
  }

  throw new Error(
    "Supported GitHub sources are commit, pull request and Actions run URLs.",
  );
}

export function normalizeEthereumTxRef(
  chainId: number,
  txHash: string,
): { chainId: 1 | 11155111; txHash: `0x${string}` } {
  if (chainId !== 1 && chainId !== 11155111) {
    throw new Error("Supported chain IDs are 1 and 11155111.");
  }
  const clean = txHash.trim().toLowerCase();
  if (!/^0x[a-f0-9]{64}$/.test(clean)) {
    throw new Error("Ethereum transaction hash must be 32-byte 0x hex.");
  }
  return { chainId, txHash: clean as `0x${string}` };
}

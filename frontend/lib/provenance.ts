export type StepPolicyInput = {
  workflowId: string;
  stepId: string;
  assignee: string;
  requirement: string;
  rubric: string;
  dependencyA?: string;
  dependencyB?: string;
  deadline: string | number | bigint;
};

export type GithubProvenanceClaim = {
  workflowId: string;
  stepId: string;
  wallet: string;
  githubLogin: string;
  commitUrl: string;
  policyDigest: string;
  expiresAt: number;
  claimId: string;
};

export function parseGithubCommitUrl(value: string) {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.hostname.toLowerCase() !== "github.com") {
    throw new Error("Commit URL must be an HTTPS github.com URL.");
  }
  if (url.username || url.password) {
    throw new Error("Commit URL userinfo is not allowed.");
  }

  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length !== 4 || parts[2] !== "commit") {
    throw new Error("Use a canonical GitHub commit URL: /owner/repo/commit/<40-char-sha>.");
  }

  const owner = parts[0].toLowerCase();
  const repo = parts[1].toLowerCase();
  const sha = parts[3].toLowerCase();
  if (!/^[a-f0-9]{40}$/.test(sha)) {
    throw new Error("GitHub commit SHA must be the full 40-character hash.");
  }

  return { owner, repo, sha };
}

export function parseGithubGistUrl(value: string) {
  const url = new URL(value);
  if (
    url.protocol !== "https:" ||
    url.hostname.toLowerCase() !== "gist.github.com" ||
    url.username ||
    url.password
  ) {
    throw new Error("Gist URL must be a canonical HTTPS gist.github.com URL.");
  }
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length < 2 || !/^[a-f0-9]+$/i.test(parts[1])) {
    throw new Error("Gist URL must include an owner and gist id.");
  }
  return { owner: parts[0].toLowerCase(), gistId: parts[1].toLowerCase() };
}

export function buildStepPolicySeed(input: StepPolicyInput) {
  if (!/^0x[a-fA-F0-9]{40}$/.test(input.assignee)) {
    throw new Error("Step assignee is not a valid wallet.");
  }
  return [
    "ResolveGraph-Step-Policy-v1",
    "workflow:" + input.workflowId.trim(),
    "step:" + input.stepId.trim(),
    "assignee:" + input.assignee.toLowerCase(),
    "requirement:" + input.requirement.trim(),
    "rubric:" + input.rubric.trim(),
    "dependency-a:" + (input.dependencyA || "").trim(),
    "dependency-b:" + (input.dependencyB || "").trim(),
    "deadline:" + String(input.deadline),
  ].join("\n");
}

export function buildGithubProvenanceMessage(input: GithubProvenanceClaim) {
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
) {
  if (!Number.isInteger(expiresAt)) throw new Error("Expiry must be an integer.");
  if (expiresAt <= nowUnix) throw new Error("Provenance claim has expired.");
  if (expiresAt > nowUnix + maxFutureSeconds) {
    throw new Error("Provenance claim expiry cannot exceed seven days.");
  }
}

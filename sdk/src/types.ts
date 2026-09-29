export type HexAddress = `0x${string}`;

export type WorkflowStatus =
  | "DRAFT"
  | "ACTIVE"
  | "ATTRIBUTED"
  | "ATTRIBUTION_CHALLENGED"
  | "FAILED_SETTLED"
  | "COMPLETED"
  | "CANCELLED";

export type StepStatus =
  | "PENDING_ACCEPTANCE"
  | "ACCEPTED"
  | "SUBMITTED"
  | "CHALLENGED"
  | "RESOLVED_PASS"
  | "RESOLVED_FAIL"
  | "RESOLVED_UNDETERMINED"
  | "PAID";

export type StepVerdict = "PASS" | "FAIL" | "UNDETERMINED";

export interface AgentIdentityRef {
  agentRegistry?: string;
  agentId?: string | number;
  a2aEndpoint?: string;
  roleLabel?: string;
}

export interface WorkflowView {
  id: string;
  sponsor: HexAddress;
  title: string;
  objective: string;
  status: WorkflowStatus | string;
  step_count: bigint | number | string;
  failed_step_id?: string;
  fault_step_id?: string;
  fault_actor?: HexAddress;
  fault_class?: string;
  fault_reason?: string;
  fault_confidence?: bigint | number | string;
  attribution_round?: bigint | number | string;
  decision_hash?: string;
  policy_version?: string;
}

export interface StepView {
  workflow_id: string;
  id: string;
  index: bigint | number | string;
  assignee: HexAddress;
  role_label?: string;
  agent_ref?: string;
  a2a_endpoint?: string;
  requirement: string;
  rubric: string;
  dependency_a?: string;
  dependency_b?: string;
  reward: bigint | number | string;
  bond_required: bigint | number | string;
  bond_posted?: bigint | number | string;
  deadline: bigint | number | string;
  status: StepStatus | string;
  verdict?: StepVerdict | string;
  score?: bigint | number | string;
  confidence?: bigint | number | string;
  reason_code?: string;
  failure_class?: string;
  causal_dependency?: string;
  resolution_round?: bigint | number | string;
  decision_hash?: string;
  evidence_url?: string;
  support_url?: string;
  challenge_url?: string;
}

export interface ContractWriteRequest {
  functionName: string;
  args: unknown[];
  value?: bigint;
}

export interface PortableAdjudicationReceipt {
  schema: "resolvegraph-receipt-v1";
  workflowId: string;
  stepId?: string;
  participant?: HexAddress;
  agentRef?: string;
  outcome: string;
  score?: number;
  confidence?: number;
  reasonCode?: string;
  faultClass?: string;
  decisionHash?: string;
  policyVersion?: string;
  evidence: {
    primary?: string;
    support?: string;
    challenge?: string;
  };
}

export interface GithubProvenanceClaimInput {
  workflowId: string;
  stepId: string;
  wallet: HexAddress;
  githubLogin: string;
  commitUrl: string;
  policyDigest: string;
  expiresAt: number;
  claimId: string;
}

export interface GithubProvenanceReceipt {
  schema: "resolvegraph-github-provenance-v1";
  claimRelation: "DELIVERED_GITHUB_COMMIT";
  workflowId: string;
  stepId: string;
  participantWallet: HexAddress;
  githubLogin: string;
  repository: string;
  commitSha: string;
  commitUrl: string;
  gistUrl: string;
  gistId: string;
  policyDigest: string;
  claimId: string;
  expiresAt: number;
  verifiedAt: number;
  messageDigest: string;
  signature: `0x${string}`;
  provenanceDigest: string;
}

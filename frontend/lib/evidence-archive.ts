export type EvidenceArchiveInput = {
  subjectContract: string;
  workflowId: string;
  stepId: string;
  decisionRound: number;
  role: "PRIMARY" | "SUPPORT" | "CHALLENGE";
  sourceType:
    | "WEB"
    | "GITHUB_COMMIT"
    | "GITHUB_PR"
    | "GITHUB_CI"
    | "ETHEREUM_TX"
    | "ARTIFACT";
  sourceUrl: string;
  contentType: string;
  contentHash: string;
  immutableRefKind:
    | "SHA256"
    | "GIT_COMMIT_SHA"
    | "GITHUB_PR_HEAD_SHA"
    | "GITHUB_RUN_ID"
    | "ETH_TX_HASH"
    | "IPFS_CID"
    | "NONE";
  immutableRef: string;
  author: string;
  rubricRelation: string;
  fetchedAt: number;
};

export function canonicalEvidenceArchivePayload(input: EvidenceArchiveInput) {
  const fields = [
    "RG_EVIDENCE_ARCHIVE_V1",
    input.subjectContract.toLowerCase(),
    input.workflowId.trim(),
    input.stepId.trim(),
    String(input.decisionRound),
    input.role,
    input.sourceType,
    input.sourceUrl.trim(),
    input.contentType.trim().toLowerCase(),
    input.contentHash.trim().toLowerCase(),
    input.immutableRefKind,
    input.immutableRef.trim(),
    input.author.trim(),
    input.rubricRelation.trim(),
    String(input.fetchedAt),
  ];

  return fields
    .map((value) => String(value.length) + ":" + value)
    .join("");
}

export function evidenceArchiveWriteArgs(input: EvidenceArchiveInput) {
  return [
    input.subjectContract,
    input.workflowId,
    input.stepId,
    input.decisionRound,
    input.role,
    input.sourceType,
    input.sourceUrl,
    input.contentType,
    input.contentHash,
    input.immutableRefKind,
    input.immutableRef,
    input.author,
    input.rubricRelation,
    input.fetchedAt,
  ];
}

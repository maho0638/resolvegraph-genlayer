export const CANONICAL_EVIDENCE_SNAPSHOT_RUN_ID = 36598129489;

export const CANONICAL_EVIDENCE_SNAPSHOT = {
  workflowId: "rg-live-success-v1",
  stepId: "source-check",
  registryContract: "0xB5B0Dd5E454590fCb4FCEFD85B11d16774552390",
  records: [
    {
      decisionRound: 1,
      role: "PRIMARY",
      digest: "21218dd5bc60f3a89e0de8f4bcc29b5fd90b9ff543aceae74a343c6253e76f46",
      record: {
        author: "IANA Example Domains",
        content_hash: "7d3e61f8f627c8cc640c209ba0777db95f198a64e766f47484c321d5eb5e0962",
        content_type: "text/html",
        created_at: 1790699569,
        decision_round: 1,
        digest: "21218dd5bc60f3a89e0de8f4bcc29b5fd90b9ff543aceae74a343c6253e76f46",
        fetched_at: 1790699568,
        immutable_ref: "7d3e61f8f627c8cc640c209ba0777db95f198a64e766f47484c321d5eb5e0962",
        immutable_ref_kind: "SHA256",
        publisher: "0xbdebd8b0dcf406f430471478f2ad722325a3d60d",
        role: "PRIMARY",
        rubric_relation:
          "Supports the source-check requirement by providing the canonical Example Domain page referenced by the adjudicated delivery.",
        source_type: "WEB",
        source_url: "https://example.com",
        step_id: "source-check",
        subject_contract: "0x5e7e96dcfb5df57881cffbfc5b597f7b83c4a754",
        workflow_id: "rg-live-success-v1",
      },
    },
    {
      decisionRound: 1,
      role: "SUPPORT",
      digest: "a713c7456add7d374facc99ac941332a79840ffaf4dd57de957cda74ca4b6845",
      record: {
        author: "Internet Assigned Numbers Authority",
        content_hash: "9adb74216b75a090d7b8764453146efc9480942bedc0616c5406a009a5a9c43e",
        content_type: "text/html",
        created_at: 1790699582,
        decision_round: 1,
        digest: "a713c7456add7d374facc99ac941332a79840ffaf4dd57de957cda74ca4b6845",
        fetched_at: 1790699582,
        immutable_ref: "9adb74216b75a090d7b8764453146efc9480942bedc0616c5406a009a5a9c43e",
        immutable_ref_kind: "SHA256",
        publisher: "0xbdebd8b0dcf406f430471478f2ad722325a3d60d",
        role: "SUPPORT",
        rubric_relation:
          "Independently corroborates the reserved example-domain policy used by the step acceptance rubric.",
        source_type: "WEB",
        source_url: "https://www.iana.org/help/example-domains",
        step_id: "source-check",
        subject_contract: "0x5e7e96dcfb5df57881cffbfc5b597f7b83c4a754",
        workflow_id: "rg-live-success-v1",
      },
    },
    {
      decisionRound: 2,
      role: "CHALLENGE",
      digest: "0ee972d915140461f2cf392ebf133dd327811a58d0286faedc1eb6000e47ddcc",
      record: {
        author: "RFC Editor",
        content_hash: "ba6fbd71818bfe7ccc9a12854a3a6bae8848e8de650507ee26bd3560c742fbf1",
        content_type: "text/html",
        created_at: 1790699596,
        decision_round: 2,
        digest: "0ee972d915140461f2cf392ebf133dd327811a58d0286faedc1eb6000e47ddcc",
        fetched_at: 1790699595,
        immutable_ref: "ba6fbd71818bfe7ccc9a12854a3a6bae8848e8de650507ee26bd3560c742fbf1",
        immutable_ref_kind: "SHA256",
        publisher: "0xbdebd8b0dcf406f430471478f2ad722325a3d60d",
        role: "CHALLENGE",
        rubric_relation:
          "Fresh challenge evidence for the second decision round, binding the re-evaluation to RFC 2606.",
        source_type: "WEB",
        source_url: "https://www.rfc-editor.org/rfc/rfc2606",
        step_id: "source-check",
        subject_contract: "0x5e7e96dcfb5df57881cffbfc5b597f7b83c4a754",
        workflow_id: "rg-live-success-v1",
      },
    },
  ],
} as const;

export function canonicalEvidenceSnapshot(workflowId: string, stepId: string) {
  if (
    workflowId === CANONICAL_EVIDENCE_SNAPSHOT.workflowId &&
    stepId === CANONICAL_EVIDENCE_SNAPSHOT.stepId
  ) {
    return CANONICAL_EVIDENCE_SNAPSHOT.records.map((item) => ({
      decisionRound: item.decisionRound,
      role: item.role,
      digest: item.digest,
      record: { ...item.record },
    }));
  }
  return null;
}

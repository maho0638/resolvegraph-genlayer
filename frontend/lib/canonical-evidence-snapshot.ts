export const CANONICAL_EVIDENCE_SNAPSHOT_RUN_ID = 37132147367;

export const CANONICAL_EVIDENCE_SNAPSHOT = {
  workflowId: "rg-live-success-v1",
  stepId: "source-check",
  registryContract: "0x7436623f5bc064179546344b587fe9BF30B71004",
  records: [
    {
      decisionRound: 1,
      role: "PRIMARY",
      digest: "78693c99a014f0c1d13fc8e8436a92bb705cfdbfa41417e2a77ca57ad40d2c25",
      record: {
        author: "IANA Example Domains",
        content_hash: "25ddf2c883e0d1958ea971d279a7e4f0fd446724ee3db7db19dadabd4a62e484",
        content_type: "text/html",
        created_at: 1791040252,
        decision_round: 1,
        digest: "78693c99a014f0c1d13fc8e8436a92bb705cfdbfa41417e2a77ca57ad40d2c25",
        fetched_at: 1791040251,
        immutable_ref: "25ddf2c883e0d1958ea971d279a7e4f0fd446724ee3db7db19dadabd4a62e484",
        immutable_ref_kind: "SHA256",
        publisher: "0xbdebd8b0dcf406f430471478f2ad722325a3d60d",
        role: "PRIMARY",
        rubric_relation:
          "Supports the source-check requirement by providing the canonical Example Domain page referenced by the adjudicated delivery.",
        source_type: "WEB",
        source_url: "https://example.com",
        step_id: "source-check",
        subject_contract: "0x881665b7331cce0a2f66a01af14bb7ca14464ff0",
        workflow_id: "rg-live-success-v1",
      },
    },
    {
      decisionRound: 1,
      role: "SUPPORT",
      digest: "659a9c38c2c1818f26745ac909b4fbc552e20441b0b253f9e14f41dba7561962",
      record: {
        author: "Internet Assigned Numbers Authority",
        content_hash: "9adb74216b75a090d7b8764453146efc9480942bedc0616c5406a009a5a9c43e",
        content_type: "text/html",
        created_at: 1791040265,
        decision_round: 1,
        digest: "659a9c38c2c1818f26745ac909b4fbc552e20441b0b253f9e14f41dba7561962",
        fetched_at: 1791040265,
        immutable_ref: "9adb74216b75a090d7b8764453146efc9480942bedc0616c5406a009a5a9c43e",
        immutable_ref_kind: "SHA256",
        publisher: "0xbdebd8b0dcf406f430471478f2ad722325a3d60d",
        role: "SUPPORT",
        rubric_relation:
          "Independently corroborates the reserved example-domain policy used by the step acceptance rubric.",
        source_type: "WEB",
        source_url: "https://www.iana.org/help/example-domains",
        step_id: "source-check",
        subject_contract: "0x881665b7331cce0a2f66a01af14bb7ca14464ff0",
        workflow_id: "rg-live-success-v1",
      },
    },
    {
      decisionRound: 2,
      role: "CHALLENGE",
      digest: "41bf6451c34e88c039055f866a4872b0434efbbcd8ed051af6d917f4005cc690",
      record: {
        author: "RFC Editor",
        content_hash: "5e3f33177572be85d3efdf88fbb5f86b862638623193694b9dc020472a67e4f2",
        content_type: "text/html",
        created_at: 1791040279,
        decision_round: 2,
        digest: "41bf6451c34e88c039055f866a4872b0434efbbcd8ed051af6d917f4005cc690",
        fetched_at: 1791040279,
        immutable_ref: "5e3f33177572be85d3efdf88fbb5f86b862638623193694b9dc020472a67e4f2",
        immutable_ref_kind: "SHA256",
        publisher: "0xbdebd8b0dcf406f430471478f2ad722325a3d60d",
        role: "CHALLENGE",
        rubric_relation:
          "Fresh challenge evidence for the second decision round, binding the re-evaluation to RFC 2606.",
        source_type: "WEB",
        source_url: "https://www.rfc-editor.org/rfc/rfc2606",
        step_id: "source-check",
        subject_contract: "0x881665b7331cce0a2f66a01af14bb7ca14464ff0",
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

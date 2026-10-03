export const GENLAYER_STUDIO_EXPLORER = "https://explorer-studio.genlayer.com";

export type CanonicalTx = {
  order: number;
  phase: string;
  method: string;
  hash: string;
  stepId?: string;
  effect: string;
};

export type CanonicalCaseProof = {
  workflowId: string;
  label: string;
  terminalStatus: string;
  summary: string;
  transactions: CanonicalTx[];
};

export const CANONICAL_CASES: Record<string, CanonicalCaseProof> = {
  "rg-live-success-v1": {
    workflowId: "rg-live-success-v1",
    label: "Canonical success lifecycle",
    terminalStatus: "COMPLETED",
    summary:
      "Two dependent participants accept bonded steps, submit independent evidence, survive fresh challenges, settle rewards and complete the workflow on the promoted consensus-guard V1 contract.",
    transactions: [
      { order: 1, phase: "Graph", method: "create_workflow", hash: "0x795c8aaecc9bdbe6463280ffa932576dac02406bfe416775fcdcfe22060392d6", effect: "Create funded workflow shell" },
      { order: 2, phase: "Graph", method: "add_step", stepId: "source-check", hash: "0x6dc27b0baca3a7349fc508a282ae1a25eebbbf041800f6c26039fd73edd08dac", effect: "Escrow source-check reward and freeze commitment" },
      { order: 3, phase: "Graph", method: "add_step", stepId: "standards-check", hash: "0xf4f90525bcb0ef76cae41c8b938a1630b540a80f0de6348c3f5befac80f338a1", effect: "Escrow dependent standards-check reward" },
      { order: 4, phase: "Graph", method: "seal_workflow", hash: "0x03da3aed18e30ad30821d5032dff9ca29e13e82900dda3e172097dcbda7b9348", effect: "Freeze graph and activate workflow" },
      { order: 5, phase: "Bond", method: "accept_step", stepId: "source-check", hash: "0xd4157390724b30f6fe5a52e67d66e6662200dc0523b713928016b9f60d3d9cc1", effect: "Participant posts exact source-check bond" },
      { order: 6, phase: "Bond", method: "accept_step", stepId: "standards-check", hash: "0xebc24d7b349edde10a20c5c55d7ff3931f53d800634826ef34b2c22c8685ecb5", effect: "Second participant posts exact standards-check bond" },
      { order: 7, phase: "Evidence", method: "submit_evidence", stepId: "source-check", hash: "0x8ec8ecfcf9b607390aeab1920d17df1e5b3e3c17355b117f79a446b43ac819a6", effect: "Primary + independent support evidence committed" },
      { order: 8, phase: "Consensus", method: "resolve_step", stepId: "source-check", hash: "0x401f11a83cbaa0fb0242eb5009500cecfab19dc2d497217c4774cee5ed2f225d", effect: "Initial GenLayer semantic decision" },
      { order: 9, phase: "Challenge", method: "challenge_step", stepId: "source-check", hash: "0x15de903b3cec6965b2020c74002c49e9ff439aa28dcf64c2be7dbaa0abfc4007", effect: "Fresh third-source challenge evidence" },
      { order: 10, phase: "Consensus", method: "resolve_step_challenge", stepId: "source-check", hash: "0xac59af42e4163f1e9c585cce58b713482213e8bea2e46188363dbf5263ae9146", effect: "Second-round source-check decision" },
      { order: 11, phase: "Settlement", method: "settle_passed_step", stepId: "source-check", hash: "0x3f0bc307b3428eb710077e978d18beec27dba9d2ef3ccf1573a8aae2173cc6ba", effect: "Pay source-check reward and unlock dependency" },
      { order: 12, phase: "Evidence", method: "submit_evidence", stepId: "standards-check", hash: "0xccbe2af880a2b03b2f4bc774234a983387037ebde7eec87346f4ef8fbd71566a", effect: "Dependent-step evidence committed" },
      { order: 13, phase: "Consensus", method: "resolve_step", stepId: "standards-check", hash: "0x241cd437e723a5710b219f8a409daea5a9b129f6450e995b2fc4b8292986e383", effect: "Initial standards-check decision" },
      { order: 14, phase: "Challenge", method: "challenge_step", stepId: "standards-check", hash: "0x12507979bae8150deafefc1fe17e11f21d20cb03b875ebd049a6357a4270b754", effect: "Fresh challenge opens second decision round" },
      { order: 15, phase: "Consensus", method: "resolve_step_challenge", stepId: "standards-check", hash: "0xdb28e3da0dcf9f95db21455f102db2a0c08bd7b5873d940b1bcca570ad55eb93", effect: "Final standards-check decision" },
      { order: 16, phase: "Settlement", method: "settle_passed_step", stepId: "standards-check", hash: "0x445e01e475f2e6de341c9273c2a94eef987f598486ee0a8927a242c2d5596502", effect: "Pay second reward and settle step economics" },
      { order: 17, phase: "Terminal", method: "complete_workflow", hash: "0xd5b5c4da87370d44e224835173ae8b15058470c6fa21679df592f2ba23181682", effect: "Workflow reaches COMPLETED" }
    ]
  },
  "rg-live-failure-v1": {
    workflowId: "rg-live-failure-v1",
    label: "Canonical challenged failure lifecycle",
    terminalStatus: "FAILED_SETTLED",
    summary:
      "A deliberately false commitment fails; the step decision and workflow attribution each receive a second consensus round, then the final PARTICIPANT fault is settled deterministically.",
    transactions: [
      { order: 1, phase: "Graph", method: "create_workflow", hash: "0xa20bc5724058e51023d447f0715be7e296ea5c98621cfc957024a6894677af8f", effect: "Create failure-proof workflow" },
      { order: 2, phase: "Graph", method: "add_step", stepId: "api-proof", hash: "0x6efc9fd47c1d6f5eb08b95c590914b52eefce75d6811bc639a7b646ca38acc8a", effect: "Escrow reward and freeze false commitment" },
      { order: 3, phase: "Evidence", method: "submit_evidence", stepId: "api-proof", hash: "0x52e2a1fa72726881b48383fef689e5a61da01f1c002531cea2c304e4352e1a27", effect: "Submit independent public evidence" },
      { order: 4, phase: "Consensus", method: "resolve_step", stepId: "api-proof", hash: "0xba0e7be9073c5978eae600bde7f01a317bdaa1f19935fe5e19f0e00386fa953b", effect: "Initial step decision fails commitment" },
      { order: 5, phase: "Challenge consensus", method: "resolve_step_challenge", stepId: "api-proof", hash: "0x2e18f088dc023d718924ece2eb9165e0738e1a7ffaaf61719ba67628568f3c51", effect: "Second-round step decision finalized after validator rotations" },
      { order: 6, phase: "Attribution", method: "attribute_failure", stepId: "api-proof", hash: "0x504b5c920c2aa5d6b973ccc8af99941fa3d93e667a0aa85bc517df759767f49b", effect: "Run workflow root-cause attribution" },
      { order: 7, phase: "Attribution challenge", method: "challenge_attribution", hash: "0xb412ba89f8a577f8f1bd7b61e94cda56373ae7bb2b20e774aeb9993695296ef0", effect: "Fresh workflow-level counterevidence" },
      { order: 8, phase: "Attribution consensus", method: "resolve_attribution_challenge", hash: "0xd66aaf3842a1dfe7fa1d77d820fd2639e05af028141e2c762d6effc5b89124bd", effect: "Second attribution round finalizes PARTICIPANT fault" },
      { order: 9, phase: "Settlement", method: "settle_failed_workflow", hash: "0x55861fb20832219b4c075c26bc774204a7948638fa13d385bf5ccdc299b206fe", effect: "Apply final fault-dependent bond and escrow settlement" }
    ]
  }
};

export function explorerTxUrl(hash: string) {
  return GENLAYER_STUDIO_EXPLORER + "/tx/" + hash;
}

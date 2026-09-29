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
      "Two dependent participants accept bonded steps, submit evidence, survive fresh challenges, settle rewards and complete the workflow.",
    transactions: [
      { order: 1, phase: "Graph", method: "create_workflow", hash: "0x024d7e8df56be71e98743c432f102371c40fa627b7875ff13d4375e9518af14f", effect: "Create funded workflow shell" },
      { order: 2, phase: "Graph", method: "add_step", stepId: "source-check", hash: "0x4e4b65aeb96aeb13c86a15a345a04e6ffe877c542b1df0938f758ce31ef46e5a", effect: "Escrow step-1 reward and freeze commitment" },
      { order: 3, phase: "Graph", method: "add_step", stepId: "dependent-check", hash: "0xcb6440bec18d59aa7974cb7a89fa23898ef451e474d0bbd02bccdf59ed5c4116", effect: "Escrow dependent step reward" },
      { order: 4, phase: "Graph", method: "seal_workflow", hash: "0x1a2b8fb09e9ee9920b9e93e2891525e1febc08825b0ade3ae807e54502e52bb3", effect: "Freeze graph and activate workflow" },
      { order: 5, phase: "Bond", method: "accept_step", stepId: "source-check", hash: "0xb4071e602ae7fc9cea9ff2c7a44451a42ab6adb28a6cfe9b6f1cda960f1da761", effect: "Participant posts exact step bond" },
      { order: 6, phase: "Bond", method: "accept_step", stepId: "dependent-check", hash: "0x5d563f6b3b977742938b22463ea6cbe7315c0f3e558b3c137ea904454189f25e", effect: "Second participant posts exact step bond" },
      { order: 7, phase: "Evidence", method: "submit_evidence", stepId: "source-check", hash: "0x893ceeef63aaf7e12321f3602ed6ccd02bd9664e08b50a7beee1d0283425bbfd", effect: "Primary + independent support evidence committed" },
      { order: 8, phase: "Consensus", method: "resolve_step", stepId: "source-check", hash: "0xdd5708b0bdb199fcb1f5ca4daaa5719da3fabc81ffaf9fa8eee2c28d7bcc8d96", effect: "Initial GenLayer semantic decision" },
      { order: 9, phase: "Challenge", method: "challenge_step", stepId: "source-check", hash: "0xac9418d0c2745fb1b7eeeea1552cac9c61a9f6c395942f3fa33ad4cd40204e22", effect: "Fresh third-source challenge evidence" },
      { order: 10, phase: "Consensus", method: "resolve_step_challenge", stepId: "source-check", hash: "0x2104747c3590223b0794c70aa01abcadd9538d5952e7cfeadc6caa2dfec80227", effect: "Second-round decision supersedes initial decision" },
      { order: 11, phase: "Settlement", method: "settle_passed_step", stepId: "source-check", hash: "0xf011b02d1cf3f076b03a63e2369604064130e4ea39a796d4d3d27568e5d4295f", effect: "Pay step reward; bond remains causally accountable" },
      { order: 12, phase: "Evidence", method: "submit_evidence", stepId: "dependent-check", hash: "0x5d6ef489983e5ca6de750427ce07bbbd54a80e07bae7bde461e56e61c0d34d68", effect: "Dependent-step evidence committed after prerequisite payment" },
      { order: 13, phase: "Consensus", method: "resolve_step", stepId: "dependent-check", hash: "0xa8bf780a01943c3b7f9659508504a10de87464acafdfa9352c2c1447d8003f8c", effect: "Initial dependent-step decision" },
      { order: 14, phase: "Challenge", method: "challenge_step", stepId: "dependent-check", hash: "0x31a0bd3d840245075635b456bb406d853bb13c73289b93c2b3f9c316c3e317da", effect: "Fresh challenge opens second decision round" },
      { order: 15, phase: "Consensus", method: "resolve_step_challenge", stepId: "dependent-check", hash: "0xebeb4809eaed0732105ac93bada82128b437800244b4bbffa84f9b18a0d5df44", effect: "Final dependent-step decision" },
      { order: 16, phase: "Settlement", method: "settle_passed_step", stepId: "dependent-check", hash: "0xdc751736766d2a1525eb13c08a7f58f70c17f41626773267932a5b323f071bc7", effect: "Pay second reward and settle step economics" },
      { order: 17, phase: "Terminal", method: "complete_workflow", hash: "0xf9e3dd65b91e38117a7e8644239f743fe0e5993fd889ae1023362fbeddeb0cf5", effect: "Workflow reaches COMPLETED" }
    ]
  },
  "rg-live-failure-v1": {
    workflowId: "rg-live-failure-v1",
    label: "Canonical challenged failure lifecycle",
    terminalStatus: "FAILED_SETTLED",
    summary:
      "A deliberately false commitment fails; initial participant fault attribution at 97% is challenged with fresh evidence and changes to EXTERNAL before deterministic failed-workflow settlement.",
    transactions: [
      { order: 1, phase: "Graph", method: "create_workflow", hash: "0xa53601662b0c464fdfb0124fb73878097b3339baa521de3114dc6e8696889f99", effect: "Create failure-proof workflow" },
      { order: 2, phase: "Graph", method: "add_step", stepId: "api-proof", hash: "0xc50be8fdd082ba761fbd3076fd3b882e7d2f506a0eeccb9d1b461916b27ebbe7", effect: "Escrow reward and freeze false commitment" },
      { order: 3, phase: "Evidence", method: "submit_evidence", stepId: "api-proof", hash: "0x69676427d0b03f5a1e19cb9a3c0ecea5a2fdc37038e91c68205b61c732f0cddb", effect: "Submit public evidence" },
      { order: 4, phase: "Consensus", method: "resolve_step", stepId: "api-proof", hash: "0x49be48376f28e4d13b181f930730e8bf09868add51b529b6ba891f3bfa93498e", effect: "Initial step decision fails commitment" },
      { order: 5, phase: "Challenge", method: "resolve_step_challenge", stepId: "api-proof", hash: "0xbea4e2a16436bb3a46f9c104220613955cdac42063ba8546993482e125e484bb", effect: "Fresh challenge re-evaluates failed step" },
      { order: 6, phase: "Attribution", method: "attribute_failure", stepId: "api-proof", hash: "0x2d5a71b2ec56c0910a39967bd65d4ab579ec319786c3df15b4969370ea7c111d", effect: "Initial root-cause result: PARTICIPANT / api-proof / 97%" },
      { order: 7, phase: "Attribution challenge", method: "challenge_attribution", hash: "0x974ef192212b615cd45e8031db265e38f0627242f730d1055e657adde527ca38", effect: "Fresh workflow-level counterevidence" },
      { order: 8, phase: "Attribution consensus", method: "resolve_attribution_challenge", hash: "0xcd2606df400716036c8dbfa88d8c869fa42cd8d66da4a1e13906411a3f9f6cb2", effect: "Final root-cause result changes to EXTERNAL" },
      { order: 9, phase: "Settlement", method: "settle_failed_workflow", hash: "0x5c304469825e36a9e6097cdda4711533052240e33129eaadfc39f5c9c6b2e63c", effect: "Apply deterministic fault-dependent bond/escrow settlement" }
    ]
  }
};

export function explorerTxUrl(hash: string) {
  return GENLAYER_STUDIO_EXPLORER + "/tx/" + hash;
}

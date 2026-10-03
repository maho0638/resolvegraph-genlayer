import { NextResponse } from "next/server";
import {
  serverReadV3Appeal,
  serverV3AppealContractAddress,
} from "@/lib/server-genlayer";

export const dynamic = "force-dynamic";

const WORKFLOW_ID = "rg-v3-live-appeal-v1";
const STEP_ID = "example-domain-proof";

function safe(value: unknown): unknown {
  if (typeof value === "bigint") return value.toString();
  if (Array.isArray(value)) return value.map(safe);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, safe(item)]),
    );
  }
  return value;
}

export async function GET() {
  try {
    const [workflow, step, appealBond, deadline, settlementReady] = await Promise.all([
      serverReadV3Appeal("get_workflow", [WORKFLOW_ID]),
      serverReadV3Appeal("get_step", [WORKFLOW_ID, STEP_ID]),
      serverReadV3Appeal("get_step_appeal_bond", [WORKFLOW_ID, STEP_ID]),
      serverReadV3Appeal("get_step_challenge_deadline", [WORKFLOW_ID, STEP_ID]),
      serverReadV3Appeal("is_step_settlement_ready", [WORKFLOW_ID, STEP_ID]),
    ]);
    return NextResponse.json({
      schema: "resolvegraph-bounded-appeal-proof-v1",
      network: "studionet",
      contract: serverV3AppealContractAddress(),
      policyVersion: "RG_V3_BOUNDED_APPEALS",
      proofRun: 37135064005,
      sourceSha256: "b15e44514cf05c7c50713e21ad90bb76d194329e3232c32cce01ed72022b9342",
      sourceMatch: true,
      rules: {
        maxStepAppeals: 1,
        appealBondDivisor: 20,
        challengeWindowSeconds: 3600,
        freshEvidenceRequired: true,
        explicitFinalizationRequired: true,
      },
      live: {
        workflowId: WORKFLOW_ID,
        stepId: STEP_ID,
        workflow: safe(workflow),
        step: safe(step),
        appealBond: safe(appealBond),
        challengeDeadline: safe(deadline),
        settlementReady: safe(settlementReady),
      },
      verifiedProof: {
        initialVerdict: "PASS",
        initialDecisionHash: "bf5d47297b33995a1a50bb3c79b8e6c0302fa9aaf8da6bc7111b3761d217a94f",
        appealBond: "50000000000",
        finalVerdict: "PASS",
        appealOutcomeChanged: false,
        finalDecisionHash: "8e8329b9ed4dae5699137bc0e4f8b138aa3fd0d944d00833d5d4994308409ae5",
        stepFinalStatus: "PAID",
        workflowFinalStatus: "COMPLETED",
        stateSafeConsensusRetry: true,
      },
      trustBoundary: {
        productionV1SettlementUnchanged: true,
        v3IsolatedProofSurface: true,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "ResolveGraph V3 appeal proof unavailable", detail: error?.message || "unknown error" },
      { status: 503 },
    );
  }
}

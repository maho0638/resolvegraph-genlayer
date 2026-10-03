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
      proofRun: 37117935576,
      sourceSha256: "3f3f357e48cafbd8899f7296057d3cd57bfde3472c83c5f98adacd59b6efdfba",
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
        initialDecisionHash: "4090f1b70433cb8aea92ce3040956b7d308368a7319c0f849a959e29a0524706",
        appealBond: "50000000000",
        finalVerdict: "PASS",
        appealOutcomeChanged: false,
        finalDecisionHash: "3b6dae21e809a8de9bf999642c0bbba63279f00cfc2203218727f567a331b9c0",
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

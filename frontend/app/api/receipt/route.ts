import { NextRequest, NextResponse } from "next/server";
import { serverRead } from "@/lib/server-genlayer";

export const dynamic = "force-dynamic";

function n(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function field(value: any, name: string) {
  return value?.[name];
}

export async function GET(request: NextRequest) {
  const workflowId = request.nextUrl.searchParams.get("workflow")?.trim();
  const stepId = request.nextUrl.searchParams.get("step")?.trim();

  if (!workflowId) {
    return NextResponse.json(
      { error: "workflow query parameter is required" },
      { status: 400 },
    );
  }

  try {
    const workflow: any = await serverRead("get_workflow", [workflowId]);

    if (stepId) {
      const step: any = await serverRead("get_step", [workflowId, stepId]);
      return NextResponse.json({
        schema: "resolvegraph-receipt-v1",
        workflowId,
        stepId,
        participant: String(field(step, "assignee") || ""),
        agentRef: String(field(step, "agent_ref") || ""),
        outcome: String(field(step, "verdict") || field(step, "status") || ""),
        score: n(field(step, "score")),
        confidence: n(field(step, "confidence")),
        reasonCode: String(field(step, "reason_code") || ""),
        faultClass: String(field(step, "failure_class") || ""),
        decisionHash: String(field(step, "decision_hash") || ""),
        policyVersion: String(field(workflow, "policy_version") || ""),
        evidence: {
          primary: String(field(step, "evidence_url") || ""),
          support: String(field(step, "support_url") || ""),
          challenge: String(field(step, "challenge_url") || ""),
        },
      });
    }

    return NextResponse.json({
      schema: "resolvegraph-receipt-v1",
      workflowId,
      participant: String(field(workflow, "fault_actor") || ""),
      outcome: String(field(workflow, "status") || ""),
      confidence: n(field(workflow, "fault_confidence")),
      reasonCode: String(field(workflow, "fault_reason") || ""),
      faultClass: String(field(workflow, "fault_class") || ""),
      decisionHash: String(field(workflow, "decision_hash") || ""),
      policyVersion: String(field(workflow, "policy_version") || ""),
      evidence: {
        challenge: String(field(workflow, "attribution_challenge_url") || ""),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "ResolveGraph receipt unavailable",
        detail: error?.message || "unknown error",
      },
      { status: 503 },
    );
  }
}

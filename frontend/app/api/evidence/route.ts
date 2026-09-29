import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { serverRead } from "@/lib/server-genlayer";

export const dynamic = "force-dynamic";

function n(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function s(value: unknown) {
  return String(value ?? "");
}

function source(role: string, url: string, snapshot: string) {
  if (!url) return null;
  let host = "";
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    host = "";
  }
  return {
    role,
    url,
    host,
    transport: "https",
    snapshot: snapshot || "",
  };
}

export async function GET(request: NextRequest) {
  const workflowId = request.nextUrl.searchParams.get("workflow")?.trim();
  const stepId = request.nextUrl.searchParams.get("step")?.trim();

  if (!workflowId || !stepId) {
    return NextResponse.json(
      { error: "workflow and step query parameters are required" },
      { status: 400 },
    );
  }

  try {
    const workflow: any = await serverRead("get_workflow", [workflowId]);
    const step: any = await serverRead("get_step", [workflowId, stepId]);

    const sources = [
      source("primary", s(step.evidence_url), s(step.evidence_snapshot)),
      source("support", s(step.support_url), s(step.support_snapshot)),
      source("challenge", s(step.challenge_url), ""),
    ].filter(Boolean);

    const body = {
      schema: "resolvegraph-evidence-manifest-v1",
      workflowId,
      stepId,
      policyVersion: s(workflow.policy_version),
      participant: {
        address: s(step.assignee),
        roleLabel: s(step.role_label),
        agentRef: s(step.agent_ref),
        a2aEndpoint: s(step.a2a_endpoint),
      },
      commitment: {
        requirement: s(step.requirement),
        rubric: s(step.rubric),
        dependencyA: s(step.dependency_a),
        dependencyB: s(step.dependency_b),
        deadline: n(step.deadline),
      },
      sources,
      decision: {
        status: s(step.status),
        verdict: s(step.verdict),
        score: n(step.score),
        confidence: n(step.confidence),
        reasonCode: s(step.reason_code),
        failureClass: s(step.failure_class),
        causalDependency: s(step.causal_dependency),
        resolutionRound: n(step.resolution_round),
        challengeCount: n(step.challenge_count),
        decisionHash: s(step.decision_hash),
        submittedAt: n(step.submitted_at),
        resolvedAt: n(step.resolved_at),
        settledAt: n(step.settled_at),
      },
      provenance: {
        source: "GenLayer Studionet contract state",
        contract:
          process.env.NEXT_PUBLIC_RESOLVEGRAPH_CONTRACT_ADDRESS?.trim() || null,
        digestScope:
          "contract-stored evidence URLs, bounded snapshots, commitment and decision fields",
        remoteByteContentHashClaimed: false,
      },
    };

    const manifestDigest = createHash("sha256")
      .update(JSON.stringify(body))
      .digest("hex");

    return NextResponse.json({
      ...body,
      manifestDigest,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "ResolveGraph evidence manifest unavailable",
        detail: error?.message || "unknown error",
      },
      { status: 503 },
    );
  }
}

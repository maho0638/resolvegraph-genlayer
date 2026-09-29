import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { captureEvidenceSource } from "@/lib/server-evidence";
import { serverContractAddress, serverRead } from "@/lib/server-genlayer";

export const dynamic = "force-dynamic";

const roles = new Set(["PRIMARY", "SUPPORT", "CHALLENGE"]);

function text(value: unknown) {
  return String(value ?? "");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const workflowId = text(body?.workflowId).trim();
    const stepId = text(body?.stepId).trim();
    const role = text(body?.role).trim().toUpperCase();
    const rubricRelation = text(body?.rubricRelation).trim();
    const authorHint = text(body?.authorHint).trim();

    if (!workflowId || !stepId) {
      return NextResponse.json(
        { error: "workflowId and stepId are required" },
        { status: 400 },
      );
    }
    if (!roles.has(role)) {
      return NextResponse.json(
        { error: "role must be PRIMARY, SUPPORT or CHALLENGE" },
        { status: 400 },
      );
    }
    if (rubricRelation.length < 12 || rubricRelation.length > 700) {
      return NextResponse.json(
        { error: "rubricRelation must be 12-700 characters" },
        { status: 400 },
      );
    }
    if (authorHint.length > 160) {
      return NextResponse.json(
        { error: "authorHint is too long" },
        { status: 400 },
      );
    }

    const step: any = await serverRead("get_step", [workflowId, stepId]);
    const resolutionRound = Number(step?.resolution_round ?? 0);

    let sourceUrl = "";
    let decisionRound = 1;
    if (role === "PRIMARY") {
      sourceUrl = text(step?.evidence_url).trim();
    } else if (role === "SUPPORT") {
      sourceUrl = text(step?.support_url).trim();
    } else {
      sourceUrl = text(step?.challenge_url).trim();
      decisionRound = Math.max(2, resolutionRound || 2);
    }

    if (!sourceUrl) {
      return NextResponse.json(
        { error: "The requested evidence role has no on-chain source URL" },
        { status: 409 },
      );
    }

    const captured = await captureEvidenceSource({
      base: {
        subjectContract: serverContractAddress(),
        workflowId,
        stepId,
        decisionRound,
        role: role as "PRIMARY" | "SUPPORT" | "CHALLENGE",
        rubricRelation,
        authorHint,
      },
      sourceUrl,
    });

    const snapshot =
      role === "PRIMARY"
        ? text(step?.evidence_snapshot)
        : role === "SUPPORT"
          ? text(step?.support_snapshot)
          : "";

    return NextResponse.json({
      schema: "resolvegraph-evidence-capture-v2",
      ...captured,
      onChainContext: {
        workflowId,
        stepId,
        decisionRound,
        role,
        status: text(step?.status),
        verdict: text(step?.verdict),
        score: Number(step?.score ?? 0),
        confidence: Number(step?.confidence ?? 0),
        decisionHash: text(step?.decision_hash),
        snapshot,
        snapshotHash: snapshot
          ? createHash("sha256").update(snapshot).digest("hex")
          : null,
      },
      trustBoundary: {
        fetchedBytesCapturedNow: true,
        registryArchiveRequiredForPersistentOnChainAnchor: true,
        sourceAuthorCanBeInferredOrHinted:
          captured.capture.authorBasis !== "hostname-fallback",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Evidence capture failed",
        detail: error?.message || "unknown error",
      },
      { status: 400 },
    );
  }
}

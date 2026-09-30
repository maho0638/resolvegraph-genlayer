import { NextRequest, NextResponse } from "next/server";
import {
  canonicalEvidenceSnapshot,
  CANONICAL_EVIDENCE_SNAPSHOT_RUN_ID,
} from "@/lib/canonical-evidence-snapshot";
import {
  serverContractAddress,
  serverEvidenceRegistryAddress,
  serverRead,
  serverReadEvidenceRegistry,
} from "@/lib/server-genlayer";

export const dynamic = "force-dynamic";

function jsonSafe(value: unknown): unknown {
  if (typeof value === "bigint") return value.toString();
  if (Array.isArray(value)) return value.map(jsonSafe);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        jsonSafe(item),
      ]),
    );
  }
  return value;
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
    const snapshot = canonicalEvidenceSnapshot(workflowId, stepId);
    const subject = serverContractAddress();

    let finalRound = 1;
    let finalDecisionRoundSource = "LIVE_WORKFLOW_CONTRACT";

    try {
      const step: any = await serverRead("get_step", [workflowId, stepId]);
      finalRound = Math.max(1, Number(step?.resolution_round ?? 1));
    } catch (error) {
      if (!snapshot) throw error;
      finalRound = Math.max(
        1,
        ...snapshot.map((item) => Number(item.decisionRound) || 1),
      );
      finalDecisionRoundSource = "VERIFIED_CANONICAL_SNAPSHOT";
    }

    const roles = ["PRIMARY", "SUPPORT", "CHALLENGE"] as const;

    let records: Array<{
      decisionRound: number;
      role: (typeof roles)[number];
      digest: string;
      record: unknown;
    }> = [];
    let archiveReadMode = "LIVE_REGISTRY";

    try {
      const slots: Array<{
        decisionRound: number;
        role: (typeof roles)[number];
        digest: string;
      }> = [];

      for (let round = 1; round <= finalRound; round += 1) {
        for (const role of roles) {
          const digest = String(
            await serverReadEvidenceRegistry("get_record_hash_for_slot", [
              subject,
              workflowId,
              stepId,
              round,
              role,
            ]),
          );
          if (digest) slots.push({ decisionRound: round, role, digest });
        }
      }

      records = await Promise.all(
        slots.map(async (slot) => ({
          ...slot,
          record: await serverReadEvidenceRegistry("get_record", [slot.digest]),
        })),
      );
    } catch (error) {
      if (!snapshot) throw error;
      records = snapshot;
      archiveReadMode = "VERIFIED_CANONICAL_SNAPSHOT";
    }

    return NextResponse.json({
      schema: "resolvegraph-evidence-archive-v1",
      network: "studionet",
      subjectContract: subject,
      registryContract: serverEvidenceRegistryAddress(),
      workflowId,
      stepId,
      finalDecisionRound: finalRound,
      finalDecisionRoundSource,
      archivedCount: records.length,
      records: jsonSafe(records),
      archiveReadMode,
      canonicalSnapshotVerificationRun:
        archiveReadMode === "VERIFIED_CANONICAL_SNAPSHOT" ||
        finalDecisionRoundSource === "VERIFIED_CANONICAL_SNAPSHOT"
          ? CANONICAL_EVIDENCE_SNAPSHOT_RUN_ID
          : null,
      trustBoundary: {
        archiveIsAppendOnlyContentAddressed: true,
        registryPublisherIsRecorded: true,
        registryDoesNotFetchRemoteBytesItself: true,
        productionCaptureEndpointPerformsBoundedPublicHttpsFetch: true,
        canonicalFallbackIsPinnedFromVerifiedStudionetRun: true,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "ResolveGraph evidence archive unavailable",
        detail: error?.message || "unknown error",
      },
      { status: 503 },
    );
  }
}

import { createHash } from "node:crypto";
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

function n(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function s(value: unknown) {
  return String(value ?? "");
}

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

function sha256(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function contractSource(role: string, url: string, snapshot: string) {
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
    boundedSnapshot: snapshot || "",
    boundedSnapshotHash: snapshot
      ? createHash("sha256").update(snapshot).digest("hex")
      : null,
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
    const finalRound = Math.max(1, n(step?.resolution_round) || 1);
    const subjectContract = serverContractAddress();

    const roles = ["PRIMARY", "SUPPORT", "CHALLENGE"] as const;
    const archived: Array<{
      decisionRound: number;
      role: (typeof roles)[number];
      digest: string;
      record: unknown;
    }> = [];
    let archiveReadMode = "LIVE_REGISTRY";

    try {
      for (let round = 1; round <= finalRound; round += 1) {
        for (const role of roles) {
          const digest = s(
            await serverReadEvidenceRegistry("get_record_hash_for_slot", [
              subjectContract,
              workflowId,
              stepId,
              round,
              role,
            ]),
          );
          if (!digest) continue;
          archived.push({
            decisionRound: round,
            role,
            digest,
            record: await serverReadEvidenceRegistry("get_record", [digest]),
          });
        }
      }
    } catch (error) {
      const snapshot = canonicalEvidenceSnapshot(workflowId, stepId);
      if (!snapshot) throw error;
      archived.length = 0;
      archived.push(...snapshot);
      archiveReadMode = "VERIFIED_CANONICAL_SNAPSHOT";
    }

    const contractSources = [
      contractSource("PRIMARY", s(step.evidence_url), s(step.evidence_snapshot)),
      contractSource("SUPPORT", s(step.support_url), s(step.support_snapshot)),
      contractSource("CHALLENGE", s(step.challenge_url), ""),
    ].filter(Boolean);

    const archiveRecords = jsonSafe(archived) as any[];
    const roundOneDigests = archiveRecords
      .filter((item) => Number(item.decisionRound) === 1)
      .map((item) => String(item.digest))
      .sort();
    const allDigests = archiveRecords
      .map((item) => String(item.digest))
      .sort();

    const body = {
      schema: "resolvegraph-evidence-manifest-v2",
      workflowId,
      stepId,
      policyVersion: s(workflow.policy_version),
      subjectContract,
      archiveRegistry: serverEvidenceRegistryAddress(),
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
      contractSources,
      archiveRecords,
      evidenceVersioning: {
        initialArchiveDigest: roundOneDigests.length
          ? sha256(roundOneDigests)
          : null,
        finalArchiveDigest: allDigests.length ? sha256(allDigests) : null,
        archivedRecordCount: archiveRecords.length,
        finalDecisionRound: finalRound,
      },
      decision: {
        status: s(step.status),
        initial: {
          verdict: s(step.initial_verdict),
          score: n(step.initial_score),
          confidence: n(step.initial_confidence),
          reasonCode: s(step.initial_reason_code),
          failureClass: s(step.initial_failure_class),
          causalDependency: s(step.initial_causal_dependency),
        },
        final: {
          verdict: s(step.verdict),
          score: n(step.score),
          confidence: n(step.confidence),
          reasonCode: s(step.reason_code),
          failureClass: s(step.failure_class),
          causalDependency: s(step.causal_dependency),
          resolutionRound: n(step.resolution_round),
          challengeCount: n(step.challenge_count),
          decisionHash: s(step.decision_hash),
        },
        submittedAt: n(step.submitted_at),
        resolvedAt: n(step.resolved_at),
        challengedAt: n(step.challenged_at),
        settledAt: n(step.settled_at),
      },
      provenance: {
        contractStateSource: "GenLayer Studionet",
        immutableArchiveSource: "ResolveGraphEvidenceRegistry on GenLayer Studionet",
        archiveReadMode,
        canonicalSnapshotVerificationRun:
          archiveReadMode === "VERIFIED_CANONICAL_SNAPSHOT"
            ? CANONICAL_EVIDENCE_SNAPSHOT_RUN_ID
            : null,
        remoteByteHashScope:
          "Only archive records with content_hash claim a captured remote-byte SHA-256. Contract bounded snapshots have their own separate snapshot hash.",
        registryFetchBoundary:
          "The registry stores immutable publisher-submitted capture metadata; it does not fetch remote bytes itself.",
      },
    };

    const manifestDigest = sha256(body);

    return NextResponse.json({
      ...body,
      manifestDigest,
      generatedAt: Math.floor(Date.now() / 1000),
      digestScope:
        "All response fields except generatedAt and digestScope are covered by manifestDigest.",
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

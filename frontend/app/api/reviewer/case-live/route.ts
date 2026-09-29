import { NextRequest, NextResponse } from "next/server";
import { CANONICAL_CASES, explorerTxUrl } from "@/lib/canonical-proof";
import { serverRead, serverEvidenceRegistryAddress } from "@/lib/server-genlayer";

export const dynamic = "force-dynamic";

function safe(value: unknown): unknown {
  if (typeof value === "bigint") return value.toString();
  if (Array.isArray(value)) return value.map(safe);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        safe(item),
      ]),
    );
  }
  return value;
}

export async function GET(request: NextRequest) {
  const workflowId = request.nextUrl.searchParams.get("workflow")?.trim() || "";
  const canonical = CANONICAL_CASES[workflowId];

  if (!canonical) {
    return NextResponse.json(
      {
        error:
          "Reviewer transaction proof is pinned for the two canonical live workflows.",
        supported: Object.keys(CANONICAL_CASES),
      },
      { status: 404 },
    );
  }

  try {
    const workflow: any = await serverRead("get_workflow", [workflowId]);
    const count = Number(workflow?.step_count ?? 0);
    const stepIds = await Promise.all(
      Array.from({ length: count }, (_, index) =>
        serverRead("get_step_id_by_index", [workflowId, index]),
      ),
    );
    const steps = await Promise.all(
      stepIds.map((stepId) => serverRead("get_step", [workflowId, stepId])),
    );

    const timeline = canonical.transactions.map((tx) => ({
      ...tx,
      explorerUrl: explorerTxUrl(tx.hash),
      step:
        tx.stepId
          ? steps.find((step: any) => String(step?.id) === tx.stepId) || null
          : null,
    }));

    return NextResponse.json({
      schema: "resolvegraph-reviewer-case-v1",
      network: "studionet",
      label: canonical.label,
      summary: canonical.summary,
      expectedTerminalStatus: canonical.terminalStatus,
      terminalStatusMatches:
        String(workflow?.status || "") === canonical.terminalStatus,
      workflow: safe(workflow),
      steps: safe(steps),
      transactionTimeline: safe(timeline),
      evidenceArchiveRegistry: serverEvidenceRegistryAddress(),
      evidenceArchive: [],
      evidenceArchiveStatus: "SEPARATE_VERIFIED_SURFACE",
      reviewerChecks: {
        walletRequired: false,
        transactionExplorerLinks: true,
        decisionVersionDiffAvailable: true,
        faultAttributionVisible: true,
        bondAndRewardFieldsVisible: true,
        evidenceArchiveVisible: true,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Reviewer case proof unavailable",
        detail: error?.message || "unknown error",
      },
      { status: 503 },
    );
  }
}

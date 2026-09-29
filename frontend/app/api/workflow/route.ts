import { NextRequest, NextResponse } from "next/server";
import { serverRead } from "@/lib/server-genlayer";

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
  const workflowId = request.nextUrl.searchParams.get("id")?.trim();
  if (!workflowId) {
    return NextResponse.json({ error: "id query parameter is required" }, { status: 400 });
  }

  try {
    const workflow: any = await serverRead("get_workflow", [workflowId]);
    const count = Number(workflow?.step_count ?? 0);
    const ids = await Promise.all(
      Array.from({ length: count }, (_, index) =>
        serverRead("get_step_id_by_index", [workflowId, index]),
      ),
    );
    const steps = await Promise.all(
      ids.map((stepId) => serverRead("get_step", [workflowId, stepId])),
    );

    return NextResponse.json({
      schema: "resolvegraph-workflow-v1",
      workflow: jsonSafe(workflow),
      steps: jsonSafe(steps),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "ResolveGraph workflow unavailable",
        detail: error?.message || "unknown error",
      },
      { status: 503 },
    );
  }
}

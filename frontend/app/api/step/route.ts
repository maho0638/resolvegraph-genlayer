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
  const workflowId = request.nextUrl.searchParams.get("workflow")?.trim();
  const stepId = request.nextUrl.searchParams.get("step")?.trim();

  if (!workflowId || !stepId) {
    return NextResponse.json(
      { error: "workflow and step query parameters are required" },
      { status: 400 },
    );
  }

  try {
    const step = await serverRead("get_step", [workflowId, stepId]);
    return NextResponse.json({
      schema: "resolvegraph-step-v1",
      workflowId,
      stepId,
      step: jsonSafe(step),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "ResolveGraph step unavailable",
        detail: error?.message || "unknown error",
      },
      { status: 503 },
    );
  }
}

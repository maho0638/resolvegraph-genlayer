import { NextResponse } from "next/server";
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

export async function GET() {
  try {
    const count = Number(await serverRead("get_workflow_count"));
    const ids = await Promise.all(
      Array.from({ length: count }, (_, index) =>
        serverRead("get_workflow_id_by_index", [index]),
      ),
    );
    const workflows = await Promise.all(
      ids.map((id) => serverRead("get_workflow", [id])),
    );
    return NextResponse.json({
      schema: "resolvegraph-workflows-v1",
      count,
      workflows: jsonSafe(workflows),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "ResolveGraph read unavailable",
        detail: error?.message || "unknown error",
      },
      { status: 503 },
    );
  }
}

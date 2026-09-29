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
  const address = request.nextUrl.searchParams.get("address")?.trim() || "";
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return NextResponse.json(
      { error: "A valid 20-byte EVM participant address is required" },
      { status: 400 },
    );
  }

  try {
    const stats = await serverRead("get_participant_stats", [address]);
    return NextResponse.json({
      schema: "resolvegraph-participant-v1",
      address,
      stats: jsonSafe(stats),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "ResolveGraph participant history unavailable",
        detail: error?.message || "unknown error",
      },
      { status: 503 },
    );
  }
}

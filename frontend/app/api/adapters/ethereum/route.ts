import { NextRequest, NextResponse } from "next/server";
import { inspectEthereumTransaction } from "@/lib/server-source-adapters";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const chainId = Number(request.nextUrl.searchParams.get("chainId") || "0");
  const txHash = request.nextUrl.searchParams.get("txHash")?.trim() || "";
  const eventTopic0 = request.nextUrl.searchParams.get("topic0")?.trim() || "";
  const eventContract =
    request.nextUrl.searchParams.get("contract")?.trim() || "";

  try {
    return NextResponse.json(
      await inspectEthereumTransaction({
        chainId,
        txHash,
        eventTopic0: eventTopic0 || undefined,
        eventContract: eventContract || undefined,
      }),
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Ethereum source adapter failed",
        detail: error?.message || "unknown error",
      },
      { status: 400 },
    );
  }
}

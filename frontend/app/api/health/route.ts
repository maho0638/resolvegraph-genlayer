import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const address = process.env.NEXT_PUBLIC_RESOLVEGRAPH_CONTRACT_ADDRESS?.trim();
  return NextResponse.json({
    service: "ResolveGraph",
    schema: "resolvegraph-api-v1",
    network: "studionet",
    contractConfigured: Boolean(address),
    contract: address || null,
    writesRequireWallet: true,
    receiptSchema: "resolvegraph-receipt-v1",
  });
}

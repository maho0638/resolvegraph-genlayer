import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const address = process.env.NEXT_PUBLIC_RESOLVEGRAPH_CONTRACT_ADDRESS?.trim();
  const rpc = process.env.NEXT_PUBLIC_GENLAYER_RPC_URL?.trim();
  const environment = process.env.VERCEL_ENV || "local";

  return NextResponse.json({
    service: "ResolveGraph",
    schema: "resolvegraph-api-v1",
    network: "studionet",
    environment,
    production: environment === "production",
    contractConfigured: Boolean(address),
    contract: address || null,
    rpcConfigured: Boolean(rpc),
    writesRequireWallet: true,
    receiptSchema: "resolvegraph-receipt-v1",
    deploymentCommit: process.env.VERCEL_GIT_COMMIT_SHA || null,
    deploymentUrl: process.env.VERCEL_PROJECT_PRODUCTION_URL || null,
  });
}

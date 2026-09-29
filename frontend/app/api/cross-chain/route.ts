import { NextResponse } from "next/server";
import {
  serverCrossChainSettlementAddress,
  serverReadCrossChainSettlement,
} from "@/lib/server-genlayer";

export const dynamic = "force-dynamic";

const INTENT_ID = "rg-xchain-mainnet-proof-v1";

function safe(value: unknown): unknown {
  if (typeof value === "bigint") return value.toString();
  if (Array.isArray(value)) return value.map(safe);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, safe(item)]),
    );
  }
  return value;
}

export async function GET() {
  try {
    const intent = await serverReadCrossChainSettlement("get_intent", [INTENT_ID]);
    const txHash =
      String((intent as any)?.external_tx_hash || "").trim().toLowerCase();
    const consumed = txHash
      ? await serverReadCrossChainSettlement("is_external_tx_consumed", [1, txHash])
      : false;

    return NextResponse.json({
      schema: "resolvegraph-cross-chain-settlement-proof-v1",
      network: "studionet",
      contract: serverCrossChainSettlementAddress(),
      policyVersion: "RG_XCHAIN_RELAYER_V1",
      proofRun: 36606957197,
      sourceSha256:
        "67af44ce57eb4c672b156372c7fd042a0896d24794b788c897915b7f7993a4d0",
      sourceMatch: true,
      sourceAdapterProofRun: 36604750863,
      sourceAdapterDigest:
        "702b57448a292ae70ec6d7eb7ff11527df7d2391624ec78a919def40ac60133e",
      canonicalEthereumTx:
        "0x85d995eba9763907fdf35cd2034144dd9d53ce32cbec21349d4b12823c6860c5",
      live: {
        intentId: INTENT_ID,
        intent: safe(intent),
        externalTxConsumed: safe(consumed),
      },
      guarantees: {
        perIntentRelayer: true,
        externalTxReplayGuard: true,
        confirmationThreshold: true,
        reorgDisputeWindowForShallowProofs: true,
        expiryRefund: true,
        deterministicGenSettlement: true,
      },
      trustBoundary: {
        bridgeClaimed: false,
        relayerAttestationRequired: true,
        ethereumBytesVerifiedBySourceAdapterOutsideContract: true,
        contractIndependentlyQueriesEthereum: false,
        canonicalV1SettlementUnchanged: true,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "ResolveGraph cross-chain settlement proof unavailable",
        detail: error?.message || "unknown error",
      },
      { status: 503 },
    );
  }
}

import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

const VERIFIED_V2_RECIPE_CONTRACT =
  "0x8025214a654Dd4d500bc549f204ED9a9a4d2a8c1" as const;
const VERIFIED_EVIDENCE_REGISTRY_CONTRACT =
  "0xB5B0Dd5E454590fCb4FCEFD85B11d16774552390" as const;
const VERIFIED_V3_APPEAL_CONTRACT =
  "0x14948AD5dCd317Ec49f5CEf7e08c72176C900214" as const;
const VERIFIED_CROSS_CHAIN_SETTLEMENT_CONTRACT =
  "0x0ca7432339C86ab01118f46D847A11EF94CB4BAA" as const;

const READ_RETRY_DELAYS_MS = [250, 750, 1500, 3000] as const;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function serverContractAddress(): `0x${string}` {
  const value = process.env.NEXT_PUBLIC_RESOLVEGRAPH_CONTRACT_ADDRESS?.trim();
  if (!value || !/^0x[a-fA-F0-9]{40}$/.test(value)) {
    throw new Error("ResolveGraph contract address is not configured.");
  }
  return value as `0x${string}`;
}

export function serverV2RecipeContractAddress(): `0x${string}` {
  const value =
    process.env.RESOLVEGRAPH_V2_RECIPE_CONTRACT_ADDRESS?.trim() ||
    VERIFIED_V2_RECIPE_CONTRACT;
  if (!/^0x[a-fA-F0-9]{40}$/.test(value)) {
    throw new Error("ResolveGraph V2 recipe contract address is invalid.");
  }
  return value as `0x${string}`;
}

export function serverEvidenceRegistryAddress(): `0x${string}` {
  const value =
    process.env.RESOLVEGRAPH_EVIDENCE_REGISTRY_ADDRESS?.trim() ||
    VERIFIED_EVIDENCE_REGISTRY_CONTRACT;
  if (!/^0x[a-fA-F0-9]{40}$/.test(value)) {
    throw new Error("ResolveGraph evidence registry address is invalid.");
  }
  return value as `0x${string}`;
}

export function serverV3AppealContractAddress(): `0x${string}` {
  const value =
    process.env.RESOLVEGRAPH_V3_APPEAL_CONTRACT_ADDRESS?.trim() ||
    VERIFIED_V3_APPEAL_CONTRACT;
  if (!/^0x[a-fA-F0-9]{40}$/.test(value)) {
    throw new Error("ResolveGraph V3 appeal contract address is invalid.");
  }
  return value as `0x${string}`;
}

export function serverCrossChainSettlementAddress(): `0x${string}` {
  const value =
    process.env.RESOLVEGRAPH_CROSS_CHAIN_SETTLEMENT_ADDRESS?.trim() ||
    VERIFIED_CROSS_CHAIN_SETTLEMENT_CONTRACT;
  if (!/^0x[a-fA-F0-9]{40}$/.test(value)) {
    throw new Error("ResolveGraph cross-chain settlement address is invalid.");
  }
  return value as `0x${string}`;
}

export function serverReadClient() {
  const config: any = { chain: studionet };
  const endpoint = process.env.NEXT_PUBLIC_GENLAYER_RPC_URL;
  if (endpoint) config.endpoint = endpoint;
  return createClient(config);
}

export async function serverReadAt(
  address: `0x${string}`,
  functionName: string,
  args: unknown[] = [],
) {
  let lastError: unknown;

  for (let attempt = 0; attempt <= READ_RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      const client: any = serverReadClient();
      return await client.readContract({
        address,
        functionName,
        args,
      });
    } catch (error) {
      lastError = error;
      if (attempt >= READ_RETRY_DELAYS_MS.length) throw error;
      await sleep(READ_RETRY_DELAYS_MS[attempt]);
    }
  }

  throw lastError;
}

export async function serverRead(functionName: string, args: unknown[] = []) {
  return serverReadAt(serverContractAddress(), functionName, args);
}

export async function serverReadV2Recipe(
  functionName: string,
  args: unknown[] = [],
) {
  return serverReadAt(serverV2RecipeContractAddress(), functionName, args);
}

export async function serverReadEvidenceRegistry(
  functionName: string,
  args: unknown[] = [],
) {
  return serverReadAt(serverEvidenceRegistryAddress(), functionName, args);
}

export async function serverReadV3Appeal(
  functionName: string,
  args: unknown[] = [],
) {
  return serverReadAt(serverV3AppealContractAddress(), functionName, args);
}

export async function serverReadCrossChainSettlement(
  functionName: string,
  args: unknown[] = [],
) {
  return serverReadAt(serverCrossChainSettlementAddress(), functionName, args);
}

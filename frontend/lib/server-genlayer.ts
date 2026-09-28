import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

export function serverContractAddress(): `0x${string}` {
  const value = process.env.NEXT_PUBLIC_RESOLVEGRAPH_CONTRACT_ADDRESS?.trim();
  if (!value || !/^0x[a-fA-F0-9]{40}$/.test(value)) {
    throw new Error("ResolveGraph contract address is not configured.");
  }
  return value as `0x${string}`;
}

export function serverReadClient() {
  const config: any = { chain: studionet };
  const endpoint = process.env.NEXT_PUBLIC_GENLAYER_RPC_URL;
  if (endpoint) config.endpoint = endpoint;
  return createClient(config);
}

export async function serverRead(functionName: string, args: unknown[] = []) {
  const client: any = serverReadClient();
  return client.readContract({
    address: serverContractAddress(),
    functionName,
    args,
  });
}

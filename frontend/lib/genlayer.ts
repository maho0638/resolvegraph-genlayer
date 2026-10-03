"use client";

import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<any>;
    };
  }
}

export type WriteRequest = {
  functionName: string;
  args: unknown[];
  value?: bigint;
};

const VERIFIED_V1_CONTRACT =
  "0x881665b7331CcE0a2f66A01aF14BB7CA14464FF0" as const;
const VERIFIED_V3_APPEAL_CONTRACT =
  "0x8d9c489A2854faFa2bBd2E258B8C0AA9d0Da5F3F" as const;

export function contractAddress(): `0x${string}` {
  const value =
    process.env.NEXT_PUBLIC_RESOLVEGRAPH_CONTRACT_ADDRESS_V4?.trim() ||
    VERIFIED_V1_CONTRACT;
  if (!/^0x[a-fA-F0-9]{40}$/.test(value)) {
    throw new Error("ResolveGraph contract address is invalid.");
  }
  return value as `0x${string}`;
}

export function v3ContractAddress(): `0x${string}` {
  const value =
    process.env.NEXT_PUBLIC_RESOLVEGRAPH_V3_APPEAL_CONTRACT_ADDRESS_V4?.trim() ||
    VERIFIED_V3_APPEAL_CONTRACT;
  if (!/^0x[a-fA-F0-9]{40}$/.test(value)) {
    throw new Error("ResolveGraph V3 contract address is invalid.");
  }
  return value as `0x${string}`;
}

export function evidenceRegistryAddress(): `0x${string}` {
  const value =
    process.env.NEXT_PUBLIC_RESOLVEGRAPH_EVIDENCE_REGISTRY_ADDRESS_V4?.trim() ||
    "0x7436623f5bc064179546344b587fe9BF30B71004";
  if (!/^0x[a-fA-F0-9]{40}$/.test(value)) {
    throw new Error("ResolveGraph evidence registry address is invalid.");
  }
  return value as `0x${string}`;
}

export function isContractConfigured(): boolean {
  try {
    contractAddress();
    return true;
  } catch {
    return false;
  }
}

export function readClient() {
  const config: any = { chain: studionet };
  const endpoint = process.env.NEXT_PUBLIC_GENLAYER_RPC_URL;
  if (endpoint) config.endpoint = endpoint;
  return createClient(config);
}

export async function walletClient() {
  if (!window.ethereum) {
    throw new Error("An EIP-1193 wallet such as Rabby or MetaMask is required.");
  }

  const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
  if (!accounts?.[0]) {
    throw new Error("No wallet account selected.");
  }

  const config: any = {
    chain: studionet,
    account: accounts[0] as `0x${string}`,
    provider: window.ethereum,
  };
  const endpoint = process.env.NEXT_PUBLIC_GENLAYER_RPC_URL;
  if (endpoint) config.endpoint = endpoint;

  const client: any = createClient(config);
  await client.connect("studionet");
  return { client, account: accounts[0] as string };
}

export async function estimateWriteAt(
  address: `0x${string}`,
  request: WriteRequest,
) {
  const { client } = await walletClient();
  return client.estimateTransactionFeesForWrite({
    address,
    functionName: request.functionName,
    args: request.args,
    value: request.value ?? 0n,
  });
}

export async function sendWriteAt(
  address: `0x${string}`,
  request: WriteRequest,
) {
  const { client } = await walletClient();

  const estimate = await client.estimateTransactionFeesForWrite({
    address,
    functionName: request.functionName,
    args: request.args,
    value: request.value ?? 0n,
  });

  const hash = await client.writeContract({
    address,
    functionName: request.functionName,
    args: request.args,
    value: request.value ?? 0n,
    fees: {
      distribution: estimate.distribution,
      feeValue: estimate.feeValue,
      ...(estimate.messageAllocations
        ? { messageAllocations: estimate.messageAllocations }
        : {}),
    },
  });

  const receipt = await client.waitForTransactionReceipt({
    hash,
    status: "FINALIZED" as any,
    retries: 60,
    interval: 5000,
  });

  const status = String(receipt?.statusName ?? "").toUpperCase();
  const execution = String(receipt?.txExecutionResultName ?? "").toUpperCase();
  if (status !== "FINALIZED" || execution !== "FINISHED_WITH_RETURN") {
    throw new Error(
      "Transaction failed: " +
        (status || "UNKNOWN") +
        " / " +
        (execution || "UNKNOWN"),
    );
  }

  return hash as string;
}

export async function sendWrite(request: WriteRequest) {
  return sendWriteAt(contractAddress(), request);
}

export async function sendWriteV3(request: WriteRequest) {
  return sendWriteAt(v3ContractAddress(), request);
}

export async function estimateWriteV3(request: WriteRequest) {
  return estimateWriteAt(v3ContractAddress(), request);
}

export async function readContractAt(
  address: `0x${string}`,
  functionName: string,
  args: unknown[] = [],
): Promise<any> {
  const client: any = readClient();
  return client.readContract({ address, functionName, args });
}

export async function readContract(
  functionName: string,
  args: unknown[] = [],
): Promise<any> {
  return readContractAt(contractAddress(), functionName, args);
}

export async function readContractV3(
  functionName: string,
  args: unknown[] = [],
): Promise<any> {
  return readContractAt(v3ContractAddress(), functionName, args);
}

export function parseGen(value: string): bigint {
  const clean = value.trim();
  if (!/^\d+(\.\d{0,18})?$/.test(clean)) {
    throw new Error("Enter a valid GEN amount.");
  }
  const [whole, fraction = ""] = clean.split(".");
  return BigInt(whole) * 10n ** 18n + BigInt(fraction.padEnd(18, "0"));
}

export function formatGen(value: unknown): string {
  try {
    const n = BigInt(String(value));
    const whole = n / 10n ** 18n;
    const fraction = (n % 10n ** 18n)
      .toString()
      .padStart(18, "0")
      .slice(0, 6)
      .replace(/0+$/, "");
    return String(whole) + "." + (fraction || "0") + " GEN";
  } catch {
    return String(value ?? "0");
  }
}

export function short(value?: string): string {
  if (!value) return "—";
  if (value.length <= 18) return value;
  return value.slice(0, 8) + "…" + value.slice(-6);
}

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

export function contractAddress(): `0x${string}` {
  const value = process.env.NEXT_PUBLIC_RESOLVEGRAPH_CONTRACT_ADDRESS?.trim();
  if (!value || !/^0x[a-fA-F0-9]{40}$/.test(value)) {
    throw new Error("ResolveGraph contract address is not configured yet.");
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

export async function readContract(
  functionName: string,
  args: unknown[] = [],
): Promise<any> {
  const client: any = readClient();
  return client.readContract({
    address: contractAddress(),
    functionName,
    args,
  });
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

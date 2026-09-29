import { createHash } from "node:crypto";

export type GithubSourceKind = "GITHUB_COMMIT" | "GITHUB_PR" | "GITHUB_CI";

function digest(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function githubApiHeaders() {
  return {
    Accept: "application/vnd.github+json",
    "User-Agent": "ResolveGraph-Source-Adapters/1.0",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

async function githubJson(path: string) {
  const response = await fetch("https://api.github.com" + path, {
    cache: "no-store",
    headers: githubApiHeaders(),
  });
  if (!response.ok) {
    throw new Error("GitHub adapter failed with HTTP " + response.status + ".");
  }
  return response.json();
}

export function parseGithubSourceUrl(value: string):
  | {
      kind: "GITHUB_COMMIT";
      owner: string;
      repo: string;
      sha: string;
    }
  | {
      kind: "GITHUB_PR";
      owner: string;
      repo: string;
      number: number;
    }
  | {
      kind: "GITHUB_CI";
      owner: string;
      repo: string;
      runId: number;
    } {
  const url = new URL(value);
  if (
    url.protocol !== "https:" ||
    url.hostname.toLowerCase() !== "github.com" ||
    url.username ||
    url.password
  ) {
    throw new Error("Source must be a canonical HTTPS github.com URL.");
  }

  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length === 4 && parts[2] === "commit") {
    const sha = parts[3].toLowerCase();
    if (!/^[a-f0-9]{40}$/.test(sha)) {
      throw new Error("GitHub commit URL must contain a full 40-character SHA.");
    }
    return {
      kind: "GITHUB_COMMIT",
      owner: parts[0],
      repo: parts[1],
      sha,
    };
  }

  if (parts.length === 4 && parts[2] === "pull") {
    const number = Number(parts[3]);
    if (!Number.isSafeInteger(number) || number < 1) {
      throw new Error("GitHub pull request number is invalid.");
    }
    return {
      kind: "GITHUB_PR",
      owner: parts[0],
      repo: parts[1],
      number,
    };
  }

  if (
    parts.length === 5 &&
    parts[2] === "actions" &&
    parts[3] === "runs"
  ) {
    const runId = Number(parts[4]);
    if (!Number.isSafeInteger(runId) || runId < 1) {
      throw new Error("GitHub Actions run ID is invalid.");
    }
    return {
      kind: "GITHUB_CI",
      owner: parts[0],
      repo: parts[1],
      runId,
    };
  }

  throw new Error(
    "Supported GitHub sources are commit, pull request and Actions run URLs.",
  );
}

export async function inspectGithubSource(value: string) {
  const parsed = parseGithubSourceUrl(value);

  if (parsed.kind === "GITHUB_COMMIT") {
    const commit = await githubJson(
      "/repos/" +
        encodeURIComponent(parsed.owner) +
        "/" +
        encodeURIComponent(parsed.repo) +
        "/commits/" +
        parsed.sha,
    );
    const body = {
      schema: "resolvegraph-github-adapter-v1",
      sourceType: parsed.kind,
      sourceUrl: value,
      repository: parsed.owner + "/" + parsed.repo,
      immutableRefKind: "GIT_COMMIT_SHA",
      immutableRef: String(commit?.sha || "").toLowerCase(),
      author: String(commit?.author?.login || commit?.commit?.author?.name || ""),
      committer: String(
        commit?.committer?.login || commit?.commit?.committer?.name || "",
      ),
      authoredAt: String(commit?.commit?.author?.date || ""),
      committedAt: String(commit?.commit?.committer?.date || ""),
      message: String(commit?.commit?.message || "").slice(0, 1000),
      treeSha: String(commit?.commit?.tree?.sha || "").toLowerCase(),
      parentShas: Array.isArray(commit?.parents)
        ? commit.parents.map((parent: any) => String(parent?.sha || "").toLowerCase())
        : [],
      verification: {
        verified: Boolean(commit?.commit?.verification?.verified),
        reason: String(commit?.commit?.verification?.reason || ""),
      },
    };
    if (body.immutableRef !== parsed.sha) {
      throw new Error("GitHub API did not resolve the requested immutable commit.");
    }
    return { ...body, adapterDigest: digest(body) };
  }

  if (parsed.kind === "GITHUB_PR") {
    const pull = await githubJson(
      "/repos/" +
        encodeURIComponent(parsed.owner) +
        "/" +
        encodeURIComponent(parsed.repo) +
        "/pulls/" +
        parsed.number,
    );
    const body = {
      schema: "resolvegraph-github-adapter-v1",
      sourceType: parsed.kind,
      sourceUrl: value,
      repository: parsed.owner + "/" + parsed.repo,
      pullNumber: parsed.number,
      state: String(pull?.state || ""),
      merged: Boolean(pull?.merged),
      draft: Boolean(pull?.draft),
      author: String(pull?.user?.login || ""),
      headSha: String(pull?.head?.sha || "").toLowerCase(),
      baseSha: String(pull?.base?.sha || "").toLowerCase(),
      mergeCommitSha: String(pull?.merge_commit_sha || "").toLowerCase(),
      immutableRefKind: "GITHUB_PR_HEAD_SHA",
      immutableRef: String(pull?.head?.sha || "").toLowerCase(),
      createdAt: String(pull?.created_at || ""),
      updatedAt: String(pull?.updated_at || ""),
      mergedAt: String(pull?.merged_at || ""),
      changedFiles: Number(pull?.changed_files ?? 0),
      commits: Number(pull?.commits ?? 0),
      additions: Number(pull?.additions ?? 0),
      deletions: Number(pull?.deletions ?? 0),
      title: String(pull?.title || "").slice(0, 500),
    };
    if (!/^[a-f0-9]{40}$/.test(body.immutableRef)) {
      throw new Error("GitHub PR head SHA is unavailable.");
    }
    return { ...body, adapterDigest: digest(body) };
  }

  const run = await githubJson(
    "/repos/" +
      encodeURIComponent(parsed.owner) +
      "/" +
      encodeURIComponent(parsed.repo) +
      "/actions/runs/" +
      parsed.runId,
  );
  const body = {
    schema: "resolvegraph-github-adapter-v1",
    sourceType: parsed.kind,
    sourceUrl: value,
    repository: parsed.owner + "/" + parsed.repo,
    runId: Number(run?.id ?? 0),
    workflowId: Number(run?.workflow_id ?? 0),
    runAttempt: Number(run?.run_attempt ?? 0),
    status: String(run?.status || ""),
    conclusion: String(run?.conclusion || ""),
    event: String(run?.event || ""),
    actor: String(run?.actor?.login || ""),
    headBranch: String(run?.head_branch || ""),
    headSha: String(run?.head_sha || "").toLowerCase(),
    immutableRefKind: "GITHUB_RUN_ID",
    immutableRef: String(run?.id ?? ""),
    createdAt: String(run?.created_at || ""),
    updatedAt: String(run?.updated_at || ""),
  };
  if (body.runId !== parsed.runId || !/^[a-f0-9]{40}$/.test(body.headSha)) {
    throw new Error("GitHub Actions run metadata is incomplete.");
  }
  return { ...body, adapterDigest: digest(body) };
}

export function parseEthereumExplorerUrl(value: string): {
  chainId: 1 | 11155111;
  txHash: string;
} | null {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password) return null;

  const hostname = url.hostname.toLowerCase();
  const chainId =
    hostname === "etherscan.io"
      ? 1
      : hostname === "sepolia.etherscan.io"
        ? 11155111
        : null;
  if (!chainId) return null;

  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length !== 2 || parts[0] !== "tx") return null;
  const txHash = parts[1].toLowerCase();
  if (!/^0x[a-f0-9]{64}$/.test(txHash)) return null;
  return { chainId, txHash };
}

function rpcEndpoints(chainId: number) {
  if (chainId === 1) {
    return [
      process.env.ETHEREUM_MAINNET_RPC_URL,
      "https://ethereum-rpc.publicnode.com",
      "https://eth.llamarpc.com",
      "https://cloudflare-eth.com",
    ].filter(Boolean) as string[];
  }
  if (chainId === 11155111) {
    return [
      process.env.ETHEREUM_SEPOLIA_RPC_URL,
      "https://ethereum-sepolia-rpc.publicnode.com",
      "https://rpc.sepolia.org",
    ].filter(Boolean) as string[];
  }
  throw new Error("Supported chain IDs are 1 (Ethereum) and 11155111 (Sepolia).");
}

async function rpc(chainId: number, method: string, params: unknown[]) {
  const failures: string[] = [];
  for (const endpoint of rpcEndpoints(chainId)) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        cache: "no-store",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method,
          params,
        }),
      });
      if (!response.ok) {
        failures.push(new URL(endpoint).hostname + ":HTTP_" + response.status);
        continue;
      }
      const body = await response.json();
      if (body?.error) {
        failures.push(
          new URL(endpoint).hostname +
            ":RPC_" +
            String(body.error?.code || "error"),
        );
        continue;
      }
      if (body?.result === null || body?.result === undefined) {
        failures.push(new URL(endpoint).hostname + ":NULL_RESULT");
        continue;
      }
      return body.result;
    } catch (error: any) {
      failures.push(
        new URL(endpoint).hostname +
          ":" +
          String(error?.name || "fetch_error"),
      );
    }
  }
  throw new Error(
    "All allow-listed Ethereum RPCs failed for " +
      method +
      " (" +
      failures.join(", ") +
      ").",
  );
}

function hexNumber(value: unknown) {
  const text = String(value || "");
  return /^0x[0-9a-f]+$/i.test(text) ? Number(BigInt(text)) : 0;
}

export async function inspectEthereumTransaction(args: {
  chainId: number;
  txHash: string;
  eventTopic0?: string;
  eventContract?: string;
}) {
  const txHash = args.txHash.trim().toLowerCase();
  if (!/^0x[a-f0-9]{64}$/.test(txHash)) {
    throw new Error("Ethereum transaction hash must be 32-byte 0x hex.");
  }
  if (![1, 11155111].includes(args.chainId)) {
    throw new Error("Supported chain IDs are 1 and 11155111.");
  }

  const [tx, receipt, latestHex] = await Promise.all([
    rpc(args.chainId, "eth_getTransactionByHash", [txHash]),
    rpc(args.chainId, "eth_getTransactionReceipt", [txHash]),
    rpc(args.chainId, "eth_blockNumber", []),
  ]);
  if (!tx || !receipt) throw new Error("Ethereum transaction was not found.");

  const blockNumber = hexNumber(receipt.blockNumber);
  const block = await rpc(args.chainId, "eth_getBlockByNumber", [
    receipt.blockNumber,
    false,
  ]);
  const latest = hexNumber(latestHex);
  const logs = Array.isArray(receipt.logs) ? receipt.logs.slice(0, 64) : [];
  const topic0 = args.eventTopic0?.trim().toLowerCase() || "";
  const contract = args.eventContract?.trim().toLowerCase() || "";
  if (topic0 && !/^0x[a-f0-9]{64}$/.test(topic0)) {
    throw new Error("eventTopic0 must be a 32-byte 0x hex topic.");
  }
  if (contract && !/^0x[a-f0-9]{40}$/.test(contract)) {
    throw new Error("eventContract must be a 20-byte 0x address.");
  }

  const matchedLogs = logs.filter((log: any) => {
    const logTopic0 = String(log?.topics?.[0] || "").toLowerCase();
    const logAddress = String(log?.address || "").toLowerCase();
    return (!topic0 || logTopic0 === topic0) && (!contract || logAddress === contract);
  });

  const body = {
    schema: "resolvegraph-ethereum-adapter-v1",
    sourceType: "ETHEREUM_TX",
    chainId: args.chainId,
    txHash,
    immutableRefKind: "ETH_TX_HASH",
    immutableRef: txHash,
    status: hexNumber(receipt.status) === 1 ? "SUCCESS" : "FAILED",
    blockNumber,
    blockHash: String(receipt.blockHash || "").toLowerCase(),
    blockTimestamp: hexNumber(block?.timestamp),
    confirmations: blockNumber && latest >= blockNumber ? latest - blockNumber + 1 : 0,
    from: String(tx.from || "").toLowerCase(),
    to: String(tx.to || "").toLowerCase(),
    valueWei: String(BigInt(String(tx.value || "0x0"))),
    nonce: hexNumber(tx.nonce),
    inputHash: createHash("sha256")
      .update(String(tx.input || ""))
      .digest("hex"),
    gasUsed: String(BigInt(String(receipt.gasUsed || "0x0"))),
    effectiveGasPrice: String(
      BigInt(String(receipt.effectiveGasPrice || "0x0")),
    ),
    contractAddress: String(receipt.contractAddress || "").toLowerCase(),
    logs: logs.map((log: any) => ({
      address: String(log?.address || "").toLowerCase(),
      logIndex: hexNumber(log?.logIndex),
      topics: Array.isArray(log?.topics)
        ? log.topics.map((topic: unknown) => String(topic).toLowerCase())
        : [],
      dataHash: createHash("sha256")
        .update(String(log?.data || ""))
        .digest("hex"),
    })),
    eventQuery:
      topic0 || contract
        ? {
            topic0: topic0 || null,
            contract: contract || null,
            matchedCount: matchedLogs.length,
          }
        : null,
  };

  return { ...body, adapterDigest: digest(body) };
}

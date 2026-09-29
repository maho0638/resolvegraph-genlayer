import { createHash } from "node:crypto";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import {
  canonicalEvidenceArchivePayload,
  type EvidenceArchiveInput,
} from "@/lib/evidence-archive";

const MAX_BYTES = 2 * 1024 * 1024;
const MAX_REDIRECTS = 3;

function isPrivateIpv4(value: string) {
  const p = value.split(".").map(Number);
  if (p.length !== 4 || p.some((n) => !Number.isInteger(n))) return true;
  if (p[0] === 10 || p[0] === 127 || p[0] === 0) return true;
  if (p[0] === 169 && p[1] === 254) return true;
  if (p[0] === 172 && p[1] >= 16 && p[1] <= 31) return true;
  if (p[0] === 192 && p[1] === 168) return true;
  if (p[0] === 100 && p[1] >= 64 && p[1] <= 127) return true;
  if (p[0] >= 224) return true;
  return false;
}

function isPrivateIpv6(value: string) {
  const lower = value.toLowerCase();
  return (
    lower === "::1" ||
    lower === "::" ||
    lower.startsWith("fc") ||
    lower.startsWith("fd") ||
    lower.startsWith("fe8") ||
    lower.startsWith("fe9") ||
    lower.startsWith("fea") ||
    lower.startsWith("feb")
  );
}

function publicIp(value: string) {
  const family = isIP(value);
  if (family === 4) return !isPrivateIpv4(value);
  if (family === 6) return !isPrivateIpv6(value);
  return false;
}

async function assertPublicHttps(value: string) {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password) {
    throw new Error("Evidence source must be a credential-free HTTPS URL.");
  }

  const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
  if (
    !hostname ||
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    hostname.endsWith(".lan")
  ) {
    throw new Error("Local or internal evidence hosts are not allowed.");
  }

  if (isIP(hostname)) {
    if (!publicIp(hostname)) throw new Error("Private IP evidence hosts are not allowed.");
  } else {
    const answers = await lookup(hostname, { all: true, verbatim: true });
    if (!answers.length || answers.some((answer) => !publicIp(answer.address))) {
      throw new Error("Evidence host must resolve only to public IP addresses.");
    }
  }

  return url;
}

async function fetchBounded(urlValue: string, redirects = 0): Promise<{
  finalUrl: string;
  bytes: Uint8Array;
  contentType: string;
}> {
  const url = await assertPublicHttps(urlValue);
  const response = await fetch(url, {
    cache: "no-store",
    redirect: "manual",
    headers: {
      "user-agent": "ResolveGraph-Evidence-Capture/2.0",
      accept: "*/*",
    },
  });

  if (response.status >= 300 && response.status < 400) {
    if (redirects >= MAX_REDIRECTS) throw new Error("Too many evidence redirects.");
    const location = response.headers.get("location");
    if (!location) throw new Error("Evidence redirect is missing a location.");
    return fetchBounded(new URL(location, url).toString(), redirects + 1);
  }
  if (!response.ok) {
    throw new Error("Evidence fetch failed with HTTP " + response.status + ".");
  }

  const declared = Number(response.headers.get("content-length") || 0);
  if (declared > MAX_BYTES) throw new Error("Evidence source exceeds the 2 MiB capture limit.");

  const reader = response.body?.getReader();
  if (!reader) throw new Error("Evidence response body is unavailable.");

  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const part = await reader.read();
    if (part.done) break;
    total += part.value.byteLength;
    if (total > MAX_BYTES) {
      await reader.cancel();
      throw new Error("Evidence source exceeds the 2 MiB capture limit.");
    }
    chunks.push(part.value);
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  const contentType = (response.headers.get("content-type") || "application/octet-stream")
    .split(";", 1)[0]
    .trim()
    .toLowerCase();

  return { finalUrl: url.toString(), bytes, contentType };
}

function inferGithubCommit(urlValue: string) {
  const url = new URL(urlValue);
  if (url.hostname.toLowerCase() !== "github.com") return null;
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length !== 4 || parts[2] !== "commit") return null;
  const sha = parts[3].toLowerCase();
  if (!/^[a-f0-9]{40}$/.test(sha)) return null;
  return { sha, owner: parts[0], repo: parts[1] };
}

function htmlAuthor(bytes: Uint8Array, contentType: string) {
  if (!contentType.includes("html")) return "";
  const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes.slice(0, 250_000));
  const patterns = [
    /<meta\s+[^>]*name=["']author["'][^>]*content=["']([^"']{1,160})["'][^>]*>/i,
    /<meta\s+[^>]*content=["']([^"']{1,160})["'][^>]*name=["']author["'][^>]*>/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return "";
}

export async function captureEvidenceSource(args: {
  base: Omit<
    EvidenceArchiveInput,
    | "sourceType"
    | "sourceUrl"
    | "contentType"
    | "contentHash"
    | "immutableRefKind"
    | "immutableRef"
    | "author"
    | "fetchedAt"
  > & { authorHint?: string };
  sourceUrl: string;
}) {
  const fetched = await fetchBounded(args.sourceUrl);
  const contentHash = createHash("sha256").update(fetched.bytes).digest("hex");
  const github = inferGithubCommit(fetched.finalUrl);
  const inferredAuthor =
    htmlAuthor(fetched.bytes, fetched.contentType) ||
    args.base.authorHint?.trim() ||
    new URL(fetched.finalUrl).hostname.toLowerCase();

  const record: EvidenceArchiveInput = {
    subjectContract: args.base.subjectContract,
    workflowId: args.base.workflowId,
    stepId: args.base.stepId,
    decisionRound: args.base.decisionRound,
    role: args.base.role,
    sourceType: github ? "GITHUB_COMMIT" : "WEB",
    sourceUrl: fetched.finalUrl,
    contentType: fetched.contentType,
    contentHash,
    immutableRefKind: github ? "GIT_COMMIT_SHA" : "SHA256",
    immutableRef: github?.sha || contentHash,
    author: inferredAuthor.slice(0, 160),
    rubricRelation: args.base.rubricRelation,
    fetchedAt: Math.floor(Date.now() / 1000),
  };

  const recordDigest = createHash("sha256")
    .update(canonicalEvidenceArchivePayload(record))
    .digest("hex");

  return {
    record,
    recordDigest,
    capture: {
      byteLength: fetched.bytes.byteLength,
      hashAlgorithm: "sha256",
      authorBasis: htmlAuthor(fetched.bytes, fetched.contentType)
        ? "html-meta-author"
        : args.base.authorHint?.trim()
          ? "caller-author-hint"
          : "hostname-fallback",
      githubCommitParsed: github
        ? { owner: github.owner, repo: github.repo, sha: github.sha }
        : null,
    },
  };
}


export async function inspectPublicArtifact(
  urlValue: string,
  expectedSha256?: string,
) {
  const fetched = await fetchBounded(urlValue);
  const contentHash = createHash("sha256").update(fetched.bytes).digest("hex");
  const expected = expectedSha256?.trim().toLowerCase() || "";
  if (expected && !/^[a-f0-9]{64}$/.test(expected)) {
    throw new Error("Expected SHA-256 must be 64 lowercase hex characters.");
  }

  const body = {
    schema: "resolvegraph-artifact-adapter-v1",
    sourceType: "ARTIFACT",
    sourceUrl: fetched.finalUrl,
    contentType: fetched.contentType,
    byteLength: fetched.bytes.byteLength,
    immutableRefKind: "SHA256",
    immutableRef: contentHash,
    contentHash,
    expectedSha256: expected || null,
    expectedHashMatches: expected ? expected === contentHash : null,
    fetchedAt: Math.floor(Date.now() / 1000),
  };

  return {
    ...body,
    adapterDigest: createHash("sha256")
      .update(JSON.stringify(body))
      .digest("hex"),
  };
}

import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getAddress, verifyMessage } from "viem";
import { serverRead } from "@/lib/server-genlayer";
import {
  assertGithubProvenanceFresh,
  buildGithubProvenanceMessage,
  buildStepPolicySeed,
  parseGithubCommitUrl,
  parseGithubGistUrl,
  type GithubProvenanceClaim,
} from "@/lib/provenance";

export const dynamic = "force-dynamic";

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function field(value: any, name: string) {
  return value?.[name];
}

async function githubJson(url: string) {
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "ResolveGraph-Provenance/1.0",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!response.ok) {
    throw new Error(
      "GitHub verification request failed with HTTP " + response.status + ".",
    );
  }
  return response.json();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const claim: GithubProvenanceClaim = {
      workflowId: String(body?.workflowId || "").trim(),
      stepId: String(body?.stepId || "").trim(),
      wallet: String(body?.wallet || "").trim(),
      githubLogin: String(body?.githubLogin || "").trim(),
      commitUrl: String(body?.commitUrl || "").trim(),
      policyDigest: String(body?.policyDigest || "").trim(),
      expiresAt: Number(body?.expiresAt || 0),
      claimId: String(body?.claimId || "").trim(),
    };
    const gistUrl = String(body?.gistUrl || "").trim();
    const signature = String(body?.signature || "").trim();

    if (!gistUrl || !/^0x[a-fA-F0-9]{130}$/.test(signature)) {
      return NextResponse.json(
        { error: "gistUrl and a 65-byte wallet signature are required" },
        { status: 400 },
      );
    }

    assertGithubProvenanceFresh(claim.expiresAt);
    const commitRef = parseGithubCommitUrl(claim.commitUrl);
    const gistRef = parseGithubGistUrl(gistUrl);

    const step: any = await serverRead("get_step", [
      claim.workflowId,
      claim.stepId,
    ]);
    const assignee = String(field(step, "assignee") || "");
    if (!/^0x[a-fA-F0-9]{40}$/.test(assignee)) {
      throw new Error("On-chain assignee is unavailable.");
    }
    if (assignee.toLowerCase() !== claim.wallet.toLowerCase()) {
      return NextResponse.json(
        { error: "Claim wallet does not match the on-chain step assignee" },
        { status: 409 },
      );
    }

    const policySeed = buildStepPolicySeed({
      workflowId: claim.workflowId,
      stepId: claim.stepId,
      assignee,
      requirement: String(field(step, "requirement") || ""),
      rubric: String(field(step, "rubric") || ""),
      dependencyA: String(field(step, "dependency_a") || ""),
      dependencyB: String(field(step, "dependency_b") || ""),
      deadline: String(field(step, "deadline") || "0"),
    });
    const expectedPolicyDigest = sha256(policySeed);
    if (expectedPolicyDigest !== claim.policyDigest.toLowerCase()) {
      return NextResponse.json(
        {
          error:
            "Policy digest does not match the current on-chain step definition",
        },
        { status: 409 },
      );
    }

    const message = buildGithubProvenanceMessage(claim);
    const messageDigest = sha256(message);
    const signatureValid = await verifyMessage({
      address: getAddress(claim.wallet),
      message,
      signature: signature as `0x${string}`,
    });
    if (!signatureValid) {
      return NextResponse.json(
        { error: "Wallet signature is invalid" },
        { status: 401 },
      );
    }

    const [commit, gist] = await Promise.all([
      githubJson(
        "https://api.github.com/repos/" +
          encodeURIComponent(commitRef.owner) +
          "/" +
          encodeURIComponent(commitRef.repo) +
          "/commits/" +
          commitRef.sha,
      ),
      githubJson(
        "https://api.github.com/gists/" + encodeURIComponent(gistRef.gistId),
      ),
    ]);

    const canonicalCommit = String(commit?.sha || "").toLowerCase();
    if (canonicalCommit !== commitRef.sha) {
      return NextResponse.json(
        { error: "GitHub did not resolve the requested immutable commit SHA" },
        { status: 409 },
      );
    }

    const commitAuthor = String(commit?.author?.login || "").toLowerCase();
    if (!commitAuthor || commitAuthor !== claim.githubLogin.toLowerCase()) {
      return NextResponse.json(
        { error: "GitHub commit author is not the claimed GitHub account" },
        { status: 409 },
      );
    }

    const gistOwner = String(gist?.owner?.login || "").toLowerCase();
    if (!gistOwner || gistOwner !== claim.githubLogin.toLowerCase()) {
      return NextResponse.json(
        { error: "Gist owner is not the claimed GitHub account" },
        { status: 409 },
      );
    }

    if (gistRef.owner !== claim.githubLogin.toLowerCase()) {
      return NextResponse.json(
        { error: "Gist URL owner does not match the claimed GitHub account" },
        { status: 409 },
      );
    }

    const gistContents = Object.values(gist?.files || {})
      .map((file: any) => String(file?.content || ""))
      .join("\n");
    const expectedToken =
      "ResolveGraph-Provenance-Digest: " + messageDigest;
    if (!gistContents.includes(expectedToken)) {
      return NextResponse.json(
        {
          error:
            "Gist does not contain the exact ResolveGraph provenance digest token",
        },
        { status: 409 },
      );
    }

    const verifiedAt = Math.floor(Date.now() / 1000);
    const baseReceipt = {
      schema: "resolvegraph-github-provenance-v1",
      claimRelation: "DELIVERED_GITHUB_COMMIT",
      workflowId: claim.workflowId,
      stepId: claim.stepId,
      participantWallet: getAddress(claim.wallet),
      githubLogin: claim.githubLogin.toLowerCase(),
      repository: commitRef.owner + "/" + commitRef.repo,
      commitSha: commitRef.sha,
      commitUrl: claim.commitUrl,
      gistUrl,
      gistId: gistRef.gistId,
      policyDigest: expectedPolicyDigest,
      claimId: claim.claimId,
      expiresAt: claim.expiresAt,
      verifiedAt,
      messageDigest,
      signature,
      checks: {
        walletMatchesOnChainAssignee: true,
        walletSignatureValid: true,
        onChainPolicyDigestMatches: true,
        githubCommitExists: true,
        githubCommitAuthorMatches: true,
        githubGistOwnerMatches: true,
        gistBindsExactClaimDigest: true,
        crossScopeReplayResistance:
          "signature binds workflow, step, wallet, GitHub account, repository, immutable commit SHA, policy digest, expiry and claim id",
      },
      trustBoundary: {
        onChainEnforcement: false,
        singleUseNonceRegistry: false,
        githubAccountEvidence:
          "GitHub public API commit author association plus an owner-controlled gist challenge",
      },
    };

    return NextResponse.json({
      ...baseReceipt,
      provenanceDigest: sha256(JSON.stringify(baseReceipt)),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "GitHub provenance verification failed",
        detail: error?.message || "unknown error",
      },
      { status: 400 },
    );
  }
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { walletClient, short } from "@/lib/genlayer";
import { fetchJson } from "@/lib/http";
import {
  buildGithubProvenanceMessage,
  buildStepPolicySeed,
  type GithubProvenanceClaim,
} from "@/lib/provenance";

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function randomClaimId() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function defaultExpiry() {
  const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 16);
}

export default function Provenance() {
  const [workflowId, setWorkflowId] = useState("");
  const [stepId, setStepId] = useState("");
  const [step, setStep] = useState<any>(null);
  const [account, setAccount] = useState("");
  const [githubLogin, setGithubLogin] = useState("");
  const [commitUrl, setCommitUrl] = useState("");
  const [gistUrl, setGistUrl] = useState("");
  const [expiry, setExpiry] = useState(defaultExpiry());
  const [claim, setClaim] = useState<GithubProvenanceClaim | null>(null);
  const [message, setMessage] = useState("");
  const [digest, setDigest] = useState("");
  const [receipt, setReceipt] = useState<any>(null);
  const [notice, setNotice] = useState(
    "Load a step, connect the assigned wallet, then bind a GitHub commit to that step.",
  );
  const [busy, setBusy] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const workflow = params.get("workflow");
    const stepValue = params.get("step");
    if (workflow) setWorkflowId(workflow);
    if (stepValue) setStepId(stepValue);
  }, []);

  const walletMatches = useMemo(
    () =>
      Boolean(
        account &&
          step?.assignee &&
          account.toLowerCase() === String(step.assignee).toLowerCase(),
      ),
    [account, step],
  );

  async function connect() {
    try {
      const wallet = await walletClient();
      setAccount(wallet.account);
      setNotice("Connected " + short(wallet.account));
    } catch (error: any) {
      setNotice(error?.message || "Wallet connection failed.");
    }
  }

  async function loadStep() {
    if (!workflowId.trim() || !stepId.trim()) {
      setNotice("Workflow ID and Step ID are required.");
      return;
    }
    setBusy("load");
    setReceipt(null);
    setClaim(null);
    setMessage("");
    setDigest("");
    try {
      const data = await fetchJson<{ step: any }>(
        "/api/step?workflow=" +
          encodeURIComponent(workflowId.trim()) +
          "&step=" +
          encodeURIComponent(stepId.trim()),
      );
      setStep(data.step);
      setNotice(
        "Live step loaded · assigned to " +
          short(String(data.step?.assignee || "")),
      );
    } catch (error: any) {
      setStep(null);
      setNotice(error?.message || "Unable to load step.");
    } finally {
      setBusy("");
    }
  }

  async function prepareClaim() {
    if (!step || !account) {
      setNotice("Load the step and connect a wallet first.");
      return;
    }
    if (!walletMatches) {
      setNotice("Connected wallet is not the on-chain assignee for this step.");
      return;
    }

    setBusy("prepare");
    setReceipt(null);
    try {
      const policySeed = buildStepPolicySeed({
        workflowId: workflowId.trim(),
        stepId: stepId.trim(),
        assignee: String(step.assignee),
        requirement: String(step.requirement || ""),
        rubric: String(step.rubric || ""),
        dependencyA: String(step.dependency_a || ""),
        dependencyB: String(step.dependency_b || ""),
        deadline: String(step.deadline || "0"),
      });
      const policyDigest = await sha256Hex(policySeed);
      const expiresAt = Math.floor(new Date(expiry).getTime() / 1000);
      if (!Number.isFinite(expiresAt)) throw new Error("Choose a valid expiry.");

      const nextClaim: GithubProvenanceClaim = {
        workflowId: workflowId.trim(),
        stepId: stepId.trim(),
        wallet: account,
        githubLogin: githubLogin.trim(),
        commitUrl: commitUrl.trim(),
        policyDigest,
        expiresAt,
        claimId: randomClaimId(),
      };
      const nextMessage = buildGithubProvenanceMessage(nextClaim);
      const nextDigest = await sha256Hex(nextMessage);
      setClaim(nextClaim);
      setMessage(nextMessage);
      setDigest(nextDigest);
      setNotice(
        "Claim prepared. Put the exact digest token in a public gist owned by the claimed GitHub account.",
      );
    } catch (error: any) {
      setNotice(error?.message || "Unable to prepare provenance claim.");
    } finally {
      setBusy("");
    }
  }

  async function copyToken() {
    if (!digest) return;
    await navigator.clipboard.writeText(
      "ResolveGraph-Provenance-Digest: " + digest,
    );
    setNotice("Exact gist token copied.");
  }

  async function signAndVerify() {
    if (!claim || !message || !gistUrl.trim()) {
      setNotice("Prepare the claim and paste the public gist URL first.");
      return;
    }
    if (!window.ethereum) {
      setNotice("Rabby, MetaMask or another EIP-1193 wallet is required.");
      return;
    }

    setBusy("verify");
    setReceipt(null);
    try {
      const signature = await window.ethereum.request({
        method: "personal_sign",
        params: [message, account],
      });
      const response = await fetchJson<any>("/api/provenance/github", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...claim,
          gistUrl: gistUrl.trim(),
          signature,
        }),
      });
      setReceipt(response);
      setNotice("GitHub provenance verified and receipt generated.");
    } catch (error: any) {
      setNotice(error?.message || "Provenance verification failed.");
    } finally {
      setBusy("");
    }
  }

  return (
    <>
      <div className="sectionHead">
        <div>
          <div className="eyebrow">Signed Provenance</div>
          <h1 style={{ fontSize: "56px" }}>
            Prove who delivered a GitHub commit for a specific ResolveGraph step.
          </h1>
          <p className="lede">
            The verifier binds the on-chain assignee, frozen step policy,
            wallet signature, GitHub account, immutable commit SHA,
            owner-controlled gist challenge, expiry and claim nonce into one
            portable receipt.
          </p>
        </div>
      </div>

      <div className="status">{notice}</div>

      <section className="panel section">
        <div className="formGrid">
          <div className="field">
            <label>Workflow ID</label>
            <input
              value={workflowId}
              onChange={(e) => setWorkflowId(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Step ID</label>
            <input value={stepId} onChange={(e) => setStepId(e.target.value)} />
          </div>
        </div>
        <div className="actions">
          <button
            className="button secondary"
            onClick={loadStep}
            disabled={!!busy}
          >
            Load live step
          </button>
          <button
            className="button secondary"
            onClick={connect}
            disabled={!!busy}
          >
            {account ? "Wallet " + short(account) : "Connect assigned wallet"}
          </button>
        </div>

        {step && (
          <div className={walletMatches ? "status ok" : "status warn"}>
            On-chain assignee: {String(step.assignee)} · connected wallet{" "}
            {walletMatches ? "matches" : "does not match"}
          </div>
        )}
      </section>

      <section className="grid2 section">
        <div className="panel">
          <div className="eyebrow">1 · Scope the claim</div>
          <h2>Bind the exact delivery</h2>
          <div className="formGrid">
            <div className="field">
              <label>GitHub login</label>
              <input
                value={githubLogin}
                onChange={(e) => setGithubLogin(e.target.value)}
                placeholder="octocat"
              />
            </div>
            <div className="field">
              <label>Claim expiry</label>
              <input
                type="datetime-local"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
              />
            </div>
            <div className="field full">
              <label>Immutable GitHub commit URL</label>
              <input
                value={commitUrl}
                onChange={(e) => setCommitUrl(e.target.value)}
                placeholder="https://github.com/owner/repo/commit/40-character-sha"
              />
            </div>
          </div>
          <div className="actions">
            <button
              className="button"
              onClick={prepareClaim}
              disabled={!!busy || !walletMatches}
            >
              Prepare signed claim
            </button>
          </div>
        </div>

        <div className="panel">
          <div className="eyebrow">2 · GitHub ownership challenge</div>
          <h2>Publish the digest from the same GitHub account</h2>
          <p className="muted">
            Create a public gist under the claimed GitHub account containing the
            exact token below. The verifier checks both gist ownership and commit
            author association.
          </p>
          <pre>
            {digest
              ? "ResolveGraph-Provenance-Digest: " + digest
              : "Prepare the claim first."}
          </pre>
          <div className="actions">
            <button
              className="button secondary"
              onClick={copyToken}
              disabled={!digest}
            >
              Copy gist token
            </button>
            <a
              className="button secondary"
              href="https://gist.github.com/"
              target="_blank"
              rel="noreferrer"
            >
              Open GitHub Gist ↗
            </a>
          </div>
          <div className="field section">
            <label>Public gist URL</label>
            <input
              value={gistUrl}
              onChange={(e) => setGistUrl(e.target.value)}
              placeholder="https://gist.github.com/login/gist-id"
            />
          </div>
        </div>
      </section>

      {message && (
        <section className="panel section">
          <div className="eyebrow">3 · Wallet signature</div>
          <h2>Sign the exact scoped message</h2>
          <pre>{message}</pre>
          <div className="actions">
            <button
              className="button"
              onClick={signAndVerify}
              disabled={!!busy || !gistUrl.trim()}
            >
              {busy === "verify" ? "Verifying…" : "Sign + verify provenance"}
            </button>
          </div>
        </section>
      )}

      {receipt && (
        <section className="panel section emphasisPanel">
          <div className="eyebrow">Verified provenance receipt</div>
          <h2>Wallet ↔ GitHub ↔ commit ↔ step</h2>
          <div className="flow">
            <span>{receipt.participantWallet}</span>
            <span>@{receipt.githubLogin}</span>
            <span>{receipt.repository}</span>
            <span>{String(receipt.commitSha).slice(0, 12)}…</span>
          </div>
          <pre>{JSON.stringify(receipt, null, 2)}</pre>
        </section>
      )}

      <section className="panel section">
        <div className="eyebrow">Trust boundary</div>
        <h2>What this verifier proves</h2>
        <p className="muted">
          A valid receipt proves that the on-chain step assignee signed this
          exact scoped claim, the claimed GitHub account owns the challenge
          gist, and GitHub associates that account with the immutable commit.
          The signature is scope- and expiry-bound, so it cannot be reused for a
          different workflow or step without failing verification. This adapter
          does not change contract settlement rules and does not maintain a
          global single-use nonce registry.
        </p>
      </section>
    </>
  );
}

"use client";

import { FormEvent, useState } from "react";
import { fetchJson } from "@/lib/http";

function Result({ value }: { value: unknown }) {
  if (!value) return null;
  return (
    <pre style={{ maxHeight: 520 }}>
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

export default function AdaptersPage() {
  const [githubUrl, setGithubUrl] = useState("");
  const [githubResult, setGithubResult] = useState<any>(null);
  const [chainId, setChainId] = useState("1");
  const [txHash, setTxHash] = useState("");
  const [topic0, setTopic0] = useState("");
  const [eventContract, setEventContract] = useState("");
  const [ethereumResult, setEthereumResult] = useState<any>(null);
  const [artifactUrl, setArtifactUrl] = useState("");
  const [artifactSha, setArtifactSha] = useState("");
  const [artifactResult, setArtifactResult] = useState<any>(null);
  const [notice, setNotice] = useState(
    "Adapters turn external delivery objects into typed, hashable verification receipts.",
  );
  const [busy, setBusy] = useState("");

  async function github(event: FormEvent) {
    event.preventDefault();
    setBusy("github");
    setGithubResult(null);
    try {
      const data = await fetchJson<any>(
        "/api/adapters/github?url=" + encodeURIComponent(githubUrl.trim()),
      );
      setGithubResult(data);
      setNotice(
        data.sourceType +
          " verified · " +
          String(data.immutableRef || data.adapterDigest).slice(0, 16) +
          "…",
      );
    } catch (error: any) {
      setNotice(error?.message || "GitHub adapter failed.");
    } finally {
      setBusy("");
    }
  }

  async function ethereum(event: FormEvent) {
    event.preventDefault();
    setBusy("ethereum");
    setEthereumResult(null);
    try {
      const params = new URLSearchParams({
        chainId,
        txHash: txHash.trim(),
      });
      if (topic0.trim()) params.set("topic0", topic0.trim());
      if (eventContract.trim()) params.set("contract", eventContract.trim());
      const data = await fetchJson<any>(
        "/api/adapters/ethereum?" + params.toString(),
      );
      setEthereumResult(data);
      setNotice(
        "Ethereum transaction verified · block " +
          String(data.blockNumber) +
          " · " +
          String(data.status),
      );
    } catch (error: any) {
      setNotice(error?.message || "Ethereum adapter failed.");
    } finally {
      setBusy("");
    }
  }

  async function artifact(event: FormEvent) {
    event.preventDefault();
    setBusy("artifact");
    setArtifactResult(null);
    try {
      const params = new URLSearchParams({ url: artifactUrl.trim() });
      if (artifactSha.trim()) params.set("sha256", artifactSha.trim());
      const data = await fetchJson<any>(
        "/api/adapters/artifact?" + params.toString(),
      );
      setArtifactResult(data);
      setNotice(
        "Artifact captured · SHA-256 " +
          String(data.contentHash).slice(0, 16) +
          "…",
      );
    } catch (error: any) {
      setNotice(error?.message || "Artifact adapter failed.");
    } finally {
      setBusy("");
    }
  }

  return (
    <>
      <div className="sectionHead">
        <div>
          <div className="eyebrow">Source Adapters</div>
          <h1 style={{ fontSize: "56px" }}>
            Turn real delivery objects into typed verification inputs.
          </h1>
          <p className="lede">
            ResolveGraph adapters normalize GitHub commits, pull requests,
            Actions runs, Ethereum transactions/events and bounded public
            artifacts into deterministic receipts that can be linked to
            evidence manifests and workflow decisions.
          </p>
        </div>
      </div>

      <div className="status">{notice}</div>

      <section className="grid2 section">
        <form className="panel" onSubmit={github}>
          <div className="eyebrow">GitHub</div>
          <h2>Commit · PR · Actions run</h2>
          <p className="muted">
            Uses the public GitHub API and only accepts canonical github.com URLs.
          </p>
          <div className="field">
            <label>GitHub source URL</label>
            <input
              value={githubUrl}
              onChange={(event) => setGithubUrl(event.target.value)}
              placeholder="https://github.com/owner/repo/commit/40-char-sha"
              required
            />
          </div>
          <div className="actions">
            <button className="button" disabled={!!busy}>
              {busy === "github" ? "Verifying…" : "Verify GitHub source"}
            </button>
          </div>
          <Result value={githubResult} />
        </form>

        <form className="panel" onSubmit={ethereum}>
          <div className="eyebrow">Ethereum</div>
          <h2>Transaction · receipt · event</h2>
          <p className="muted">
            Reads fixed allow-listed Ethereum RPC endpoints. Optional topic and
            contract filters verify whether a receipt contains the expected event.
          </p>
          <div className="formGrid">
            <div className="field">
              <label>Chain</label>
              <select value={chainId} onChange={(event) => setChainId(event.target.value)}>
                <option value="1">Ethereum mainnet · 1</option>
                <option value="11155111">Sepolia · 11155111</option>
              </select>
            </div>
            <div className="field">
              <label>Transaction hash</label>
              <input
                value={txHash}
                onChange={(event) => setTxHash(event.target.value)}
                placeholder="0x…"
                required
              />
            </div>
            <div className="field">
              <label>Optional event topic0</label>
              <input
                value={topic0}
                onChange={(event) => setTopic0(event.target.value)}
                placeholder="0x…"
              />
            </div>
            <div className="field">
              <label>Optional event contract</label>
              <input
                value={eventContract}
                onChange={(event) => setEventContract(event.target.value)}
                placeholder="0x…"
              />
            </div>
          </div>
          <div className="actions">
            <button className="button" disabled={!!busy}>
              {busy === "ethereum" ? "Verifying…" : "Verify transaction"}
            </button>
          </div>
          <Result value={ethereumResult} />
        </form>
      </section>

      <section className="panel section">
        <div className="eyebrow">Artifact storage</div>
        <h2>Bounded HTTPS artifact capture</h2>
        <p className="muted">
          The server blocks local/private-network targets, follows at most three
          validated redirects, caps the body at 2 MiB and returns a SHA-256
          receipt. Supply an expected hash to turn capture into equality proof.
        </p>
        <form onSubmit={artifact}>
          <div className="formGrid">
            <div className="field">
              <label>Public HTTPS artifact URL</label>
              <input
                value={artifactUrl}
                onChange={(event) => setArtifactUrl(event.target.value)}
                placeholder="https://…"
                required
              />
            </div>
            <div className="field">
              <label>Expected SHA-256 (optional)</label>
              <input
                value={artifactSha}
                onChange={(event) => setArtifactSha(event.target.value)}
                placeholder="64 lowercase hex characters"
              />
            </div>
          </div>
          <div className="actions">
            <button className="button" disabled={!!busy}>
              {busy === "artifact" ? "Capturing…" : "Capture artifact"}
            </button>
          </div>
        </form>
        <Result value={artifactResult} />
      </section>

      <section className="panel section">
        <div className="eyebrow">Trust boundary</div>
        <h2>Adapters verify source-specific facts; GenLayer still judges meaning</h2>
        <p className="muted">
          GitHub adapters verify immutable revision/run metadata from GitHub,
          Ethereum adapters verify transaction/receipt/block/log facts from
          allow-listed RPCs, and the artifact adapter verifies bytes. Those
          deterministic facts can strengthen evidence provenance, while the
          natural-language question of whether they satisfy the frozen rubric
          remains a GenLayer consensus decision.
        </p>
      </section>
    </>
  );
}

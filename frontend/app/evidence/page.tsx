"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchJson } from "@/lib/http";
import { short } from "@/lib/genlayer";

type Step = Record<string, any>;
type Capture = {
  schema: string;
  record: {
    role: string;
    sourceType: string;
    sourceUrl: string;
    contentType: string;
    contentHash: string;
    immutableRefKind: string;
    immutableRef: string;
    author: string;
    rubricRelation: string;
    fetchedAt: number;
    decisionRound: number;
  };
  recordDigest: string;
  capture: {
    byteLength: number;
    hashAlgorithm: string;
    authorBasis: string;
  };
};

type ArchiveResponse = {
  registryContract: string;
  archivedCount: number;
  finalDecisionRound: number;
  records: Array<{
    decisionRound: number;
    role: string;
    digest: string;
    record: Record<string, any>;
  }>;
};

function ts(value: unknown) {
  const n = Number(value ?? 0);
  return n ? new Date(n * 1000).toLocaleString() : "—";
}

function sourceFor(step: Step | null, role: string) {
  if (!step) return "";
  if (role === "PRIMARY") return String(step.evidence_url || "");
  if (role === "SUPPORT") return String(step.support_url || "");
  return String(step.challenge_url || "");
}

export default function EvidenceArchivePage() {
  const [workflowId, setWorkflowId] = useState("");
  const [stepId, setStepId] = useState("");
  const [step, setStep] = useState<Step | null>(null);
  const [archive, setArchive] = useState<ArchiveResponse | null>(null);
  const [captures, setCaptures] = useState<Record<string, Capture>>({});
  const [notice, setNotice] = useState(
    "Load a workflow step to inspect its typed evidence and immutable archive history.",
  );
  const [busy, setBusy] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const workflow = params.get("workflow");
    const stepValue = params.get("step");
    if (workflow) setWorkflowId(workflow);
    if (stepValue) setStepId(stepValue);
  }, []);

  async function load() {
    if (!workflowId.trim() || !stepId.trim()) {
      setNotice("Workflow ID and Step ID are required.");
      return;
    }
    setBusy("load");
    setCaptures({});
    try {
      const [stepData, archiveData] = await Promise.all([
        fetchJson<{ step: Step }>(
          "/api/step?workflow=" +
            encodeURIComponent(workflowId.trim()) +
            "&step=" +
            encodeURIComponent(stepId.trim()),
        ),
        fetchJson<ArchiveResponse>(
          "/api/evidence/archive?workflow=" +
            encodeURIComponent(workflowId.trim()) +
            "&step=" +
            encodeURIComponent(stepId.trim()),
        ),
      ]);
      setStep(stepData.step);
      setArchive(archiveData);
      setNotice(
        "Live step loaded · " +
          String(stepData.step?.status || "UNKNOWN") +
          " · " +
          archiveData.archivedCount +
          " immutable archive record(s).",
      );
    } catch (error: any) {
      setStep(null);
      setArchive(null);
      setNotice(error?.message || "Unable to load evidence history.");
    } finally {
      setBusy("");
    }
  }

  async function capture(role: "PRIMARY" | "SUPPORT" | "CHALLENGE") {
    if (!step) return;
    const url = sourceFor(step, role);
    if (!url) {
      setNotice(role + " evidence URL is not present on-chain.");
      return;
    }
    setBusy(role);
    try {
      const relation =
        (role === "CHALLENGE" ? "Challenges" : "Supports") +
        " the frozen step rubric for " +
        stepId.trim() +
        ": " +
        String(step.rubric || step.requirement || "").slice(0, 420);

      const data = await fetchJson<Capture>("/api/evidence/capture", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          workflowId: workflowId.trim(),
          stepId: stepId.trim(),
          role,
          rubricRelation: relation,
        }),
      });
      setCaptures((current) => ({ ...current, [role]: data }));
      setNotice(
        role +
          " captured · SHA-256 " +
          data.record.contentHash.slice(0, 16) +
          "…",
      );
    } catch (error: any) {
      setNotice(error?.message || role + " capture failed.");
    } finally {
      setBusy("");
    }
  }

  const roles = useMemo(
    () =>
      (["PRIMARY", "SUPPORT", "CHALLENGE"] as const).filter((role) =>
        Boolean(sourceFor(step, role)),
      ),
    [step],
  );

  return (
    <>
      <div className="sectionHead">
        <div>
          <div className="eyebrow">Typed Evidence Archive</div>
          <h1 style={{ fontSize: "56px" }}>
            See what was cited, what bytes are live now, and what was anchored.
          </h1>
          <p className="lede">
            ResolveGraph separates contract-stored evidence references from a
            bounded remote-byte capture and an append-only Studionet archive.
            Each archived record binds source type, MIME type, SHA-256 content
            hash, immutable reference, author field, rubric relation, fetch time,
            workflow, step, decision round and publisher.
          </p>
        </div>
      </div>

      <section className="panel">
        <div className="formGrid">
          <div className="field">
            <label>Workflow ID</label>
            <input
              value={workflowId}
              onChange={(event) => setWorkflowId(event.target.value)}
            />
          </div>
          <div className="field">
            <label>Step ID</label>
            <input
              value={stepId}
              onChange={(event) => setStepId(event.target.value)}
            />
          </div>
        </div>
        <div className="actions">
          <button className="button" onClick={load} disabled={!!busy}>
            Load evidence history
          </button>
        </div>
      </section>

      <div className="status">{notice}</div>

      {step && (
        <>
          <section className="grid3 section">
            {roles.map((role) => {
              const current = captures[role];
              const archived = archive?.records
                .filter((item) => item.role === role)
                .sort((a, b) => b.decisionRound - a.decisionRound)[0];
              const archivedHash = String(
                archived?.record?.content_hash || "",
              ).toLowerCase();
              const currentHash = String(
                current?.record?.contentHash || "",
              ).toLowerCase();
              const matches =
                Boolean(archivedHash && currentHash) &&
                archivedHash === currentHash;

              return (
                <article className="card" key={role}>
                  <div className="eyebrow">{role}</div>
                  <h3>
                    {role === "CHALLENGE"
                      ? "Fresh challenge evidence"
                      : role === "PRIMARY"
                        ? "Primary evidence"
                        : "Independent support"}
                  </h3>
                  <p className="muted">{sourceFor(step, role)}</p>
                  <div className="actions">
                    <button
                      className="button secondary"
                      onClick={() => capture(role)}
                      disabled={!!busy}
                    >
                      {busy === role ? "Capturing…" : "Capture live bytes"}
                    </button>
                  </div>

                  {current ? (
                    <div className="recipeBlock">
                      <strong>Current capture</strong>
                      <span>
                        {current.record.contentType} ·{" "}
                        {current.capture.byteLength.toLocaleString()} bytes
                      </span>
                      <code>{current.record.contentHash}</code>
                      <span>
                        fetched {ts(current.record.fetchedAt)} · author basis{" "}
                        {current.capture.authorBasis}
                      </span>
                    </div>
                  ) : null}

                  {archived ? (
                    <div className="recipeBlock">
                      <strong>
                        Archived round {archived.decisionRound}
                      </strong>
                      <code>{String(archived.digest)}</code>
                      <span>
                        content {short(String(archived.record.content_hash))}
                      </span>
                      <span>
                        publisher {short(String(archived.record.publisher))}
                      </span>
                      {current ? (
                        <span>
                          live bytes vs archive:{" "}
                          {matches ? "MATCH" : "DIFFERENT"}
                        </span>
                      ) : null}
                    </div>
                  ) : (
                    <div className="recipeBlock">
                      <strong>Archive state</strong>
                      <span>No immutable archive record for this role yet.</span>
                    </div>
                  )}
                </article>
              );
            })}
          </section>

          <section className="panel section">
            <div className="eyebrow">Decision lineage</div>
            <h2>Challenge rounds produce distinct archive digests</h2>
            <div className="tableWrap">
              <table className="dataTable">
                <thead>
                  <tr>
                    <th>Round</th>
                    <th>Role</th>
                    <th>Source type</th>
                    <th>Content hash</th>
                    <th>Immutable ref</th>
                    <th>Fetched</th>
                    <th>Archive digest</th>
                  </tr>
                </thead>
                <tbody>
                  {(archive?.records || []).map((item) => (
                    <tr key={item.digest}>
                      <td>{item.decisionRound}</td>
                      <td>{item.role}</td>
                      <td>{String(item.record.source_type || "—")}</td>
                      <td><code>{String(item.record.content_hash || "—")}</code></td>
                      <td>
                        {String(item.record.immutable_ref_kind || "—")}
                        <br />
                        <code>{String(item.record.immutable_ref || "—")}</code>
                      </td>
                      <td>{ts(item.record.fetched_at)}</td>
                      <td><code>{item.digest}</code></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="panel section">
            <div className="eyebrow">Rubric traceability</div>
            <h2>Why each source belongs to the decision</h2>
            {(archive?.records || []).map((item) => (
              <div className="recipeBlock" key={item.digest + "-relation"}>
                <strong>
                  round {item.decisionRound} · {item.role} ·{" "}
                  {String(item.record.author || "author unavailable")}
                </strong>
                <span>{String(item.record.rubric_relation || "—")}</span>
                <a
                  className="textLink"
                  href={String(item.record.source_url || "#")}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open archived source reference ↗
                </a>
              </div>
            ))}
          </section>

          <section className="panel section">
            <div className="eyebrow">Trust boundary</div>
            <h2>Capture is verified differently from archive publication</h2>
            <p className="muted">
              The production capture endpoint performs a bounded public-HTTPS
              fetch with private-network blocking and hashes the returned bytes.
              The Studionet registry makes submitted capture metadata immutable
              and records the publisher, but the registry contract itself does
              not fetch the remote bytes. Reviewers should therefore consider
              the content hash together with publisher identity, source
              immutability and the public source. The next adapter layer adds
              source-specific GitHub and chain verification.
            </p>
          </section>
        </>
      )}
    </>
  );
}

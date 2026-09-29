"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { formatGen, short } from "@/lib/genlayer";
import { fetchJson } from "@/lib/http";

type Workflow = Record<string, any>;
type Step = Record<string, any>;

function ts(value: unknown) {
  const n = Number(value ?? 0);
  return n ? new Date(n * 1000).toLocaleString() : "—";
}

function pct(value: unknown) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? String(n) + "/100" : "—";
}

function evidenceLink(value: unknown) {
  const url = String(value || "");
  if (!url.startsWith("https://")) return <span>—</span>;
  return (
    <a className="textLink" href={url} target="_blank" rel="noreferrer">
      Open source ↗
    </a>
  );
}

export default function WorkflowCaseRoom() {
  const params = useParams<{ id: string }>();
  const workflowId = decodeURIComponent(String(params.id || ""));
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [notice, setNotice] = useState("Loading on-chain workflow…");

  async function load() {
    try {
      const data = await fetchJson<{ workflow: Workflow; steps: Step[] }>(
        "/api/workflow?id=" + encodeURIComponent(workflowId),
      );
      setWorkflow(data.workflow);
      setSteps(data.steps || []);
      setNotice("Live Studionet contract state loaded through the production read API.");
    } catch (error: any) {
      setWorkflow(null);
      setSteps([]);
      setNotice(error?.message || "Unable to load workflow.");
    }
  }

  useEffect(() => {
    if (workflowId) load();
  }, [workflowId]);

  const paid = useMemo(
    () => steps.filter((step) => String(step.status) === "PAID").length,
    [steps],
  );

  return (
    <>
      <div className="sectionHead">
        <div>
          <div className="eyebrow">Workflow Case Room</div>
          <h1 style={{ fontSize: "56px" }}>
            {workflow?.title || workflowId || "Workflow"}
          </h1>
          <p className="lede">{workflow?.objective}</p>
        </div>
        <div className="actions compactActions">
          <button className="button secondary" onClick={load}>Refresh</button>
          <a
            className="button secondary"
            href={"/api/receipt?workflow=" + encodeURIComponent(workflowId)}
            target="_blank"
            rel="noreferrer"
          >
            Workflow receipt
          </a>
        </div>
      </div>

      <div className="status ok">{notice}</div>

      {workflow && (
        <>
          <section className="grid3 section">
            <div className="metric">
              <span>Status</span>
              <strong>{String(workflow.status)}</strong>
              <span>{paid}/{steps.length} steps paid</span>
            </div>
            <div className="metric">
              <span>Sponsor</span>
              <strong style={{ fontSize: "20px" }}>{short(String(workflow.sponsor))}</strong>
              <span>Created {ts(workflow.created_at)}</span>
            </div>
            <div className="metric">
              <span>Policy / decision</span>
              <strong style={{ fontSize: "18px" }}>{String(workflow.policy_version || "—")}</strong>
              <span>{short(String(workflow.decision_hash || ""))}</span>
            </div>
          </section>

          {(workflow.fault_class || workflow.failed_step_id) && (
            <section className="panel section emphasisPanel">
              <div className="eyebrow">Fault attribution</div>
              <h2>{String(workflow.fault_class || "UNDETERMINED")}</h2>
              <div className="grid3">
                <div>
                  <span className="muted">Failed step</span>
                  <h3>{String(workflow.failed_step_id || "—")}</h3>
                </div>
                <div>
                  <span className="muted">Attributed step</span>
                  <h3>{String(workflow.fault_step_id || "—")}</h3>
                </div>
                <div>
                  <span className="muted">Confidence</span>
                  <h3>{pct(workflow.fault_confidence)}</h3>
                </div>
              </div>
              <p className="muted">
                Reason: {String(workflow.fault_reason || "—")} · attribution round{" "}
                {String(workflow.attribution_round ?? 0)}
              </p>
              {workflow.attribution_challenge_url && (
                <p>
                  Challenge evidence: {evidenceLink(workflow.attribution_challenge_url)}
                </p>
              )}
            </section>
          )}

          <section className="section">
            <div className="sectionHead">
              <div>
                <div className="eyebrow">Dependency graph</div>
                <h2>Commitments, evidence and settlement state</h2>
              </div>
            </div>

            <div className="grid2">
              {steps.map((step) => (
                <article className="card stepCard" key={String(step.id)}>
                  <div className="eyebrow">
                    Step {String(Number(step.index ?? 0) + 1)} · {String(step.status)}
                  </div>
                  <h3>{String(step.id)}</h3>
                  <p className="muted">{String(step.requirement)}</p>

                  <div className="flow">
                    {step.dependency_a && <span>depends: {String(step.dependency_a)}</span>}
                    {step.dependency_b && <span>depends: {String(step.dependency_b)}</span>}
                    {!step.dependency_a && !step.dependency_b && <span>root step</span>}
                  </div>

                  <div className="tableWrap section">
                    <table className="dataTable">
                      <tbody>
                        <tr><th>Assignee</th><td>{short(String(step.assignee))}</td></tr>
                        <tr><th>Agent ref</th><td>{String(step.agent_ref || "—")}</td></tr>
                        <tr><th>Reward</th><td>{formatGen(step.reward)}</td></tr>
                        <tr><th>Bond</th><td>{formatGen(step.bond_required)}</td></tr>
                        <tr><th>Verdict</th><td>{String(step.verdict || "—")} · {pct(step.score)} score · {pct(step.confidence)} confidence</td></tr>
                        <tr><th>Failure class</th><td>{String(step.failure_class || "—")} {step.causal_dependency ? "→ " + String(step.causal_dependency) : ""}</td></tr>
                        <tr><th>Resolution round</th><td>{String(step.resolution_round ?? 0)}</td></tr>
                        <tr><th>Decision hash</th><td><code>{String(step.decision_hash || "—")}</code></td></tr>
                      </tbody>
                    </table>
                  </div>

                  {Number(step.resolution_round ?? 0) > 1 && (
                    <div className="decisionDiff">
                      <strong>Decision changed after challenge</strong>
                      <span>
                        Initial {String(step.initial_verdict || "—")} · {pct(step.initial_score)} score · {String(step.initial_failure_class || "—")}
                      </span>
                      <span>
                        Final {String(step.verdict || "—")} · {pct(step.score)} score · {String(step.failure_class || "—")}
                      </span>
                    </div>
                  )}

                  <details className="section">
                    <summary>Evidence & timeline</summary>
                    <div className="tableWrap">
                      <table className="dataTable">
                        <tbody>
                          <tr><th>Primary</th><td>{evidenceLink(step.evidence_url)}</td></tr>
                          <tr><th>Support</th><td>{evidenceLink(step.support_url)}</td></tr>
                          <tr><th>Challenge</th><td>{evidenceLink(step.challenge_url)}</td></tr>
                          <tr><th>Accepted</th><td>{ts(step.accepted_at)}</td></tr>
                          <tr><th>Submitted</th><td>{ts(step.submitted_at)}</td></tr>
                          <tr><th>Resolved</th><td>{ts(step.resolved_at)}</td></tr>
                          <tr><th>Challenged</th><td>{ts(step.challenged_at)}</td></tr>
                          <tr><th>Settled</th><td>{ts(step.settled_at)}</td></tr>
                        </tbody>
                      </table>
                    </div>
                    {step.evidence_snapshot && (
                      <p className="muted"><strong>Primary snapshot:</strong> {String(step.evidence_snapshot)}</p>
                    )}
                    {step.support_snapshot && (
                      <p className="muted"><strong>Support snapshot:</strong> {String(step.support_snapshot)}</p>
                    )}
                    {step.rationale && (
                      <p className="muted"><strong>Rationale:</strong> {String(step.rationale)}</p>
                    )}
                  </details>

                  <div className="actions">
                    <a
                      className="textLink"
                      href={"/api/receipt?workflow=" + encodeURIComponent(workflowId) + "&step=" + encodeURIComponent(String(step.id))}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Machine-readable step receipt →
                    </a>
                    <a
                      className="textLink"
                      href={"/api/evidence?workflow=" + encodeURIComponent(workflowId) + "&step=" + encodeURIComponent(String(step.id))}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Evidence manifest →
                    </a>
                    <a
                      className="textLink"
                      href={"/provenance?workflow=" + encodeURIComponent(workflowId) + "&step=" + encodeURIComponent(String(step.id))}
                    >
                      Verify GitHub provenance →
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </>
  );
}

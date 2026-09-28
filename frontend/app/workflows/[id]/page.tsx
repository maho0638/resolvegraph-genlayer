"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { formatGen, readContract, short } from "@/lib/genlayer";

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

export default function WorkflowCaseRoom() {
  const params = useParams<{ id: string }>();
  const workflowId = decodeURIComponent(String(params.id || ""));
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [notice, setNotice] = useState("Loading on-chain workflow…");

  async function load() {
    try {
      const w: any = await readContract("get_workflow", [workflowId]);
      const count = Number(w?.step_count ?? 0);
      const ids = await Promise.all(
        Array.from({ length: count }, (_, i) =>
          readContract("get_step_id_by_index", [workflowId, i]),
        ),
      );
      const rows = await Promise.all(
        ids.map((id) => readContract("get_step", [workflowId, id])),
      );
      setWorkflow(w);
      setSteps(rows as Step[]);
      setNotice("Live contract state loaded.");
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
        <button className="button secondary" onClick={load}>Refresh</button>
      </div>

      <div className="status">{notice}</div>

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
              <span>Policy</span>
              <strong style={{ fontSize: "18px" }}>{String(workflow.policy_version || "—")}</strong>
              <span>Decision {short(String(workflow.decision_hash || ""))}</span>
            </div>
          </section>

          {(workflow.fault_class || workflow.failed_step_id) && (
            <section className="panel section">
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
                Reason: {String(workflow.fault_reason || "—")} · round{" "}
                {String(workflow.attribution_round ?? 0)}
              </p>
            </section>
          )}

          <section className="section">
            <div className="sectionHead">
              <div>
                <div className="eyebrow">Dependency graph</div>
                <h2>Commitments and settlement state</h2>
              </div>
            </div>

            <div className="grid2">
              {steps.map((step) => (
                <article className="card" key={String(step.id)}>
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

                  <details className="section">
                    <summary>Evidence & timeline</summary>
                    <table className="dataTable">
                      <tbody>
                        <tr><th>Primary</th><td>{String(step.evidence_url || "—")}</td></tr>
                        <tr><th>Support</th><td>{String(step.support_url || "—")}</td></tr>
                        <tr><th>Challenge</th><td>{String(step.challenge_url || "—")}</td></tr>
                        <tr><th>Accepted</th><td>{ts(step.accepted_at)}</td></tr>
                        <tr><th>Submitted</th><td>{ts(step.submitted_at)}</td></tr>
                        <tr><th>Resolved</th><td>{ts(step.resolved_at)}</td></tr>
                        <tr><th>Challenged</th><td>{ts(step.challenged_at)}</td></tr>
                        <tr><th>Settled</th><td>{ts(step.settled_at)}</td></tr>
                      </tbody>
                    </table>
                    <p className="muted">{String(step.rationale || "")}</p>
                  </details>
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </>
  );
}

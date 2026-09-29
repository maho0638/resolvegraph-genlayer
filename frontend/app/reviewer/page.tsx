"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetchJson } from "@/lib/http";
import { formatGen, short } from "@/lib/genlayer";

type ReviewerCase = Record<string, any>;

function pct(value: unknown) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n + "/100" : "—";
}

export default function ReviewerMode() {
  const [workflowId, setWorkflowId] = useState("rg-live-success-v1");
  const [data, setData] = useState<ReviewerCase | null>(null);
  const [notice, setNotice] = useState("Loading canonical proof…");

  async function load(id = workflowId) {
    setNotice("Loading live contract state and pinned transaction proof…");
    setData(null);
    try {
      const result = await fetchJson<ReviewerCase>(
        "/api/reviewer/case?workflow=" + encodeURIComponent(id),
      );
      setData(result);
      setNotice(
        result.terminalStatusMatches
          ? "Live terminal state matches the pinned canonical proof."
          : "Live state does not match the expected canonical terminal state.",
      );
    } catch (error: any) {
      setNotice(error?.message || "Reviewer proof unavailable.");
    }
  }

  useEffect(() => {
    load("rg-live-success-v1");
  }, []);

  const archiveByStep = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const item of data?.evidenceArchive || []) {
      const items = map.get(item.stepId) || [];
      items.push(item);
      map.set(item.stepId, items);
    }
    return map;
  }, [data]);

  return (
    <>
      <div className="sectionHead">
        <div>
          <div className="eyebrow">Reviewer Mode</div>
          <h1 style={{ fontSize: "56px" }}>
            One case. One timeline. Every decision and economic consequence.
          </h1>
          <p className="lede">
            A reviewer needs no wallet. Live contract state, evidence versions,
            challenge deltas, root-cause attribution, rewards, bonds and every
            canonical transaction are presented in one inspectable path.
          </p>
        </div>
      </div>

      <section className="panel">
        <div className="field">
          <label>Canonical case</label>
          <select
            value={workflowId}
            onChange={(event) => {
              setWorkflowId(event.target.value);
              load(event.target.value);
            }}
          >
            <option value="rg-live-success-v1">
              rg-live-success-v1 · COMPLETED
            </option>
            <option value="rg-live-failure-v1">
              rg-live-failure-v1 · FAILED_SETTLED
            </option>
          </select>
        </div>
      </section>

      <div className={data?.terminalStatusMatches ? "status ok" : "status warn"}>
        {notice}
      </div>

      {data ? (
        <>
          <section className="grid3 section">
            <div className="metric">
              <span>Live status</span>
              <strong>{String(data.workflow?.status || "—")}</strong>
              <span>expected {data.expectedTerminalStatus}</span>
            </div>
            <div className="metric">
              <span>Graph</span>
              <strong>{String(data.steps?.length || 0)} steps</strong>
              <span>dependency-aware commitments</span>
            </div>
            <div className="metric">
              <span>Archived evidence</span>
              <strong>{String(data.evidenceArchive?.length || 0)}</strong>
              <span>immutable typed round/role records</span>
            </div>
          </section>

          <section className="panel section">
            <div className="eyebrow">Case summary</div>
            <h2>{data.label}</h2>
            <p className="muted">{data.summary}</p>
            <div className="flow">
              <span>{String(data.workflow?.policy_version || "—")}</span>
              <span>sponsor {short(String(data.workflow?.sponsor || ""))}</span>
              {data.workflow?.fault_class ? (
                <span>
                  final fault {String(data.workflow.fault_class)} ·{" "}
                  {pct(data.workflow.fault_confidence)}
                </span>
              ) : null}
            </div>
          </section>

          <section className="section">
            <div className="sectionHead">
              <div>
                <div className="eyebrow">Dependency + decision graph</div>
                <h2>Step commitments and decision versions</h2>
              </div>
            </div>
            <div className="grid2">
              {(data.steps || []).map((step: any) => {
                const archived = archiveByStep.get(String(step.id)) || [];
                return (
                  <article className="card stepCard" key={String(step.id)}>
                    <div className="eyebrow">
                      {String(step.id)} · {String(step.status)}
                    </div>
                    <h3>{String(step.role_label || "Assigned participant")}</h3>
                    <p className="muted">{String(step.requirement || "")}</p>
                    <div className="flow">
                      {step.dependency_a ? (
                        <span>depends {String(step.dependency_a)}</span>
                      ) : (
                        <span>root</span>
                      )}
                      {step.dependency_b ? (
                        <span>depends {String(step.dependency_b)}</span>
                      ) : null}
                    </div>
                    <div className="tableWrap section">
                      <table className="dataTable">
                        <tbody>
                          <tr>
                            <th>Participant</th>
                            <td>{short(String(step.assignee || ""))}</td>
                          </tr>
                          <tr>
                            <th>Reward / bond</th>
                            <td>
                              {formatGen(step.reward)} /{" "}
                              {formatGen(step.bond_required)}
                            </td>
                          </tr>
                          <tr>
                            <th>Initial</th>
                            <td>
                              {String(step.initial_verdict || "—")} · score{" "}
                              {pct(step.initial_score)} · confidence{" "}
                              {pct(step.initial_confidence)}
                            </td>
                          </tr>
                          <tr>
                            <th>Final</th>
                            <td>
                              {String(step.verdict || "—")} · score{" "}
                              {pct(step.score)} · confidence{" "}
                              {pct(step.confidence)}
                            </td>
                          </tr>
                          <tr>
                            <th>Failure class</th>
                            <td>{String(step.failure_class || "—")}</td>
                          </tr>
                          <tr>
                            <th>Decision hash</th>
                            <td><code>{String(step.decision_hash || "—")}</code></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    {Number(step.resolution_round || 0) > 1 ? (
                      <div className="decisionDiff">
                        <strong>Challenge changed the decision version</strong>
                        <span>
                          round 1 {String(step.initial_verdict || "—")} → round{" "}
                          {String(step.resolution_round)}{" "}
                          {String(step.verdict || "—")}
                        </span>
                      </div>
                    ) : null}
                    <div className="recipeBlock">
                      <strong>Evidence archive</strong>
                      <span>
                        {archived.length
                          ? archived
                              .map(
                                (item) =>
                                  "r" +
                                  item.round +
                                  " " +
                                  item.role +
                                  " " +
                                  String(item.digest).slice(0, 12) +
                                  "…",
                              )
                              .join(" · ")
                          : "No separately archived records for this canonical step."}
                      </span>
                    </div>
                    <div className="actions">
                      <Link
                        className="textLink"
                        href={
                          "/evidence?workflow=" +
                          encodeURIComponent(workflowId) +
                          "&step=" +
                          encodeURIComponent(String(step.id))
                        }
                      >
                        Evidence detail →
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          {data.workflow?.fault_class ? (
            <section className="panel section emphasisPanel">
              <div className="eyebrow">Root-cause attribution</div>
              <h2>
                {String(data.workflow.fault_class)}{" "}
                {data.workflow.fault_step_id
                  ? "· " + String(data.workflow.fault_step_id)
                  : ""}
              </h2>
              <p className="muted">
                {String(data.workflow.fault_reason || "")} · confidence{" "}
                {pct(data.workflow.fault_confidence)} · attribution round{" "}
                {String(data.workflow.attribution_round || 0)}
              </p>
              {Number(data.workflow.attribution_round || 0) > 1 ? (
                <div className="decisionDiff">
                  <strong>Attribution changed after challenge</strong>
                  <span>
                    The canonical proof records the initial PARTICIPANT / api-proof /
                    97% attribution and the final EXTERNAL result before settlement.
                  </span>
                </div>
              ) : null}
            </section>
          ) : null}

          <section className="panel section">
            <div className="sectionHead">
              <div>
                <div className="eyebrow">Transaction + economic timeline</div>
                <h2>Every canonical state transition links to Studionet Explorer</h2>
              </div>
            </div>
            <div className="tableWrap">
              <table className="dataTable">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Phase</th>
                    <th>Method</th>
                    <th>Step</th>
                    <th>Economic / state effect</th>
                    <th>Transaction</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.transactionTimeline || []).map((tx: any) => (
                    <tr key={tx.hash}>
                      <td>{tx.order}</td>
                      <td>{tx.phase}</td>
                      <td><code>{tx.method}</code></td>
                      <td>{tx.stepId || "workflow"}</td>
                      <td>{tx.effect}</td>
                      <td>
                        <a
                          className="textLink"
                          href={tx.explorerUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {short(tx.hash)} ↗
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="panel section">
            <div className="eyebrow">Machine-readable reviewer proof</div>
            <div className="actions">
              <a
                className="button secondary"
                href={
                  "/api/reviewer/case?workflow=" +
                  encodeURIComponent(workflowId)
                }
                target="_blank"
                rel="noreferrer"
              >
                Reviewer case JSON
              </a>
              <a
                className="button secondary"
                href={
                  "/api/receipt?workflow=" + encodeURIComponent(workflowId)
                }
                target="_blank"
                rel="noreferrer"
              >
                Settlement receipt JSON
              </a>
            </div>
          </section>
        </>
      ) : null}
    </>
  );
}

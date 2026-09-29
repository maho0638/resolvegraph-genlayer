"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatGen, short } from "@/lib/genlayer";
import { fetchJson } from "@/lib/http";

type Workflow = {
  id?: string;
  sponsor?: string;
  title?: string;
  objective?: string;
  status?: string;
  step_count?: unknown;
  fault_step_id?: string;
  fault_class?: string;
  fault_confidence?: unknown;
  decision_hash?: string;
  policy_version?: string;
};

type Step = {
  id?: string;
  assignee?: string;
  role_label?: string;
  agent_ref?: string;
  requirement?: string;
  reward?: unknown;
  bond_required?: unknown;
  status?: string;
  verdict?: string;
  score?: unknown;
  confidence?: unknown;
  decision_hash?: string;
};

export default function Explorer() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selected, setSelected] = useState<Workflow | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [state, setState] = useState("Loading live contract state…");
  const [query, setQuery] = useState("");

  async function load() {
    setState("Loading live contract state…");
    try {
      const data = await fetchJson<{ workflows: Workflow[] }>("/api/workflows");
      setWorkflows(data.workflows || []);
      setState("Live Studionet state loaded.");
    } catch (error: any) {
      setWorkflows([]);
      setState(error?.message || "Unable to read workflows.");
    }
  }

  async function open(workflow: Workflow) {
    if (!workflow.id) return;
    setSelected(workflow);
    setSteps([]);
    try {
      const data = await fetchJson<{ workflow: Workflow; steps: Step[] }>(
        "/api/workflow?id=" + encodeURIComponent(workflow.id),
      );
      setSelected(data.workflow);
      setSteps(data.steps || []);
    } catch (error: any) {
      setState(error?.message || "Unable to load workflow details.");
      setSteps([]);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return workflows;
    return workflows.filter((workflow) =>
      [
        workflow.id,
        workflow.title,
        workflow.objective,
        workflow.status,
        workflow.fault_class,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle)),
    );
  }, [workflows, query]);

  return (
    <>
      <div className="sectionHead">
        <div>
          <div className="eyebrow">Public Explorer</div>
          <h1 style={{ fontSize: "56px" }}>
            Audit the workflow graph directly from contract state.
          </h1>
          <p className="lede">
            No wallet is required. Read workflow state, participant economics,
            consensus outcomes and decision hashes through the production read API.
          </p>
        </div>
        <button className="button secondary" onClick={load}>
          Refresh
        </button>
      </div>

      <div className="status ok">{state}</div>

      <section className="panel section">
        <div className="field">
          <label>Search workflow, status or fault class</label>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="rg-live-success-v1, COMPLETED, EXTERNAL…"
          />
        </div>
        <div className="tableWrap section">
          <table className="dataTable">
            <thead>
              <tr>
                <th>ID</th>
                <th>Status</th>
                <th>Sponsor</th>
                <th>Steps</th>
                <th>Fault</th>
                <th>Case</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((workflow) => (
                <tr key={workflow.id}>
                  <td onClick={() => open(workflow)} style={{ cursor: "pointer" }}>
                    <strong>{workflow.id}</strong>
                    <br />
                    <span className="muted">{workflow.title}</span>
                  </td>
                  <td><span className="pill">{workflow.status}</span></td>
                  <td>{short(workflow.sponsor)}</td>
                  <td>{String(workflow.step_count ?? 0)}</td>
                  <td>
                    {workflow.fault_class || "—"}
                    {workflow.fault_step_id ? " · " + workflow.fault_step_id : ""}
                  </td>
                  <td>
                    {workflow.id ? (
                      <Link className="textLink" href={"/workflows/" + encodeURIComponent(workflow.id)}>
                        Open case →
                      </Link>
                    ) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {selected && (
        <section className="panel section">
          <div className="sectionHead">
            <div>
              <div className="eyebrow">Selected workflow</div>
              <h2>{selected.title || selected.id}</h2>
              <p className="muted">{selected.objective}</p>
            </div>
            {selected.id && (
              <Link className="button secondary" href={"/workflows/" + encodeURIComponent(selected.id)}>
                Full case room
              </Link>
            )}
          </div>

          <div className="flow">
            <span>{selected.status}</span>
            <span>{selected.policy_version || "policy —"}</span>
            <span>decision {short(selected.decision_hash)}</span>
          </div>

          <div className="tableWrap section">
            <table className="dataTable">
              <thead>
                <tr>
                  <th>Step</th>
                  <th>Participant</th>
                  <th>Economics</th>
                  <th>Consensus</th>
                  <th>Receipt</th>
                </tr>
              </thead>
              <tbody>
                {steps.map((step) => (
                  <tr key={step.id}>
                    <td>
                      <strong>{step.id}</strong>
                      <br />
                      <span className="muted">{step.role_label}</span>
                    </td>
                    <td>
                      {short(step.assignee)}
                      <br />
                      <span className="muted">{step.agent_ref || "No agent ref"}</span>
                    </td>
                    <td>
                      {formatGen(step.reward)} reward
                      <br />
                      <span className="muted">{formatGen(step.bond_required)} bond</span>
                    </td>
                    <td>
                      {step.status}
                      <br />
                      <span className="muted">
                        {(step.verdict || "—") +
                          " · score " +
                          String(step.score ?? 0) +
                          " · confidence " +
                          String(step.confidence ?? 0)}
                      </span>
                    </td>
                    <td>
                      {selected.id && step.id ? (
                        <a
                          className="textLink"
                          href={"/api/receipt?workflow=" + encodeURIComponent(selected.id) + "&step=" + encodeURIComponent(step.id)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          JSON →
                        </a>
                      ) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}

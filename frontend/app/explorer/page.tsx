"use client";

import { useEffect, useState } from "react";
import {
  formatGen,
  isContractConfigured,
  readContract,
  short,
} from "@/lib/genlayer";

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
  const [state, setState] = useState("idle");

  async function load() {
    if (!isContractConfigured()) {
      setState("Contract address is not configured yet.");
      return;
    }

    setState("loading");
    try {
      const count = Number(await readContract("get_workflow_count"));
      const ids = await Promise.all(
        Array.from({ length: count }, (_, i) =>
          readContract("get_workflow_id_by_index", [i]),
        ),
      );
      const rows = await Promise.all(
        ids.map((id) => readContract("get_workflow", [id]) as Promise<Workflow>),
      );
      setWorkflows(rows);
      setState("live");
    } catch (error: any) {
      setState(error?.message || "Unable to read workflows.");
    }
  }

  async function open(workflow: Workflow) {
    setSelected(workflow);
    setSteps([]);

    try {
      const count = Number(workflow.step_count ?? 0);
      const ids = await Promise.all(
        Array.from({ length: count }, (_, i) =>
          readContract("get_step_id_by_index", [workflow.id, i]),
        ),
      );
      const rows = await Promise.all(
        ids.map(
          (id) =>
            readContract("get_step", [workflow.id, id]) as Promise<Step>,
        ),
      );
      setSteps(rows);
    } catch {
      setSteps([]);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <>
      <div className="sectionHead">
        <div>
          <div className="eyebrow">Public Explorer</div>
          <h1 style={{ fontSize: "56px" }}>
            Read the workflow graph directly from contract state.
          </h1>
        </div>
        <button className="button secondary" onClick={load}>
          Refresh
        </button>
      </div>

      <div className="status">
        {state === "live"
          ? String(workflows.length) + " workflow(s) loaded"
          : state}
      </div>

      <section className="panel section">
        <table className="dataTable">
          <thead>
            <tr>
              <th>ID</th>
              <th>Status</th>
              <th>Sponsor</th>
              <th>Steps</th>
              <th>Fault</th>
            </tr>
          </thead>
          <tbody>
            {workflows.map((workflow) => (
              <tr
                key={workflow.id}
                onClick={() => open(workflow)}
                style={{ cursor: "pointer" }}
              >
                <td>
                  <strong>{workflow.id}</strong>
                  <br />
                  <span className="muted">{workflow.title}</span>
                </td>
                <td>{workflow.status}</td>
                <td>{short(workflow.sponsor)}</td>
                <td>{String(workflow.step_count ?? 0)}</td>
                <td>
                  {workflow.fault_class || "—"}
                  {workflow.fault_step_id
                    ? " · " + workflow.fault_step_id
                    : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {selected && (
        <section className="panel section">
          <div className="eyebrow">Selected workflow</div>
          <h2>{selected.title || selected.id}</h2>
          <p className="muted">{selected.objective}</p>
          <p>
            <span className="pill">{selected.status}</span>{" "}
            <span className="pill">{selected.policy_version}</span>
          </p>

          <table className="dataTable">
            <thead>
              <tr>
                <th>Step</th>
                <th>Participant</th>
                <th>Economics</th>
                <th>Consensus</th>
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
                    <span className="muted">
                      {step.agent_ref || "No agent ref"}
                    </span>
                  </td>
                  <td>
                    {formatGen(step.reward)} reward
                    <br />
                    <span className="muted">
                      {formatGen(step.bond_required)} bond
                    </span>
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
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </>
  );
}

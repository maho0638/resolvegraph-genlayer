"use client";

import { FormEvent, useState } from "react";
import { formatGen, readContract, sendWrite, short, walletClient } from "@/lib/genlayer";

export default function Operate() {
  const [account, setAccount] = useState("");
  const [notice, setNotice] = useState(
    "Choose an action. Writes finalize before the UI reports success.",
  );
  const [busy, setBusy] = useState("");
  const [workflowId, setWorkflowId] = useState("");
  const [stepId, setStepId] = useState("");
  const [loadedStep, setLoadedStep] = useState<any>(null);
  const [primary, setPrimary] = useState("");
  const [support, setSupport] = useState("");
  const [challengeUrl, setChallengeUrl] = useState("");
  const [note, setNote] = useState("");

  async function connect() {
    try {
      const wallet = await walletClient();
      setAccount(wallet.account);
      setNotice("Connected " + short(wallet.account));
    } catch (error: any) {
      setNotice(error?.message || "Connection failed");
    }
  }

  async function loadStep() {
    if (!workflowId.trim() || !stepId.trim()) {
      setNotice("Workflow ID and Step ID are required.");
      return;
    }
    setBusy("load");
    try {
      const step = await readContract("get_step", [
        workflowId.trim(),
        stepId.trim(),
      ]);
      setLoadedStep(step);
      setNotice(
        "Step loaded · exact bond " + formatGen(step?.bond_required ?? 0),
      );
    } catch (error: any) {
      setLoadedStep(null);
      setNotice(error?.message || "Unable to load step.");
    } finally {
      setBusy("");
    }
  }

  async function acceptExactBond() {
    if (!loadedStep) {
      setNotice("Load the step first so the exact on-chain bond is used.");
      return;
    }
    const bond = BigInt(String(loadedStep.bond_required ?? 0));
    if (bond <= 0n) {
      setNotice("Loaded step does not expose a valid bond.");
      return;
    }
    return act("accept_step", [workflowId, stepId], bond);
  }

  async function act(name: string, args: unknown[], value?: bigint) {
    setBusy(name);
    try {
      const hash = await sendWrite({ functionName: name, args, value });
      setNotice(name + " finalized · " + short(hash));
    } catch (error: any) {
      setNotice(error?.message || name + " failed");
    } finally {
      setBusy("");
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    return act("submit_evidence", [workflowId, stepId, primary, support]);
  }

  return (
    <>
      <div className="sectionHead">
        <div>
          <div className="eyebrow">Operator Console</div>
          <h1 style={{ fontSize: "56px" }}>
            Run every lifecycle action without a custom script.
          </h1>
        </div>
      </div>

      <div className="actions">
        <button className="button secondary" onClick={connect}>
          {account ? "Wallet " + short(account) : "Connect wallet"}
        </button>
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
          <div className="field">
            <label>Exact on-chain participant bond</label>
            <input
              value={loadedStep ? formatGen(loadedStep.bond_required ?? 0) : "Load step first"}
              readOnly
            />
          </div>
          <div className="field">
            <label>Challenge URL</label>
            <input
              value={challengeUrl}
              onChange={(e) => setChallengeUrl(e.target.value)}
            />
          </div>
          <div className="field full">
            <label>Challenge note</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>

        <div className="actions">
          <button
            className="button secondary"
            onClick={loadStep}
            disabled={!!busy}
          >
            Load step
          </button>
          <button
            className="button"
            onClick={acceptExactBond}
            disabled={!!busy || !loadedStep}
          >
            Accept + exact bond
          </button>
          <button
            className="button secondary"
            onClick={() => act("resolve_step", [workflowId, stepId])}
            disabled={!!busy}
          >
            Resolve step
          </button>
          <button
            className="button secondary"
            onClick={() => act("settle_passed_step", [workflowId, stepId])}
            disabled={!!busy}
          >
            Settle PASS
          </button>
          <button
            className="button secondary"
            onClick={() => act("attribute_failure", [workflowId, stepId])}
            disabled={!!busy}
          >
            Attribute failure
          </button>
          <button
            className="button secondary"
            onClick={() => act("mark_missed_deadline", [workflowId, stepId])}
            disabled={!!busy}
          >
            Mark expired commitment
          </button>
          <button
            className="button secondary"
            onClick={() => act("complete_workflow", [workflowId])}
            disabled={!!busy}
          >
            Complete workflow
          </button>
          <button
            className="button secondary"
            onClick={() => act("cancel_draft_workflow", [workflowId])}
            disabled={!!busy}
          >
            Cancel draft
          </button>
        </div>
      </section>

      <form className="panel section" onSubmit={submit}>
        <h2>Submit evidence</h2>
        <div className="formGrid">
          <div className="field">
            <label>Primary deliverable URL</label>
            <input
              value={primary}
              onChange={(e) => setPrimary(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label>Independent support URL</label>
            <input
              value={support}
              onChange={(e) => setSupport(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="actions">
          <button className="button" disabled={!!busy}>
            Submit evidence
          </button>
        </div>
      </form>

      <section className="grid2 section">
        <div className="panel">
          <h2>Step challenge</h2>
          <p className="muted">
            A fresh third-domain source triggers a complete step re-evaluation.
          </p>
          <div className="actions">
            <button
              className="button"
              onClick={() =>
                act("challenge_step", [
                  workflowId,
                  stepId,
                  challengeUrl,
                  note,
                ])
              }
              disabled={!!busy}
            >
              Challenge step
            </button>
            <button
              className="button secondary"
              onClick={() =>
                act("resolve_step_challenge", [workflowId, stepId])
              }
              disabled={!!busy}
            >
              Resolve challenge
            </button>
          </div>
        </div>

        <div className="panel">
          <h2>Fault-attribution challenge</h2>
          <p className="muted">
            Workflow participants can introduce fresh evidence before bond
            slashing or refund.
          </p>
          <div className="actions">
            <button
              className="button"
              onClick={() =>
                act("challenge_attribution", [
                  workflowId,
                  challengeUrl,
                  note,
                ])
              }
              disabled={!!busy}
            >
              Challenge attribution
            </button>
            <button
              className="button secondary"
              onClick={() =>
                act("resolve_attribution_challenge", [workflowId])
              }
              disabled={!!busy}
            >
              Re-attribute
            </button>
            <button
              className="button secondary"
              onClick={() => act("settle_failed_workflow", [workflowId])}
              disabled={!!busy}
            >
              Settle failed workflow
            </button>
          </div>
        </div>
      </section>
    </>
  );
}

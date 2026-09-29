"use client";

import { FormEvent, useState } from "react";
import { formatGen, sendWrite, short, walletClient } from "@/lib/genlayer";
import { fetchJson } from "@/lib/http";

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

  const hasIds = Boolean(workflowId.trim() && stepId.trim());
  const challengeReady =
    hasIds &&
    challengeUrl.trim().startsWith("https://") &&
    note.trim().length >= 20;

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
    if (!hasIds) {
      setNotice("Workflow ID and Step ID are required.");
      return;
    }
    setBusy("load");
    try {
      const data = await fetchJson<{ step: any }>(
        "/api/step?workflow=" +
          encodeURIComponent(workflowId.trim()) +
          "&step=" +
          encodeURIComponent(stepId.trim()),
      );
      setLoadedStep(data.step);
      setNotice(
        "Live step loaded · " + String(data.step?.status || "UNKNOWN") +
        " · exact bond " + formatGen(data.step?.bond_required ?? 0),
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
    return act("accept_step", [workflowId.trim(), stepId.trim()], bond);
  }

  async function act(name: string, args: unknown[], value?: bigint) {
    setBusy(name);
    try {
      const hash = await sendWrite({ functionName: name, args, value });
      setNotice(name + " finalized · " + short(hash));
      if (hasIds) await loadStep();
    } catch (error: any) {
      setNotice(error?.message || name + " failed");
    } finally {
      setBusy("");
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!hasIds) {
      setNotice("Workflow ID and Step ID are required.");
      return;
    }
    return act("submit_evidence", [
      workflowId.trim(),
      stepId.trim(),
      primary.trim(),
      support.trim(),
    ]);
  }

  return (
    <>
      <div className="sectionHead">
        <div>
          <div className="eyebrow">Operator Console</div>
          <h1 style={{ fontSize: "56px" }}>
            Run the lifecycle without a custom script.
          </h1>
          <p className="lede">
            Public reads use the production server API. State-changing actions
            require an EIP-1193 wallet and wait for finalized GenLayer receipts.
          </p>
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
              onChange={(e) => {
                setWorkflowId(e.target.value);
                setLoadedStep(null);
              }}
            />
          </div>
          <div className="field">
            <label>Step ID</label>
            <input
              value={stepId}
              onChange={(e) => {
                setStepId(e.target.value);
                setLoadedStep(null);
              }}
            />
          </div>
          <div className="field">
            <label>Exact on-chain participant bond</label>
            <input
              value={loadedStep ? formatGen(loadedStep.bond_required ?? 0) : "Load step first"}
              readOnly
            />
          </div>
          <div className="field">
            <label>Loaded status</label>
            <input value={loadedStep ? String(loadedStep.status || "—") : "—"} readOnly />
          </div>
        </div>

        <div className="actions">
          <button className="button secondary" onClick={loadStep} disabled={!!busy || !hasIds}>
            Load live step
          </button>
          <button className="button" onClick={acceptExactBond} disabled={!!busy || !loadedStep}>
            Accept + exact bond
          </button>
          <button className="button secondary" onClick={() => act("resolve_step", [workflowId.trim(), stepId.trim()])} disabled={!!busy || !hasIds}>
            Resolve step
          </button>
          <button className="button secondary" onClick={() => act("settle_passed_step", [workflowId.trim(), stepId.trim()])} disabled={!!busy || !hasIds}>
            Settle PASS
          </button>
          <button className="button secondary" onClick={() => act("attribute_failure", [workflowId.trim(), stepId.trim()])} disabled={!!busy || !hasIds}>
            Attribute failure
          </button>
          <button className="button secondary" onClick={() => act("mark_missed_deadline", [workflowId.trim(), stepId.trim()])} disabled={!!busy || !hasIds}>
            Mark expired commitment
          </button>
          <button className="button secondary" onClick={() => act("complete_workflow", [workflowId.trim()])} disabled={!!busy || !workflowId.trim()}>
            Complete workflow
          </button>
          <button className="button secondary" onClick={() => act("cancel_draft_workflow", [workflowId.trim()])} disabled={!!busy || !workflowId.trim()}>
            Cancel draft
          </button>
        </div>
      </section>

      <form className="panel section" onSubmit={submit}>
        <h2>Submit evidence</h2>
        <p className="muted">
          Primary and support evidence must be HTTPS sources on independent domains.
        </p>
        <div className="formGrid">
          <div className="field">
            <label>Primary deliverable URL</label>
            <input value={primary} onChange={(e) => setPrimary(e.target.value)} placeholder="https://…" required />
          </div>
          <div className="field">
            <label>Independent support URL</label>
            <input value={support} onChange={(e) => setSupport(e.target.value)} placeholder="https://…" required />
          </div>
        </div>
        <div className="actions">
          <button className="button" disabled={!!busy || !hasIds}>
            Submit evidence
          </button>
        </div>
      </form>

      <section className="grid2 section">
        <div className="panel">
          <h2>Step challenge</h2>
          <p className="muted">
            A fresh third-domain source plus a 20+ character note triggers a complete re-evaluation.
          </p>
          <div className="field">
            <label>Fresh challenge URL</label>
            <input value={challengeUrl} onChange={(e) => setChallengeUrl(e.target.value)} placeholder="https://…" />
          </div>
          <div className="field section">
            <label>Challenge note</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <div className="actions">
            <button className="button" onClick={() => act("challenge_step", [workflowId.trim(), stepId.trim(), challengeUrl.trim(), note.trim()])} disabled={!!busy || !challengeReady}>
              Challenge step
            </button>
            <button className="button secondary" onClick={() => act("resolve_step_challenge", [workflowId.trim(), stepId.trim()])} disabled={!!busy || !hasIds}>
              Resolve challenge
            </button>
          </div>
        </div>

        <div className="panel">
          <h2>Fault-attribution challenge</h2>
          <p className="muted">
            Workflow participants can introduce fresh evidence before bond slashing or refund.
          </p>
          <div className="actions">
            <button className="button" onClick={() => act("challenge_attribution", [workflowId.trim(), challengeUrl.trim(), note.trim()])} disabled={!!busy || !workflowId.trim() || !challengeReady}>
              Challenge attribution
            </button>
            <button className="button secondary" onClick={() => act("resolve_attribution_challenge", [workflowId.trim()])} disabled={!!busy || !workflowId.trim()}>
              Re-attribute
            </button>
            <button className="button secondary" onClick={() => act("settle_failed_workflow", [workflowId.trim()])} disabled={!!busy || !workflowId.trim()}>
              Settle failed workflow
            </button>
          </div>
        </div>
      </section>
    </>
  );
}

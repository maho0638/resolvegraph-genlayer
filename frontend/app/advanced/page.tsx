"use client";

import { FormEvent, useState } from "react";
import {
  formatGen,
  parseGen,
  readContractV3,
  sendWriteV3,
  short,
  v3ContractAddress,
  walletClient,
} from "@/lib/genlayer";
import { WORKFLOW_RECIPES, recipeLabel } from "@/lib/recipes";

function nowPlus(hours: number) {
  const d = new Date(Date.now() + hours * 3600_000);
  return d.toISOString().slice(0, 16);
}

export default function AdvancedV3() {
  const [account, setAccount] = useState("");
  const [notice, setNotice] = useState(
    "V3 keeps the proven workflow model but adds bounded bonded appeals and explicit decision finality.",
  );
  const [busy, setBusy] = useState("");

  const [workflowId, setWorkflowId] = useState("");
  const [title, setTitle] = useState("");
  const [objective, setObjective] = useState("");
  const [stepId, setStepId] = useState("");
  const [assignee, setAssignee] = useState("");
  const [roleLabel, setRoleLabel] = useState("Worker Agent");
  const [agentRef, setAgentRef] = useState("");
  const [a2a, setA2a] = useState("");
  const [requirement, setRequirement] = useState("");
  const [rubric, setRubric] = useState("");
  const [depA, setDepA] = useState("");
  const [depB, setDepB] = useState("");
  const [reward, setReward] = useState("0.001");
  const [deadline, setDeadline] = useState(nowPlus(24));
  const [recipeId, setRecipeId] = useState("");
  const [loadedStep, setLoadedStep] = useState<any>(null);
  const [appealBond, setAppealBond] = useState<bigint>(0n);
  const [primary, setPrimary] = useState("");
  const [support, setSupport] = useState("");
  const [challengeUrl, setChallengeUrl] = useState("");
  const [note, setNote] = useState("");

  const hasIds = Boolean(workflowId.trim() && stepId.trim());

  function applyRecipe(id: string) {
    setRecipeId(id);
    const recipe = WORKFLOW_RECIPES.find((item) => item.id === id);
    if (!recipe) return;
    setRoleLabel(recipe.roleLabel);
    setRequirement(recipe.requirement);
    setRubric(recipe.rubric);
    setNotice(
      "Starter applied · " +
        recipeLabel(recipe) +
        ". These fields remain editable until the V3 step is funded.",
    );
  }

  async function connect() {
    try {
      const wallet = await walletClient();
      setAccount(wallet.account);
      setNotice("Connected " + short(wallet.account));
    } catch (error: any) {
      setNotice(error?.message || "Wallet connection failed.");
    }
  }

  async function act(
    functionName: string,
    args: unknown[],
    value?: bigint,
    reload = true,
  ) {
    setBusy(functionName);
    try {
      const hash = await sendWriteV3({ functionName, args, value });
      setNotice(functionName + " finalized · " + short(hash));
      if (reload && hasIds) await loadStep(false);
      return hash;
    } catch (error: any) {
      setNotice(error?.message || functionName + " failed.");
      return "";
    } finally {
      setBusy("");
    }
  }

  async function create(event: FormEvent) {
    event.preventDefault();
    await act(
      "create_workflow",
      [workflowId.trim(), title.trim(), objective.trim()],
      undefined,
      false,
    );
  }

  async function addStep(event: FormEvent) {
    event.preventDefault();
    const deadlineUnix = Math.floor(new Date(deadline).getTime() / 1000);
    if (!deadlineUnix) {
      setNotice("Choose a valid deadline.");
      return;
    }
    await act(
      "add_step",
      [
        workflowId.trim(),
        stepId.trim(),
        assignee.trim(),
        roleLabel.trim(),
        agentRef.trim(),
        a2a.trim(),
        requirement.trim(),
        rubric.trim(),
        depA.trim(),
        depB.trim(),
        deadlineUnix,
      ],
      parseGen(reward),
      false,
    );
  }

  async function loadStep(showNotice = true) {
    if (!hasIds) {
      if (showNotice) setNotice("Workflow ID and Step ID are required.");
      return;
    }
    setBusy("load");
    try {
      const [step, bond] = await Promise.all([
        readContractV3("get_step", [workflowId.trim(), stepId.trim()]),
        readContractV3("get_step_appeal_bond", [
          workflowId.trim(),
          stepId.trim(),
        ]),
      ]);
      setLoadedStep(step);
      setAppealBond(BigInt(String(bond ?? 0)));
      if (showNotice) {
        setNotice(
          "V3 step loaded · " +
            String(step?.status || "UNKNOWN") +
            " · participant bond " +
            formatGen(step?.bond_required ?? 0) +
            " · appeal bond " +
            formatGen(bond ?? 0),
        );
      }
    } catch (error: any) {
      setLoadedStep(null);
      setAppealBond(0n);
      if (showNotice) setNotice(error?.message || "Unable to load V3 step.");
    } finally {
      setBusy("");
    }
  }

  async function acceptStep() {
    if (!loadedStep) {
      setNotice("Load the V3 step first.");
      return;
    }
    const bond = BigInt(String(loadedStep.bond_required ?? 0));
    if (bond <= 0n) {
      setNotice("Loaded step does not expose a valid participant bond.");
      return;
    }
    await act("accept_step", [workflowId.trim(), stepId.trim()], bond);
  }

  async function submitEvidence(event: FormEvent) {
    event.preventDefault();
    await act("submit_evidence", [
      workflowId.trim(),
      stepId.trim(),
      primary.trim(),
      support.trim(),
    ]);
  }

  async function challengeStep() {
    if (appealBond <= 0n) {
      setNotice("Load the step first so the exact V3 appeal bond is used.");
      return;
    }
    await act(
      "challenge_step",
      [workflowId.trim(), stepId.trim(), challengeUrl.trim(), note.trim()],
      appealBond,
    );
  }

  async function challengeAttribution() {
    if (!workflowId.trim()) {
      setNotice("Workflow ID is required.");
      return;
    }
    setBusy("challenge_attribution");
    try {
      const bond = BigInt(
        String(
          await readContractV3("get_attribution_appeal_bond", [
            workflowId.trim(),
          ]),
        ),
      );
      const hash = await sendWriteV3({
        functionName: "challenge_attribution",
        args: [workflowId.trim(), challengeUrl.trim(), note.trim()],
        value: bond,
      });
      setNotice(
        "challenge_attribution finalized · " +
          short(hash) +
          " · exact bond " +
          formatGen(bond),
      );
    } catch (error: any) {
      setNotice(error?.message || "Attribution challenge failed.");
    } finally {
      setBusy("");
    }
  }

  return (
    <>
      <div className="sectionHead">
        <div>
          <div className="eyebrow">Advanced V3 Workbench</div>
          <h1 style={{ fontSize: "56px" }}>
            Build, appeal and finalize a workflow from one product surface.
          </h1>
          <p className="lede">
            This workbench targets the separately source-matched V3 Studionet
            contract. It adds exact appeal bonds and explicit decision finality
            without replacing the canonical V1 proof path.
          </p>
        </div>
      </div>

      <section className="panel emphasisPanel">
        <div className="proofFacts">
          <p><strong>Policy</strong><code>RG_V3_BOUNDED_APPEALS</code></p>
          <p><strong>Verified contract</strong><code>{v3ContractAddress()}</code></p>
          <p><strong>Step appeal</strong><code>1 maximum · exact reward ÷ 20 bond</code></p>
          <p><strong>Finality</strong><code>explicit finalization before settlement</code></p>
        </div>
      </section>

      <div className="actions">
        <button className="button secondary" onClick={connect}>
          {account ? "Wallet " + short(account) : "Connect wallet"}
        </button>
      </div>
      <div className="status">{notice}</div>

      <section className="panel section">
        <div className="eyebrow">Policy starter</div>
        <h2>Draft the commitment before funding it</h2>
        <p className="muted">
          Starter recipes prefill the human-readable policy. The exact
          requirement and rubric supplied to the funded V3 step are frozen
          on-chain.
        </p>
        <div className="field">
          <label>Starter recipe</label>
          <select value={recipeId} onChange={(e) => applyRecipe(e.target.value)}>
            <option value="">Choose a recipe…</option>
            {WORKFLOW_RECIPES.map((recipe) => (
              <option key={recipe.id} value={recipe.id}>
                {recipeLabel(recipe)}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="grid2 section">
        <form className="panel" onSubmit={create}>
          <h2>1. Create V3 workflow</h2>
          <div className="formGrid">
            <div className="field">
              <label>Workflow ID</label>
              <input value={workflowId} onChange={(e) => setWorkflowId(e.target.value)} required />
            </div>
            <div className="field">
              <label>Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="field full">
              <label>Objective</label>
              <textarea value={objective} onChange={(e) => setObjective(e.target.value)} minLength={30} required />
            </div>
          </div>
          <div className="actions">
            <button className="button" disabled={!!busy}>
              {busy === "create_workflow" ? "Creating…" : "Create V3 workflow"}
            </button>
          </div>
        </form>

        <form className="panel" onSubmit={addStep}>
          <h2>2. Add funded commitment</h2>
          <div className="formGrid">
            <div className="field"><label>Step ID</label><input value={stepId} onChange={(e) => { setStepId(e.target.value); setLoadedStep(null); }} required /></div>
            <div className="field"><label>Assignee wallet</label><input value={assignee} onChange={(e) => setAssignee(e.target.value)} required /></div>
            <div className="field"><label>Role</label><input value={roleLabel} onChange={(e) => setRoleLabel(e.target.value)} /></div>
            <div className="field"><label>Reward (GEN)</label><input value={reward} onChange={(e) => setReward(e.target.value)} required /></div>
            <div className="field"><label>Dependency A</label><input value={depA} onChange={(e) => setDepA(e.target.value)} /></div>
            <div className="field"><label>Dependency B</label><input value={depB} onChange={(e) => setDepB(e.target.value)} /></div>
            <div className="field full"><label>Agent reference</label><input value={agentRef} onChange={(e) => setAgentRef(e.target.value)} /></div>
            <div className="field full"><label>A2A endpoint</label><input value={a2a} onChange={(e) => setA2a(e.target.value)} placeholder="https://…" /></div>
            <div className="field full"><label>Commitment</label><textarea value={requirement} onChange={(e) => setRequirement(e.target.value)} minLength={20} required /></div>
            <div className="field full"><label>Acceptance rubric</label><textarea value={rubric} onChange={(e) => setRubric(e.target.value)} minLength={20} required /></div>
            <div className="field full"><label>Deadline</label><input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} required /></div>
          </div>
          <div className="actions">
            <button className="button" disabled={!!busy}>
              {busy === "add_step" ? "Funding…" : "Add funded V3 step"}
            </button>
          </div>
        </form>
      </section>

      <section className="panel section">
        <h2>3. Seal + inspect</h2>
        <div className="actions">
          <button className="button" onClick={() => act("seal_workflow", [workflowId.trim()], undefined, false)} disabled={!!busy || !workflowId.trim()}>
            Seal V3 workflow
          </button>
          <button className="button secondary" onClick={() => loadStep()} disabled={!!busy || !hasIds}>
            Load V3 step
          </button>
        </div>
        {loadedStep ? (
          <div className="grid3 section">
            <div className="metric"><span>Status</span><strong>{String(loadedStep.status || "—")}</strong><span>round {String(loadedStep.resolution_round ?? 0)}</span></div>
            <div className="metric"><span>Participant bond</span><strong>{formatGen(loadedStep.bond_required ?? 0)}</strong><span>exact amount required</span></div>
            <div className="metric"><span>Appeal bond</span><strong>{formatGen(appealBond)}</strong><span>decision finalized {String(Boolean(loadedStep.decision_finalized))}</span></div>
          </div>
        ) : null}
      </section>

      <section className="panel section">
        <div className="eyebrow">Participant lifecycle</div>
        <h2>Accept → evidence → consensus → finality → settlement</h2>
        <div className="actions">
          <button className="button" onClick={acceptStep} disabled={!!busy || !loadedStep}>Accept + exact participant bond</button>
          <button className="button secondary" onClick={() => act("resolve_step", [workflowId.trim(), stepId.trim()])} disabled={!!busy || !hasIds}>Resolve</button>
          <button className="button secondary" onClick={() => act("finalize_step_decision", [workflowId.trim(), stepId.trim()])} disabled={!!busy || !hasIds}>Finalize decision</button>
          <button className="button secondary" onClick={() => act("settle_passed_step", [workflowId.trim(), stepId.trim()])} disabled={!!busy || !hasIds}>Settle PASS</button>
          <button className="button secondary" onClick={() => act("mark_missed_deadline", [workflowId.trim(), stepId.trim()])} disabled={!!busy || !hasIds}>Mark expired</button>
        </div>
      </section>

      <form className="panel section" onSubmit={submitEvidence}>
        <h2>Submit independent evidence</h2>
        <div className="formGrid">
          <div className="field"><label>Primary HTTPS source</label><input value={primary} onChange={(e) => setPrimary(e.target.value)} placeholder="https://…" required /></div>
          <div className="field"><label>Independent support source</label><input value={support} onChange={(e) => setSupport(e.target.value)} placeholder="https://…" required /></div>
        </div>
        <div className="actions"><button className="button" disabled={!!busy || !hasIds}>Submit evidence</button></div>
      </form>

      <section className="grid2 section">
        <div className="panel">
          <div className="eyebrow">Bounded step appeal</div>
          <h2>Fresh evidence requires an exact economic stake</h2>
          <div className="field"><label>Fresh challenge URL</label><input value={challengeUrl} onChange={(e) => setChallengeUrl(e.target.value)} placeholder="https://…" /></div>
          <div className="field section"><label>Challenge note</label><textarea value={note} onChange={(e) => setNote(e.target.value)} /></div>
          <div className="proofFacts section"><p><strong>Exact appeal bond</strong><code>{formatGen(appealBond)}</code></p></div>
          <div className="actions">
            <button className="button" onClick={challengeStep} disabled={!!busy || !hasIds || appealBond <= 0n || note.trim().length < 20 || !challengeUrl.trim().startsWith("https://")}>Challenge + bond</button>
            <button className="button secondary" onClick={() => act("resolve_step_challenge", [workflowId.trim(), stepId.trim()])} disabled={!!busy || !hasIds}>Resolve appeal</button>
            <button className="button secondary" onClick={() => act("finalize_step_decision", [workflowId.trim(), stepId.trim()])} disabled={!!busy || !hasIds}>Finalize appealed decision</button>
          </div>
        </div>

        <div className="panel">
          <div className="eyebrow">Workflow fault appeal</div>
          <h2>Root-cause decisions use the same bounded finality model</h2>
          <div className="actions">
            <button className="button secondary" onClick={() => act("attribute_failure", [workflowId.trim(), stepId.trim()])} disabled={!!busy || !hasIds}>Attribute failure</button>
            <button className="button" onClick={challengeAttribution} disabled={!!busy || !workflowId.trim() || note.trim().length < 20 || !challengeUrl.trim().startsWith("https://")}>Challenge attribution + exact bond</button>
            <button className="button secondary" onClick={() => act("resolve_attribution_challenge", [workflowId.trim()])} disabled={!!busy || !workflowId.trim()}>Re-attribute</button>
            <button className="button secondary" onClick={() => act("finalize_attribution", [workflowId.trim()])} disabled={!!busy || !workflowId.trim()}>Finalize attribution</button>
            <button className="button secondary" onClick={() => act("settle_failed_workflow", [workflowId.trim()])} disabled={!!busy || !workflowId.trim()}>Settle failed workflow</button>
          </div>
        </div>
      </section>

      <section className="panel section">
        <h2>Terminal success</h2>
        <p className="muted">Complete only after every step is paid and every required decision is final.</p>
        <div className="actions">
          <button className="button" onClick={() => act("complete_workflow", [workflowId.trim()])} disabled={!!busy || !workflowId.trim()}>Complete workflow</button>
          <button className="button secondary" onClick={() => act("cancel_draft_workflow", [workflowId.trim()])} disabled={!!busy || !workflowId.trim()}>Cancel draft</button>
        </div>
      </section>
    </>
  );
}

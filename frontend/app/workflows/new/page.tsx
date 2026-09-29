"use client";

import { FormEvent, useState } from "react";
import { parseGen, sendWrite, short, walletClient } from "@/lib/genlayer";
import { WORKFLOW_RECIPES, recipeLabel } from "@/lib/recipes";

function nowPlus(hours: number) {
  const d = new Date(Date.now() + hours * 3600_000);
  return d.toISOString().slice(0, 16);
}

export default function NewWorkflow() {
  const [account, setAccount] = useState("");
  const [notice, setNotice] = useState(
    "Connect a wallet to create and fund a workflow.",
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

  function applyRecipe(id: string) {
    setRecipeId(id);
    const recipe = WORKFLOW_RECIPES.find((item) => item.id === id);
    if (!recipe) return;
    setRoleLabel(recipe.roleLabel);
    setRequirement(recipe.requirement);
    setRubric(recipe.rubric);
    setNotice(
      "Recipe applied · " +
        recipeLabel(recipe) +
        ". Review and edit before committing on-chain.",
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

  async function create(event: FormEvent) {
    event.preventDefault();
    setBusy("create");
    try {
      const hash = await sendWrite({
        functionName: "create_workflow",
        args: [workflowId.trim(), title.trim(), objective.trim()],
      });
      setNotice("Workflow created · " + short(hash));
    } catch (error: any) {
      setNotice(error?.message || "Workflow creation failed.");
    } finally {
      setBusy("");
    }
  }

  async function addStep(event: FormEvent) {
    event.preventDefault();
    setBusy("step");
    try {
      const deadlineUnix = Math.floor(new Date(deadline).getTime() / 1000);
      if (!deadlineUnix) throw new Error("Choose a valid deadline.");

      const hash = await sendWrite({
        functionName: "add_step",
        args: [
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
        value: parseGen(reward),
      });
      setNotice("Step funded · " + short(hash));
    } catch (error: any) {
      setNotice(error?.message || "Step creation failed.");
    } finally {
      setBusy("");
    }
  }

  async function sealWorkflow() {
    setBusy("seal");
    try {
      const hash = await sendWrite({
        functionName: "seal_workflow",
        args: [workflowId.trim()],
      });
      setNotice("Workflow sealed · " + short(hash));
    } catch (error: any) {
      setNotice(error?.message || "Seal failed.");
    } finally {
      setBusy("");
    }
  }

  return (
    <>
      <div className="sectionHead">
        <div>
          <div className="eyebrow">Workflow Builder</div>
          <h1 style={{ fontSize: "56px" }}>
            Compose commitments before funds move.
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
        <div className="sectionHead">
          <div>
            <div className="eyebrow">Recipe starter</div>
            <h2>Draft from a versioned policy pattern</h2>
            <p className="muted">
              Recipes only prefill editable fields. The exact commitment and
              rubric you submit become the contract inputs.
            </p>
          </div>
        </div>
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
          <h2>1. Create workflow</h2>
          <div className="formGrid">
            <div className="field">
              <label>Workflow ID</label>
              <input
                value={workflowId}
                onChange={(e) => setWorkflowId(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label>Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="field full">
              <label>Objective</label>
              <textarea
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                minLength={30}
                required
              />
            </div>
          </div>
          <div className="actions">
            <button className="button" disabled={busy === "create"}>
              {busy === "create" ? "Creating…" : "Create on-chain"}
            </button>
          </div>
        </form>

        <form className="panel" onSubmit={addStep}>
          <h2>2. Fund a step</h2>
          <div className="formGrid">
            <div className="field">
              <label>Step ID</label>
              <input
                value={stepId}
                onChange={(e) => setStepId(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label>Assignee wallet</label>
              <input
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label>Role</label>
              <input
                value={roleLabel}
                onChange={(e) => setRoleLabel(e.target.value)}
              />
            </div>
            <div className="field">
              <label>Reward (GEN)</label>
              <input
                value={reward}
                onChange={(e) => setReward(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label>Dependency A</label>
              <input
                value={depA}
                onChange={(e) => setDepA(e.target.value)}
                placeholder="optional earlier step"
              />
            </div>
            <div className="field">
              <label>Dependency B</label>
              <input
                value={depB}
                onChange={(e) => setDepB(e.target.value)}
                placeholder="optional earlier step"
              />
            </div>
            <div className="field full">
              <label>ERC-8004-style agent reference</label>
              <input
                value={agentRef}
                onChange={(e) => setAgentRef(e.target.value)}
                placeholder="optional registry reference"
              />
            </div>
            <div className="field full">
              <label>A2A endpoint</label>
              <input
                value={a2a}
                onChange={(e) => setA2a(e.target.value)}
                placeholder="https://agent.example/.well-known/agent-card.json"
              />
            </div>
            <div className="field full">
              <label>Commitment</label>
              <textarea
                value={requirement}
                onChange={(e) => setRequirement(e.target.value)}
                minLength={20}
                required
              />
            </div>
            <div className="field full">
              <label>Acceptance rubric</label>
              <textarea
                value={rubric}
                onChange={(e) => setRubric(e.target.value)}
                minLength={20}
                required
              />
            </div>
            <div className="field full">
              <label>Deadline</label>
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="actions">
            <button className="button" disabled={busy === "step"}>
              {busy === "step" ? "Funding…" : "Add funded step"}
            </button>
          </div>
        </form>
      </section>

      <section className="panel section">
        <h2>3. Seal the graph</h2>
        <p className="muted">
          Sealing freezes the step set. Participants can then accept their
          assigned commitments and post bonds.
        </p>
        <button
          className="button"
          onClick={sealWorkflow}
          disabled={!workflowId || busy === "seal"}
        >
          {busy === "seal" ? "Sealing…" : "Seal workflow"}
        </button>
      </section>
    </>
  );
}

import Link from "next/link";
import {
  serverReadV3Appeal,
  serverV3AppealContractAddress,
} from "@/lib/server-genlayer";
import { formatGen, short } from "@/lib/genlayer";

const WORKFLOW_ID = "rg-v3-live-appeal-v1";
const STEP_ID = "example-domain-proof";
const PROOF_RUN = "36604861578";
const SOURCE_HASH = "4722a5fad4de2974c242ea1bc14e68f50da58914cd77c675e1a86b899acc25ee";

async function load() {
  const [workflow, step, appealBond] = await Promise.all([
    serverReadV3Appeal("get_workflow", [WORKFLOW_ID]),
    serverReadV3Appeal("get_step", [WORKFLOW_ID, STEP_ID]),
    serverReadV3Appeal("get_step_appeal_bond", [WORKFLOW_ID, STEP_ID]),
  ]);
  return { workflow: workflow as any, step: step as any, appealBond };
}

export default async function Appeals() {
  let state: Awaited<ReturnType<typeof load>> | null = null;
  let error = "";
  try { state = await load(); } catch (reason: any) {
    error = reason?.message || "Live V3 state unavailable.";
  }
  const step = state?.step;
  const workflow = state?.workflow;

  return (
    <>
      <div className="sectionHead">
        <div>
          <div className="eyebrow">Bounded Bonded Appeals</div>
          <h1 style={{ fontSize: "56px" }}>One fresh-evidence appeal, an economic stake, then explicit finality.</h1>
          <p className="lede">
            ResolveGraph V3 removes open-ended challenge loops. A step gets at most
            one appeal, the challenger posts a fixed bond, a second consensus round
            evaluates fresh evidence, and settlement stays locked until the decision
            is explicitly finalized.
          </p>
        </div>
        <div className="actions compactActions">
          <a className="button secondary" href="/api/appeals" target="_blank" rel="noreferrer">Live appeal JSON</a>
          <Link className="button secondary" href="/reviewer">Reviewer mode</Link>
        </div>
      </div>

      <section className="grid3">
        <div className="metric"><span>Appeal rounds</span><strong>1 maximum</strong><span>Second appeal is rejected by policy</span></div>
        <div className="metric"><span>Appeal bond</span><strong>5% of reward</strong><span>reward ÷ 20; exact bond required</span></div>
        <div className="metric"><span>Finalization</span><strong>Explicit</strong><span>No settlement before finality</span></div>
      </section>

      <section className="panel section emphasisPanel">
        <div className="eyebrow">V3 Studionet proof · LIVE VERIFIED</div>
        <h2>Bounded appeal policy is deployed and source-matched</h2>
        <div className="proofFacts">
          <p><strong>V3 contract</strong><code>{serverV3AppealContractAddress()}</code></p>
          <p><strong>Policy</strong><code>RG_V3_BOUNDED_APPEALS</code></p>
          <p><strong>Proof run</strong><a className="textLink" href={"https://github.com/maho0638/resolvegraph-genlayer/actions/runs/" + PROOF_RUN} target="_blank" rel="noreferrer">{PROOF_RUN} · SUCCESS ↗</a></p>
          <p><strong>Source SHA256</strong><code>{SOURCE_HASH}</code></p>
          <p><strong>Deployed-source equality</strong><code>true</code></p>
        </div>
      </section>

      {state ? (
        <section className="panel section">
          <div className="eyebrow">Live contract state</div>
          <h2>{WORKFLOW_ID}</h2>
          <div className="grid3">
            <div className="metric"><span>Workflow</span><strong>{String(workflow?.status || "—")}</strong><span>{String(workflow?.policy_version || "—")}</span></div>
            <div className="metric"><span>Step / round</span><strong>{String(step?.status || "—")}</strong><span>round {String(step?.resolution_round ?? 0)} · challenges {String(step?.challenge_count ?? 0)}</span></div>
            <div className="metric"><span>Appeal bond</span><strong>{formatGen(state.appealBond)}</strong><span>challenger {short(String(step?.challenge_challenger || ""))}</span></div>
          </div>
          <div className="decisionDiff section">
            <strong>Decision lineage</strong>
            <span>Round 1 {String(step?.initial_verdict || "—")} · score {String(step?.initial_score ?? 0)}/100 · confidence {String(step?.initial_confidence ?? 0)}/100</span>
            <span>Round {String(step?.resolution_round ?? 0)} {String(step?.verdict || "—")} · score {String(step?.score ?? 0)}/100 · confidence {String(step?.confidence ?? 0)}/100</span>
            <span>Finalized {String(Boolean(step?.decision_finalized))} · appeal outcome changed {String(Boolean(step?.challenge_outcome_changed))}</span>
          </div>
          <div className="proofFacts section">
            <p><strong>Initial decision</strong><code>bf5d47297b33995a1a50bb3c79b8e6c0302fa9aaf8da6bc7111b3761d217a94f</code></p>
            <p><strong>Final decision</strong><code>{String(step?.decision_hash || "—")}</code></p>
            <p><strong>Challenge evidence</strong>{step?.challenge_url ? <a className="textLink" href={String(step.challenge_url)} target="_blank" rel="noreferrer">{String(step.challenge_url)} ↗</a> : <span>—</span>}</p>
          </div>
        </section>
      ) : <div className="status warn">{error}</div>}

      <section className="grid2 section">
        <article className="card"><div className="eyebrow">Changed outcome</div><h3>Successful appeal bond returns</h3><p>Direct tests prove that when fresh evidence changes the decision, the appeal bond returns to the challenger before normal settlement.</p></article>
        <article className="card"><div className="eyebrow">Unchanged outcome</div><h3>Unsuccessful appeal has a cost</h3><p>If the second consensus round leaves the outcome unchanged, the appeal bond is forfeited to the counterparty.</p></article>
      </section>

      <section className="panel section">
        <div className="eyebrow">Isolation boundary</div>
        <h2>V3 does not silently replace the proven V1 settlement contract</h2>
        <p className="muted">V3 is an independently deployed, source-matched Studionet proof surface. The production builder continues to use canonical V1 until a deliberate migration is selected and separately verified.</p>
      </section>
    </>
  );
}

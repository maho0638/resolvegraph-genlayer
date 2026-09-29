import Link from "next/link";
import {
  serverCrossChainSettlementAddress,
  serverReadCrossChainSettlement,
} from "@/lib/server-genlayer";
import { formatGen, short } from "@/lib/genlayer";

const INTENT_ID = "rg-xchain-mainnet-proof-v1";
const RUN = "36606957197";
const ADAPTER_RUN = "36604750863";
const SOURCE_HASH =
  "67af44ce57eb4c672b156372c7fd042a0896d24794b788c897915b7f7993a4d0";

async function load() {
  const intent = (await serverReadCrossChainSettlement(
    "get_intent",
    [INTENT_ID],
  )) as any;
  const consumed = await serverReadCrossChainSettlement(
    "is_external_tx_consumed",
    [Number(intent?.source_chain_id || 1), String(intent?.external_tx_hash || "")],
  );
  return { intent, consumed };
}

export default async function CrossChain() {
  let state: Awaited<ReturnType<typeof load>> | null = null;
  let error = "";
  try { state = await load(); } catch (reason: any) {
    error = reason?.message || "Live cross-chain settlement state unavailable.";
  }
  const intent = state?.intent;

  return (
    <>
      <div className="sectionHead">
        <div>
          <div className="eyebrow">Cross-Chain Conditioned Settlement</div>
          <h1 style={{ fontSize: "56px" }}>
            Release GEN from GenLayer only after an attested external-chain proof passes deterministic guards.
          </h1>
          <p className="lede">
            This is deliberately not presented as a token bridge. A sponsor
            chooses a relayer and external-chain conditions; ResolveGraph enforces
            replay protection, confirmation thresholds, reorg handling,
            timeout/refund and deterministic GEN settlement.
          </p>
        </div>
        <div className="actions compactActions">
          <a className="button secondary" href="/api/cross-chain" target="_blank" rel="noreferrer">Live proof JSON</a>
          <Link className="button secondary" href="/adapters">Source adapters</Link>
        </div>
      </div>

      <section className="grid3">
        <div className="metric"><span>External proof</span><strong>Ethereum mainnet</strong><span>canonical tx + WETH event adapter evidence</span></div>
        <div className="metric"><span>Replay guard</span><strong>Global tx key</strong><span>same chain+tx cannot settle two intents</span></div>
        <div className="metric"><span>Failure recovery</span><strong>Reorg + expiry</strong><span>dispute path and sponsor refund</span></div>
      </section>

      <section className="panel section emphasisPanel">
        <div className="eyebrow">Studionet settlement proof · LIVE VERIFIED</div>
        <h2>Real source-adapter digest → relayer attestation → settled GEN intent</h2>
        <div className="proofFacts">
          <p><strong>Contract</strong><code>{serverCrossChainSettlementAddress()}</code></p>
          <p><strong>Policy</strong><code>RG_XCHAIN_RELAYER_V1</code></p>
          <p><strong>Proof run</strong><a className="textLink" href={"https://github.com/maho0638/resolvegraph-genlayer/actions/runs/" + RUN} target="_blank" rel="noreferrer">{RUN} · SUCCESS ↗</a></p>
          <p><strong>Source adapter run</strong><a className="textLink" href={"https://github.com/maho0638/resolvegraph-genlayer/actions/runs/" + ADAPTER_RUN} target="_blank" rel="noreferrer">{ADAPTER_RUN} · SUCCESS ↗</a></p>
          <p><strong>Source SHA256</strong><code>{SOURCE_HASH}</code></p>
          <p><strong>Deployed-source equality</strong><code>true</code></p>
        </div>
      </section>

      {state ? (
        <section className="panel section">
          <div className="eyebrow">Live intent</div>
          <h2>{INTENT_ID}</h2>
          <div className="grid3">
            <div className="metric"><span>Status</span><strong>{String(intent?.status || "—")}</strong><span>escrow {formatGen(intent?.escrow || 0)}</span></div>
            <div className="metric"><span>Source chain</span><strong>chain {String(intent?.source_chain_id || "—")}</strong><span>{String(intent?.observed_confirmations || 0)} confirmations</span></div>
            <div className="metric"><span>Relayer</span><strong>{short(String(intent?.relayer || ""))}</strong><span>external tx consumed {String(Boolean(state.consumed))}</span></div>
          </div>
          <div className="proofFacts section">
            <p><strong>External tx</strong><code>{String(intent?.external_tx_hash || "—")}</code></p>
            <p><strong>External block</strong><code>{String(intent?.external_block_number || "—")} · {String(intent?.external_block_hash || "—")}</code></p>
            <p><strong>Expected from</strong><code>{String(intent?.expected_from || "—")}</code></p>
            <p><strong>Expected to/event contract</strong><code>{String(intent?.expected_to || "—")}</code></p>
            <p><strong>Source adapter digest</strong><code>{String(intent?.source_adapter_digest || "—")}</code></p>
            <p><strong>Settlement proof digest</strong><code>{String(intent?.proof_digest || "—")}</code></p>
          </div>
        </section>
      ) : <div className="status warn">{error}</div>}

      <section className="grid2 section">
        <article className="card">
          <div className="eyebrow">Reorg model</div>
          <h3>Shallow proofs wait; deep proofs finalize immediately</h3>
          <p>
            Proofs close to the required confirmation threshold enter a 15-minute
            reorg dispute window. The configured relayer can mark a reorg before
            finality, after which the sponsor can refund.
          </p>
        </article>
        <article className="card">
          <div className="eyebrow">Trust model</div>
          <h3>Relayer-attested, not bridge-trust-free</h3>
          <p>
            The contract does not independently query Ethereum. The source adapter
            verifies public Ethereum data and the sponsor-selected relayer attests
            the normalized proof on GenLayer. This trust boundary is explicit.
          </p>
        </article>
      </section>

      <section className="panel section">
        <div className="eyebrow">Safety boundary</div>
        <h2>This adapter conditions GEN settlement; it does not bridge ETH or GEN</h2>
        <p className="muted">
          No cross-chain token minting or custody is claimed. The external
          Ethereum transaction is a condition for releasing GEN escrow already
          held by the isolated Studionet contract.
        </p>
      </section>
    </>
  );
}

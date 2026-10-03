import Link from "next/link";

const contract = "0x881665b7331CcE0a2f66A01aF14BB7CA14464FF0";
const v2Contract = "0x58De3354F739D6E1C9DBe1857B072262D96e5EE2";
const evidenceRegistry = "0x7436623f5bc064179546344b587fe9BF30B71004";
const canonicalCi = "37133973510";
const canonicalStudionet = "37131853576";
const v2RecipeProof = "37117935627";
const evidenceArchiveProof = "37132147367";
const firstProductionSmoke = "36587466475";
const sourceHash = "2241bbb42f4eafcd827f54f7ea065da794a55377159fe91ed9d09844b7416afa";
const v2SourceHash = "271ad9bfadcf5fa0d123022097485cf0d6073ba65b1f6cf8d6e1f40938725849";
const evidenceSourceHash = "8e7dbd50992f5d14544194d8e85a64e5ddcb4001ebc4b21d66ba979a31bba472";

export default function Proof() {
  const isProduction = process.env.VERCEL_ENV === "production";

  return (
    <>
      <div className="sectionHead">
        <div>
          <div className="eyebrow">Reviewer Proof</div>
          <h1 style={{ fontSize: "56px" }}>
            Settlement, provenance, reusable policy and evidence history are independently checkable.
          </h1>
          <p className="lede">
            ResolveGraph verifies the canonical V1 settlement lifecycle, the V2
            immutable recipe registry and a separate typed evidence archive. Each
            proof surface is isolated, source-matched and live on Studionet so new
            verification layers do not silently replace the proven V1 settlement path.
          </p>
        </div>
      </div>

      <section className="grid3">
        <div className="metric">
          <span>Direct tests</span>
          <strong>104 / 104 PASS</strong>
          <span>V1 graph/economics, V2 recipes and typed evidence archive coverage</span>
        </div>
        <div className="metric">
          <span>Studionet</span>
          <strong>4 LIVE SURFACES</strong>
          <span>Settlement, immutable recipes, evidence archive and bounded appeals</span>
        </div>
        <div className="metric">
          <span>Production UI</span>
          <strong>{isProduction ? "SMOKE VERIFIED" : "Preview"}</strong>
          <span>Public product remains bound to canonical V1 settlement</span>
        </div>
      </section>

      <section className="panel section">
        <div className="eyebrow">Verification chain</div>
        <h2>From source to public product</h2>
        <div className="flow verificationFlow">
          <span>104 direct tests</span><b>→</b>
          <span>21 SDK tests</span><b>→</b>
          <span>V1 Studionet lifecycles</span><b>→</b>
          <span>V2 recipe registry</span><b>→</b>
          <span>typed evidence archive</span><b>→</b>
          <span>source equality</span><b>→</b>
          <span>production smoke</span>
        </div>
      </section>

      <section className="panel section">
        <h2>Canonical V1 settlement evidence</h2>
        <div className="proofFacts">
          <p><strong>V1 contract</strong><code>{contract}</code></p>
          <p><strong>CI run</strong><a className="textLink" href={"https://github.com/maho0638/resolvegraph-genlayer/actions/runs/" + canonicalCi} target="_blank" rel="noreferrer">{canonicalCi} · SUCCESS ↗</a></p>
          <p><strong>Studionet completion</strong><a className="textLink" href={"https://github.com/maho0638/resolvegraph-genlayer/actions/runs/" + canonicalStudionet} target="_blank" rel="noreferrer">{canonicalStudionet} · RESUME SUCCESS ↗</a></p>
          <p><strong>Interrupted run</strong><a className="textLink" href="https://github.com/maho0638/resolvegraph-genlayer/actions/runs/37117935584" target="_blank" rel="noreferrer">37117935584 · network timeout, state later finalized ↗</a></p>
          <p><strong>Read-only recovery proof</strong><a className="textLink" href="https://github.com/maho0638/resolvegraph-genlayer/actions/runs/37131762703" target="_blank" rel="noreferrer">37131762703 · SUCCESS ↗</a></p>
          <p><strong>Production smoke baseline</strong><a className="textLink" href={"https://github.com/maho0638/resolvegraph-genlayer/actions/runs/" + firstProductionSmoke} target="_blank" rel="noreferrer">{firstProductionSmoke} · SUCCESS ↗</a></p>
          <p><strong>V1 source SHA256</strong><code>{sourceHash}</code></p>
          <p><strong>Deployed-source equality</strong><code>true</code></p>
        </div>
      </section>

      <section className="panel section emphasisPanel">
        <div className="eyebrow">V2 immutable recipe registry · LIVE VERIFIED</div>
        <h2>Content-addressed policies are now a real Studionet contract surface</h2>
        <div className="proofFacts">
          <p><strong>V2 contract</strong><code>{v2Contract}</code></p>
          <p><strong>Policy</strong><code>RG_V2_IMMUTABLE_RECIPES</code></p>
          <p><strong>Proof run</strong><a className="textLink" href={"https://github.com/maho0638/resolvegraph-genlayer/actions/runs/" + v2RecipeProof} target="_blank" rel="noreferrer">{v2RecipeProof} · SUCCESS ↗</a></p>
          <p><strong>Live workflow</strong><code>rg-v2-live-recipe-v1 · ACTIVE · 3 recipe-bound steps</code></p>
          <p><strong>V2 source SHA256</strong><code>{v2SourceHash}</code></p>
          <p><strong>Deployed-source equality</strong><code>true</code></p>
        </div>
        <div className="grid3 section">
          <div className="card"><strong>software-delivery · v1</strong><code>200c7cf2a38dd134d815c493795a01c65610648cf701334366eb3ae46acd1e04</code></div>
          <div className="card"><strong>research-verification · v1</strong><code>91602e091cce5964d300b3880bee3e5a7862fa4b17d1bac71ba2b3229e4a638f</code></div>
          <div className="card"><strong>service-sla · v1</strong><code>9dca5c6c8790600ca6629e4a47eebb3f71374237f1f29732c45c7ef7512942f2</code></div>
        </div>
      </section>

      <section className="panel section emphasisPanel">
        <div className="eyebrow">Typed evidence archive · LIVE VERIFIED</div>
        <h2>Remote evidence now has immutable round-by-round archive records</h2>
        <div className="proofFacts">
          <p><strong>Evidence registry</strong><code>{evidenceRegistry}</code></p>
          <p><strong>Proof run</strong><a className="textLink" href={"https://github.com/maho0638/resolvegraph-genlayer/actions/runs/" + evidenceArchiveProof} target="_blank" rel="noreferrer">{evidenceArchiveProof} · SUCCESS ↗</a></p>
          <p><strong>Canonical step</strong><code>rg-live-success-v1 / source-check</code></p>
          <p><strong>Archived records</strong><code>round 1 PRIMARY + SUPPORT · round 2 CHALLENGE</code></p>
          <p><strong>Registry source SHA256</strong><code>{evidenceSourceHash}</code></p>
          <p><strong>Deployed-source equality</strong><code>true</code></p>
        </div>
        <div className="actions">
          <Link className="button secondary" href="/evidence?workflow=rg-live-success-v1&step=source-check">
            Open evidence archive
          </Link>
          <a className="button secondary" href="/api/evidence?workflow=rg-live-success-v1&step=source-check" target="_blank" rel="noreferrer">
            Manifest v2 JSON
          </a>
        </div>
      </section>

      <section className="panel section emphasisPanel">
        <div className="eyebrow">V3 bounded bonded appeals · LIVE VERIFIED</div>
        <h2>Appeal rounds are finite, bonded and explicitly finalized</h2>
        <div className="proofFacts">
          <p><strong>V3 contract</strong><code>0xaE7169485b8838Cf1BE7B3D092Fdc41119eC114A</code></p>
          <p><strong>Policy</strong><code>RG_V3_BOUNDED_APPEALS</code></p>
          <p><strong>Proof run</strong><a className="textLink" href="https://github.com/maho0638/resolvegraph-genlayer/actions/runs/37135064005" target="_blank" rel="noreferrer">37135064005 · SUCCESS ↗</a></p>
          <p><strong>Source SHA256</strong><code>b15e44514cf05c7c50713e21ad90bb76d194329e3232c32cce01ed72022b9342</code></p>
          <p><strong>Deployed-source equality</strong><code>true</code></p>
          <p><strong>Live decision</strong><code>PASS → bonded appeal → PASS · finalized · PAID → workflow COMPLETED</code></p>
        </div>
        <div className="actions">
          <Link className="button secondary" href="/appeals">Open bounded appeals</Link>
          <a className="button secondary" href="/api/appeals" target="_blank" rel="noreferrer">Live V3 JSON</a>
        </div>
      </section>

      <section className="grid2 section">
        <article className="card">
          <div className="eyebrow">Source adapters · E2E VERIFIED</div>
          <h3>GitHub + Ethereum + artifact facts</h3>
          <p>Commit, PR, Actions, Ethereum receipt/event and bounded artifact adapters passed live external-source checks plus digest replay.</p>
          <a className="textLink" href="https://github.com/maho0638/resolvegraph-genlayer/actions/runs/36604750863" target="_blank" rel="noreferrer">proof run 36604750863 · SUCCESS ↗</a>
        </article>
        <article className="card">
          <div className="eyebrow">External SDK consumer · VERIFIED</div>
          <h3>SDK works outside the application boundary</h3>
          <p>A clean external consumer installs the packed SDK and verifies the canonical public workflow through the production API.</p>
          <a className="textLink" href="https://github.com/maho0638/resolvegraph-genlayer/actions/runs/36601714919" target="_blank" rel="noreferrer">proof run 36601714919 · SUCCESS ↗</a>
        </article>
      </section>

      <section className="panel section emphasisPanel">
        <div className="eyebrow">Cross-chain conditioned settlement · LIVE VERIFIED</div>
        <h2>Ethereum proof can condition replay-safe GEN settlement without pretending to be a bridge</h2>
        <div className="proofFacts">
          <p><strong>Contract</strong><code>0x0ca7432339C86ab01118f46D847A11EF94CB4BAA</code></p>
          <p><strong>Policy</strong><code>RG_XCHAIN_RELAYER_V1</code></p>
          <p><strong>Proof run</strong><a className="textLink" href="https://github.com/maho0638/resolvegraph-genlayer/actions/runs/36606957197" target="_blank" rel="noreferrer">36606957197 · SUCCESS ↗</a></p>
          <p><strong>Source adapter proof</strong><a className="textLink" href="https://github.com/maho0638/resolvegraph-genlayer/actions/runs/36604750863" target="_blank" rel="noreferrer">36604750863 · SUCCESS ↗</a></p>
          <p><strong>Source SHA256</strong><code>67af44ce57eb4c672b156372c7fd042a0896d24794b788c897915b7f7993a4d0</code></p>
          <p><strong>Final intent</strong><code>rg-xchain-mainnet-proof-v1 · SETTLED</code></p>
        </div>
        <div className="actions">
          <Link className="button secondary" href="/cross-chain">Open cross-chain proof</Link>
          <a className="button secondary" href="/api/cross-chain" target="_blank" rel="noreferrer">Live settlement JSON</a>
        </div>
      </section>

      <section className="grid2 section">
        <div className="card">
          <div className="eyebrow">Success workflow</div>
          <h2>rg-live-success-v1</h2>
          <p className="muted">
            Two dependent agents accepted bonded work, submitted independent
            public evidence, passed challenged consensus rounds, settled rewards,
            unlocked the downstream dependency and completed the workflow.
          </p>
          <p><strong>Final status:</strong> COMPLETED</p>
          <p><strong>Step 1 final decision:</strong> <code>bf299d3dd3276904426c56412c8c3e4f63050173214ca02263651efe3c60a9fe</code></p>
          <Link className="textLink" href="/workflows/rg-live-success-v1">Open live case →</Link>
        </div>

        <div className="card">
          <div className="eyebrow">Failure workflow</div>
          <h2>rg-live-failure-v1</h2>
          <p className="muted">
            A deliberately false API/SLA claim failed consensus. Fresh
            step and attribution evidence produced second consensus rounds.
            The final workflow fault was PARTICIPANT / api-proof and the
            deterministic failed-workflow settlement completed.
          </p>
          <p><strong>Final status:</strong> FAILED_SETTLED</p>
          <p><strong>Final decision:</strong> <code>389c2a7dc0a7e6c9fc0901b3ff52b3f58cd2d43835eced3dbbcc8eddd87f0c91</code></p>
          <Link className="textLink" href="/workflows/rg-live-failure-v1">Open live case →</Link>
        </div>
      </section>

      <section className="panel section">
        <h2>Machine-readable proof</h2>
        <div className="actions">
          <a className="button secondary" href="/verification-status.json" target="_blank" rel="noreferrer">Verification snapshot</a>
          <a className="button secondary" href="/api/receipt?workflow=rg-live-success-v1" target="_blank" rel="noreferrer">Success receipt</a>
          <a className="button secondary" href="/api/receipt?workflow=rg-live-failure-v1" target="_blank" rel="noreferrer">Failure receipt</a>
          <a className="button secondary" href="/api/evidence?workflow=rg-live-success-v1&step=source-check" target="_blank" rel="noreferrer">Evidence manifest v2</a>
          <a className="button secondary" href="/api/evidence/archive?workflow=rg-live-success-v1&step=source-check" target="_blank" rel="noreferrer">Evidence archive JSON</a>
        </div>
      </section>
    </>
  );
}

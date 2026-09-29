import Link from "next/link";

const contract = "0x5E7e96dCfB5dF57881CFfBFc5b597f7b83c4A754";
const v2Contract = "0x8025214a654Dd4d500bc549f204ED9a9a4d2a8c1";
const evidenceRegistry = "0xB5B0Dd5E454590fCb4FCEFD85B11d16774552390";
const canonicalCi = "36545373008";
const canonicalStudionet = "36545373155";
const v2RecipeProof = "36587816018";
const evidenceArchiveProof = "36598129489";
const firstProductionSmoke = "36587466475";
const sourceHash = "f5a80ea0589c88f8c45221195029bbd2b78c91b4b37302400e9d05a156374ddb";
const v2SourceHash = "2d5939b27a116ca3754b301a3bbbf0a1f335aaa76d6f1ce1c0abd09b17d96673";
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
          <strong>97 / 97 PASS</strong>
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
          <span>97 direct tests</span><b>→</b>
          <span>18 SDK tests</span><b>→</b>
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
          <p><strong>Studionet run</strong><a className="textLink" href={"https://github.com/maho0638/resolvegraph-genlayer/actions/runs/" + canonicalStudionet} target="_blank" rel="noreferrer">{canonicalStudionet} · SUCCESS ↗</a></p>
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
          <p><strong>V3 contract</strong><code>0x14948AD5dCd317Ec49f5CEf7e08c72176C900214</code></p>
          <p><strong>Policy</strong><code>RG_V3_BOUNDED_APPEALS</code></p>
          <p><strong>Proof run</strong><a className="textLink" href="https://github.com/maho0638/resolvegraph-genlayer/actions/runs/36604861578" target="_blank" rel="noreferrer">36604861578 · SUCCESS ↗</a></p>
          <p><strong>Source SHA256</strong><code>4722a5fad4de2974c242ea1bc14e68f50da58914cd77c675e1a86b899acc25ee</code></p>
          <p><strong>Deployed-source equality</strong><code>true</code></p>
          <p><strong>Live decision</strong><code>PASS → appeal → PASS · finalized · 50,000,000,000 appeal bond</code></p>
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
          <p><strong>Step 1 final decision:</strong> <code>7e7f81ae864920b34fe87674f73ec3b0c750db653d8d45e73cd949d24cea46e4</code></p>
          <Link className="textLink" href="/workflows/rg-live-success-v1">Open live case →</Link>
        </div>

        <div className="card">
          <div className="eyebrow">Failure workflow</div>
          <h2>rg-live-failure-v1</h2>
          <p className="muted">
            A deliberately false API/SLA claim failed consensus. Initial
            workflow attribution assigned PARTICIPANT fault at 97% confidence.
            Fresh attribution evidence triggered a second consensus round and
            changed the final fault class to EXTERNAL before settlement.
          </p>
          <p><strong>Final status:</strong> FAILED_SETTLED</p>
          <p><strong>Final decision:</strong> <code>e1d87201e5b70ab509cb03ea6bc3979b178af0e9f3c3744d61ff456ed6bb537c</code></p>
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

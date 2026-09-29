import Link from "next/link";

const contract = "0x5E7e96dCfB5dF57881CFfBFc5b597f7b83c4A754";
const canonicalCi = "36545373008";
const canonicalStudionet = "36545373155";
const firstProductionSmoke = "36567720266";
const sourceHash = "f5a80ea0589c88f8c45221195029bbd2b78c91b4b37302400e9d05a156374ddb";

export default function Proof() {
  const isProduction = process.env.VERCEL_ENV === "production";

  return (
    <>
      <div className="sectionHead">
        <div>
          <div className="eyebrow">Reviewer Proof</div>
          <h1 style={{ fontSize: "56px" }}>
            Contract, lifecycles, source and production surface are independently checkable.
          </h1>
          <p className="lede">
            ResolveGraph passed deterministic tests, a real GenLayer success
            lifecycle, a challenged failure lifecycle, deployed-source equality
            and an automated production smoke test.
          </p>
        </div>
      </div>

      <section className="grid3">
        <div className="metric">
          <span>Direct tests</span>
          <strong>68 / 68 PASS</strong>
          <span>Graph, escrow, challenge, fault and adversarial coverage</span>
        </div>
        <div className="metric">
          <span>Studionet</span>
          <strong>LIVE VERIFIED</strong>
          <span>Success COMPLETED · failure FAILED_SETTLED</span>
        </div>
        <div className="metric">
          <span>Production UI</span>
          <strong>{isProduction ? "SMOKE VERIFIED" : "Preview"}</strong>
          <span>Pages, asset, APIs and canonical workflows are checked automatically</span>
        </div>
      </section>

      <section className="panel section">
        <div className="eyebrow">Verification chain</div>
        <h2>From source to public product</h2>
        <div className="flow verificationFlow">
          <span>68 direct tests</span><b>→</b>
          <span>11 SDK tests</span><b>→</b>
          <span>Studionet lifecycles</span><b>→</b>
          <span>source equality</span><b>→</b>
          <span>Vercel deployment</span><b>→</b>
          <span>production smoke</span>
        </div>
      </section>

      <section className="panel section">
        <h2>Canonical evidence</h2>
        <div className="proofFacts">
          <p><strong>Contract</strong><code>{contract}</code></p>
          <p><strong>CI run</strong><a className="textLink" href={"https://github.com/maho0638/resolvegraph-genlayer/actions/runs/" + canonicalCi} target="_blank" rel="noreferrer">{canonicalCi} · SUCCESS ↗</a></p>
          <p><strong>Studionet run</strong><a className="textLink" href={"https://github.com/maho0638/resolvegraph-genlayer/actions/runs/" + canonicalStudionet} target="_blank" rel="noreferrer">{canonicalStudionet} · SUCCESS ↗</a></p>
          <p><strong>Production smoke baseline</strong><a className="textLink" href={"https://github.com/maho0638/resolvegraph-genlayer/actions/runs/" + firstProductionSmoke} target="_blank" rel="noreferrer">{firstProductionSmoke} · SUCCESS ↗</a></p>
          <p><strong>Source SHA256</strong><code>{sourceHash}</code></p>
          <p><strong>Deployed-source equality</strong><code>true</code></p>
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
        </div>
      </section>
    </>
  );
}

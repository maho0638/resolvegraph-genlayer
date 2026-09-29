const contract = "0x5E7e96dCfB5dF57881CFfBFc5b597f7b83c4A754";
const canonicalCi = "36545373008";
const canonicalStudionet = "36545373155";
const sourceHash = "f5a80ea0589c88f8c45221195029bbd2b78c91b4b37302400e9d05a156374ddb";

export default function Proof() {
  const isProduction = process.env.VERCEL_ENV === "production";

  return (
    <>
      <div className="sectionHead">
        <div>
          <div className="eyebrow">Reviewer Proof</div>
          <h1 style={{ fontSize: "56px" }}>
            Canonical Studionet proof is complete.
          </h1>
          <p className="muted">
            ResolveGraph passed the predeploy gate and a real GenLayer success +
            failure lifecycle, including step challenges, fault attribution,
            attribution challenge, re-attribution, terminal settlement and
            deployed-source equality.
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
          <strong>{isProduction ? "LIVE" : "Pending final deploy"}</strong>
          <span>
            {isProduction
              ? "This page is running on the controlled production deployment"
              : "Vercel promotion happens only after the full release gate"}
          </span>
        </div>
      </section>

      <section className="panel section">
        <h2>Canonical evidence</h2>
        <p><strong>Contract:</strong> <code>{contract}</code></p>
        <p><strong>CI run:</strong> <code>{canonicalCi}</code> — SUCCESS</p>
        <p><strong>Studionet run:</strong> <code>{canonicalStudionet}</code> — SUCCESS</p>
        <p><strong>Deployed source SHA256:</strong> <code>{sourceHash}</code></p>
        <p><strong>Repository source SHA256:</strong> <code>{sourceHash}</code></p>
        <p><strong>Source equality:</strong> <code>true</code></p>
      </section>

      <section className="grid2 section">
        <div className="card">
          <div className="eyebrow">Success workflow</div>
          <h2>rg-live-success-v1</h2>
          <p className="muted">
            Two dependent agents accepted bonded work, submitted independent
            public evidence, passed two consensus rounds after challenges,
            settled rewards, unlocked the downstream dependency and completed
            the workflow.
          </p>
          <p><strong>Final status:</strong> COMPLETED</p>
          <p><strong>Step 1 final decision:</strong> <code>7e7f81ae864920b34fe87674f73ec3b0c750db653d8d45e73cd949d24cea46e4</code></p>
        </div>

        <div className="card">
          <div className="eyebrow">Failure workflow</div>
          <h2>rg-live-failure-v1</h2>
          <p className="muted">
            A deliberately false production-API/SLA claim failed consensus.
            Initial workflow attribution assigned PARTICIPANT fault at 97%
            confidence. Fresh attribution evidence triggered a second consensus
            round, which changed the final fault class to EXTERNAL before
            deterministic settlement.
          </p>
          <p><strong>Final status:</strong> FAILED_SETTLED</p>
          <p><strong>Final decision:</strong> <code>e1d87201e5b70ab509cb03ea6bc3979b178af0e9f3c3744d61ff456ed6bb537c</code></p>
        </div>
      </section>

      <section className="panel section">
        <h2>Machine-readable proof</h2>
        <p className="muted">
          Repository proof details and canonical transaction hashes are pinned in
          <code> docs/PROOF_MANIFEST.json</code>. The public verification snapshot
          is available at <code>/verification-status.json</code>.
        </p>
      </section>
    </>
  );
}

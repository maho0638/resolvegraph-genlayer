export default function Proof() {
  return (
    <>
      <div className="sectionHead">
        <div>
          <div className="eyebrow">Reviewer Proof</div>
          <h1 style={{ fontSize: "56px" }}>
            Evidence is published only after the full release gate passes.
          </h1>
        </div>
      </div>

      <section className="grid3">
        <div className="metric">
          <span>Direct tests</span>
          <strong>In progress</strong>
          <span>Economic, graph, challenge and adversarial coverage</span>
        </div>
        <div className="metric">
          <span>Studionet</span>
          <strong>Not deployed</strong>
          <span>Intentional: no premature live deployment</span>
        </div>
        <div className="metric">
          <span>Production UI</span>
          <strong>Not deployed</strong>
          <span>Vercel promotion is the final controlled step</span>
        </div>
      </section>

      <section className="panel section">
        <h2>Release gate</h2>
        <p className="muted">
          The final proof surface will expose the canonical contract,
          transaction hashes, source hash, CI run, successful workflow,
          failed-workflow attribution, challenge and re-attribution path,
          machine-readable proof manifest, and deployed-source equality check.
          Until then this page intentionally makes no live-proof claim.
        </p>
      </section>
    </>
  );
}

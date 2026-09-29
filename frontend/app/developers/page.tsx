export default function Developers() {
  return (
    <>
      <div className="sectionHead">
        <div>
          <div className="eyebrow">Developer Surface</div>
          <h1 style={{ fontSize: "56px" }}>
            Build agent products on top of adjudication, not around it.
          </h1>
          <p className="lede">
            Public reads are available through same-origin production APIs;
            state-changing actions remain wallet-signed GenLayer transactions.
          </p>
        </div>
      </div>

      <section className="grid2">
        <article className="card">
          <h3>TypeScript SDK</h3>
          <p>
            The repository includes request builders, GEN helpers, agent
            metadata normalization and portable receipt generation.
          </p>
          <pre>{[
            'import { buildAddStep, parseGen } from "@resolvegraph/sdk";',
            "",
            "const tx = buildAddStep({",
            '  workflowId: "release-42",',
            '  stepId: "audit",',
            '  assignee: "0x...",',
            "  identity: {",
            '    agentRegistry: "eip155:1:0xRegistry",',
            "    agentId: 42,",
            '    a2aEndpoint: "https://agent.example/.well-known/agent-card.json"',
            "  },",
            '  requirement: "...",',
            '  rubric: "...",',
            "  deadlineUnix: 1900000000,",
            '  rewardWei: parseGen("1.0")',
            "});",
          ].join("\n")}</pre>
        </article>

        <article className="card">
          <h3>Portable adjudication receipt</h3>
          <p>
            Applications can transform the on-chain decision into a stable
            receipt carrying participant reference, outcome, score, confidence,
            fault class, policy version and decision hash.
          </p>
          <pre>{[
            "{",
            '  "schema": "resolvegraph-receipt-v1",',
            '  "workflowId": "release-42",',
            '  "stepId": "audit",',
            '  "outcome": "PASS",',
            '  "confidence": 94,',
            '  "decisionHash": "..."',
            "}",
          ].join("\n")}</pre>
        </article>
      </section>

      <section className="panel section">
        <div className="eyebrow">Production read APIs</div>
        <h2>Reviewer-friendly, wallet-free inspection</h2>
        <div className="apiGrid">
          <a className="apiItem" href="/api/health" target="_blank" rel="noreferrer">
            <strong>GET /api/health</strong><span>deployment, network and contract configuration</span>
          </a>
          <a className="apiItem" href="/api/workflows" target="_blank" rel="noreferrer">
            <strong>GET /api/workflows</strong><span>all workflow summaries from live contract state</span>
          </a>
          <a className="apiItem" href="/api/receipt?workflow=rg-live-success-v1" target="_blank" rel="noreferrer">
            <strong>GET /api/receipt</strong><span>portable workflow or step adjudication receipt</span>
          </a>
          <a className="apiItem" href="/api/evidence?workflow=rg-live-success-v1&step=source-proof" target="_blank" rel="noreferrer">
            <strong>GET /api/evidence</strong><span>typed decision-bound evidence manifest</span>
          </a>
        </div>
      </section>

      <section className="grid2 section">
        <article className="card">
          <h3>Evidence manifest boundary</h3>
          <p>
            The manifest hashes the contract-stored evidence metadata, bounded
            snapshots, commitment and decision fields. It does not claim a hash
            of the remote source bytes because the current contract does not
            persist those byte-level hashes.
          </p>
        </article>
        <article className="card">
          <h3>Interoperability boundary</h3>
          <p>
            ERC-8004 and A2A identifiers are references. ResolveGraph does not
            claim identity authenticity merely because a caller supplied a
            string. Signed identity/provenance adapters remain a separate trust layer.
          </p>
        </article>
      </section>
    </>
  );
}

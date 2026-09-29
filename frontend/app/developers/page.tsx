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
        <div className="sectionHead">
          <div>
            <div className="eyebrow">Source adapters</div>
            <h2>Deterministic facts before semantic judgment</h2>
            <p className="muted">
              Normalize GitHub commits/PRs/CI runs, Ethereum transactions/events
              and bounded public artifacts before they enter an evidence claim.
            </p>
          </div>
          <a className="button secondary" href="/adapters">
            Open adapter workbench
          </a>
        </div>
      </section>

      <section className="grid2 section">
        <article className="card">
          <div className="eyebrow">Verified external consumer</div>
          <h3>SDK package boundary is tested independently</h3>
          <p>A clean consumer installs the packed ResolveGraph SDK, calls the production public surface, validates the canonical workflow and emits its own proof receipt.</p>
          <a className="textLink" href="https://github.com/maho0638/resolvegraph-genlayer/actions/runs/36601714919" target="_blank" rel="noreferrer">External consumer proof · SUCCESS ↗</a>
        </article>
        <article className="card">
          <div className="eyebrow">Bounded appeals V3</div>
          <h3>Finite challenge policy with economic finality</h3>
          <p>The isolated V3 contract enforces one fresh-evidence appeal, an exact 5% appeal bond, explicit decision finalization and settlement gating.</p>
          <a className="textLink" href="/appeals">Open V3 appeal proof →</a>
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
          <a className="apiItem" href="/api/evidence?workflow=rg-live-success-v1&step=source-check" target="_blank" rel="noreferrer">
            <strong>GET /api/evidence</strong><span>v2 manifest with contract snapshots, immutable archive records and decision lineage</span>
          </a>
          <a className="apiItem" href="/api/evidence/archive?workflow=rg-live-success-v1&step=source-check" target="_blank" rel="noreferrer">
            <strong>GET /api/evidence/archive</strong><span>append-only Studionet evidence archive history by round and role</span>
          </a>
          <a className="apiItem" href="/evidence?workflow=rg-live-success-v1&step=source-check">
            <strong>POST /api/evidence/capture</strong><span>SSRF-safe bounded HTTPS byte capture and SHA-256 verification</span>
          </a>
          <a className="apiItem" href="/api/recipes" target="_blank" rel="noreferrer">
            <strong>GET /api/recipes</strong><span>live V2 content-addressed recipe registry from Studionet</span>
          </a>
          <a className="apiItem" href="/api/appeals" target="_blank" rel="noreferrer">
            <strong>GET /api/appeals</strong><span>live V3 bounded bonded appeal proof state</span>
          </a>
          <a className="apiItem" href="/api/cross-chain" target="_blank" rel="noreferrer">
            <strong>GET /api/cross-chain</strong><span>live replay-safe cross-chain-conditioned settlement intent</span>
          </a>
          <a className="apiItem" href="/api/reviewer/case?workflow=rg-live-success-v1" target="_blank" rel="noreferrer">
            <strong>GET /api/reviewer/case</strong><span>single-case graph, evidence, decision and transaction timeline</span>
          </a>
          <a className="apiItem" href="/adapters">
            <strong>GET /api/adapters/github</strong><span>GitHub commit, pull request and Actions run verification</span>
          </a>
          <a className="apiItem" href="/adapters">
            <strong>GET /api/adapters/ethereum</strong><span>Ethereum/Sepolia tx receipt, block and optional event verification</span>
          </a>
          <a className="apiItem" href="/adapters">
            <strong>GET /api/adapters/artifact</strong><span>SSRF-safe bounded artifact SHA-256 capture/equality check</span>
          </a>
          <a className="apiItem" href="/provenance?workflow=rg-live-success-v1&step=source-check">
            <strong>POST /api/provenance/github</strong><span>wallet ↔ GitHub ↔ immutable commit ↔ on-chain step verification</span>
          </a>
        </div>
      </section>

      <section className="panel section">
        <div className="sectionHead">
          <div>
            <div className="eyebrow">Cross-chain conditioned settlement</div>
            <h2>External-chain facts can gate GEN escrow with explicit relayer trust</h2>
            <p className="muted">
              The isolated adapter binds a verified Ethereum transaction digest to a
              sponsor-selected relayer proof, confirmation threshold, replay guard,
              reorg dispute path and timeout refund. It does not claim to bridge tokens.
            </p>
          </div>
          <a className="button secondary" href="/cross-chain">Open proof</a>
        </div>
      </section>

      <section className="grid2 section">
        <article className="card">
          <h3>Evidence manifest boundary</h3>
          <p>
            Manifest v2 separates three layers: contract-stored URLs and bounded
            snapshots, current bounded remote-byte capture, and immutable archive
            records stored by the evidence-registry contract. Archived records
            include source/MIME type, SHA-256 content hash, immutable reference,
            author field, rubric relation, fetch time, round, role and publisher.
            The registry records the submitted capture; it does not fetch the
            remote bytes itself.
          </p>
        </article>
        <article className="card">
          <h3>Identity / provenance boundary</h3>
          <p>
            ERC-8004 and A2A identifiers remain metadata references. The GitHub
            provenance adapter adds a separate verifiable chain: the on-chain
            assignee signs a scope- and expiry-bound message, GitHub must
            associate the claimed account with the immutable commit, and an
            owner-controlled gist must bind the exact claim digest. This is an
            external verification receipt, not a change to contract settlement.
          </p>
        </article>
      </section>
    </>
  );
}

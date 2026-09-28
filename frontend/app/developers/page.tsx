export default function Developers() {
  return (
    <>
      <div className="sectionHead">
        <div>
          <div className="eyebrow">Developer Surface</div>
          <h1 style={{ fontSize: "56px" }}>
            Build agent products on top of adjudication, not around it.
          </h1>
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
        <h2>Interoperability policy</h2>
        <p className="muted">
          ERC-8004 and A2A identifiers are treated as references. ResolveGraph
          does not claim identity authenticity merely because a caller supplied
          a string. Final integration adapters verify compatible endpoint and
          registry metadata separately from adjudication.
        </p>
      </section>
    </>
  );
}

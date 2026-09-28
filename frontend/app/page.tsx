import Link from "next/link";
import { isContractConfigured } from "@/lib/genlayer";

export default function Home() {
  const configured = isContractConfigured();

  return (
    <>
      <section className="hero">
        <div className="heroText">
          <div className="eyebrow">Multi-agent settlement infrastructure</div>
          <h1>When agent workflows fail, make the outcome auditable.</h1>
          <p className="lede">
            ResolveGraph turns natural-language commitments, public evidence,
            GenLayer consensus, challenge rights and native GEN settlement into
            one workflow. It is designed for agent teams, service chains,
            grants, API commitments and cross-organization automation.
          </p>
          <div className="actions">
            <Link className="button" href="/workflows/new">
              Build a workflow
            </Link>
            <Link className="button secondary" href="/explorer">
              Open explorer
            </Link>
          </div>
        </div>

        <div className="heroSide">
          <div className="metric">
            <span>Workflow topology</span>
            <strong>8 steps</strong>
            <span>Up to two prerequisites per step</span>
          </div>
          <div className="metric">
            <span>Economic safety</span>
            <strong>Reward + bond</strong>
            <span>GEN rewards and participant accountability</span>
          </div>
          <div className="metric">
            <span>Deployment state</span>
            <strong>{configured ? "Configured" : "Pre-deploy"}</strong>
            <span>No production deployment until all quality gates pass</span>
          </div>
        </div>
      </section>

      <section className="grid3">
        <article className="card">
          <div className="eyebrow">Commitments</div>
          <h3>Graph-aware work</h3>
          <p>
            Model branches and joins with prerequisite steps. Downstream
            evidence cannot submit until required upstream rewards are actually
            settled.
          </p>
        </article>

        <article className="card">
          <div className="eyebrow">Consensus</div>
          <h3>Evidence, not assertions</h3>
          <p>
            Public evidence is fetched during GenLayer execution. Validators
            independently re-evaluate the decisive verdict, score, confidence
            and failure class.
          </p>
        </article>

        <article className="card">
          <div className="eyebrow">Settlement</div>
          <h3>Fault-aware economics</h3>
          <p>
            Rewards can settle step-by-step while bonds remain locked. A later
            failure can trigger workflow-level attribution and deterministic
            bond handling.
          </p>
        </article>
      </section>

      <section className="panel section">
        <div className="sectionHead">
          <div>
            <div className="eyebrow">Lifecycle</div>
            <h2>One product, two terminal paths</h2>
          </div>
        </div>

        <div className="flow">
          <span>DRAFT</span><b>→</b><span>ACTIVE</span><b>→</b>
          <span>STEP CONSENSUS</span><b>→</b><span>CHALLENGE</span><b>→</b>
          <span>PAID</span><b>→</b><span>COMPLETED</span>
        </div>

        <div className="flow">
          <span>ACTIVE</span><b>→</b><span>FAILED STEP</span><b>→</b>
          <span>FAULT ATTRIBUTION</span><b>→</b>
          <span>ATTRIBUTION CHALLENGE</span><b>→</b>
          <span>FAILED_SETTLED</span>
        </div>
      </section>

      <section className="grid2 section">
        <article className="card">
          <h3>Agent interoperability</h3>
          <p>
            Each step can carry an ERC-8004-style registry reference, agent ID
            and A2A endpoint. ResolveGraph treats them as portable metadata,
            not as proof by themselves.
          </p>
        </article>

        <article className="card">
          <h3>Portable decisions</h3>
          <p>
            The SDK turns on-chain outcomes and decision hashes into a
            machine-readable receipt suitable for marketplaces, agent
            reputation layers and external audit systems.
          </p>
        </article>
      </section>
    </>
  );
}

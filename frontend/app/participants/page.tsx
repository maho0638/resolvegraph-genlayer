"use client";

import { FormEvent, useState } from "react";
import { formatGen, readContract, short } from "@/lib/genlayer";

type Stats = {
  steps_accepted?: unknown;
  steps_paid?: unknown;
  workflows_completed?: unknown;
  bonds_returned?: unknown;
  bonds_slashed?: unknown;
  total_rewards?: unknown;
  total_bond_returned?: unknown;
  total_bond_slashed?: unknown;
};

export default function Participants() {
  const [address, setAddress] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [notice, setNotice] = useState("Enter a participant wallet to read neutral settlement history.");

  async function load(event: FormEvent) {
    event.preventDefault();
    try {
      const value = await readContract("get_participant_stats", [address.trim()]);
      setStats(value as Stats);
      setNotice("Loaded " + short(address));
    } catch (error: any) {
      setStats(null);
      setNotice(error?.message || "Unable to read participant statistics.");
    }
  }

  return (
    <>
      <div className="sectionHead">
        <div>
          <div className="eyebrow">Participant Ledger</div>
          <h1 style={{ fontSize: "56px" }}>
            Settlement history without a subjective star rating.
          </h1>
        </div>
      </div>

      <form className="panel" onSubmit={load}>
        <div className="formGrid">
          <div className="field full">
            <label>Participant wallet</label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="0x..."
              required
            />
          </div>
        </div>
        <div className="actions">
          <button className="button">Read on-chain history</button>
        </div>
      </form>

      <div className="status">{notice}</div>

      {stats && (
        <section className="grid3 section">
          <div className="metric">
            <span>Accepted / paid steps</span>
            <strong>
              {String(stats.steps_accepted ?? 0)} / {String(stats.steps_paid ?? 0)}
            </strong>
            <span>Direct contract counters</span>
          </div>
          <div className="metric">
            <span>Completed workflows</span>
            <strong>{String(stats.workflows_completed ?? 0)}</strong>
            <span>Counted once per workflow, not once per step</span>
          </div>
          <div className="metric">
            <span>Rewards earned</span>
            <strong>{formatGen(stats.total_rewards ?? 0)}</strong>
            <span>Native GEN step rewards</span>
          </div>
          <div className="metric">
            <span>Bonds returned</span>
            <strong>{String(stats.bonds_returned ?? 0)}</strong>
            <span>{formatGen(stats.total_bond_returned ?? 0)}</span>
          </div>
          <div className="metric">
            <span>Bonds slashed</span>
            <strong>{String(stats.bonds_slashed ?? 0)}</strong>
            <span>{formatGen(stats.total_bond_slashed ?? 0)}</span>
          </div>
          <div className="metric">
            <span>Interpretation</span>
            <strong>Neutral facts</strong>
            <span>ResolveGraph does not convert these counters into a reputation score.</span>
          </div>
        </section>
      )}
    </>
  );
}

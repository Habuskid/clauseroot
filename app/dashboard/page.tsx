"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  CLAUSEROOT_GOVERNOR,
  CLAUSEROOT_TARGET,
  isContractAddress,
  readGovernorState,
  readTargetState,
  shortenAddress,
} from "../../lib/genlayer";
import { Page, PanelTitle } from "../components/page-ui";

export default function Overview() {
  const [governor, setGovernor] = useState(CLAUSEROOT_GOVERNOR);
  const [target, setTarget] = useState(CLAUSEROOT_TARGET);
  const [state, setState] = useState<{
    value: string;
    version: string;
    feeBps: string;
    governanceFinalized: boolean;
  } | null>(null);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadState() {
    setNotice("");
    setState(null);

    if (!isContractAddress(governor) || !isContractAddress(target)) {
      setNotice("Enter valid Governor and target addresses.");
      return;
    }

    setLoading(true);
    try {
      const linked = await readGovernorState(governor as `0x${string}`);
      if (linked.target.toLowerCase() !== target.toLowerCase()) {
        setNotice(
          `Governor points to ${shortenAddress(linked.target)}, not the target entered.`,
        );
        return;
      }
      setState(await readTargetState(target as `0x${string}`));
    } catch (cause) {
      setNotice(
        cause instanceof Error ? cause.message : "Could not read this deployment.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadState();
    // Load the canonical Studio Next deployment once on entry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Page
      title="Overview"
      kicker="GOVERNED PROTOCOL / CONTROL PLANE"
      intro="Read the live ClauseRoot deployment, verify the Governor link, and inspect the protocol state validators actually govern."
    >
      <section className="hero-row">
        <div>
          <p className="eyebrow">GENLAYER STUDIO NEXT</p>
          <h1>Protocol overview</h1>
          <p className="lede">
            ClauseRoot makes upgrade authority and constitutional state
            inspectable before any proposal is signed.
          </p>
        </div>
        <div className="version-block">
          <span>ACTIVE VERSION</span>
          <strong>{state?.version ?? (loading ? "…" : "—")}</strong>
          <small>
            {state
              ? `${Number(state.feeBps) / 100}% fee · stored value: ${state.value}`
              : loading
                ? "reading Studio Next"
                : "live deployment unavailable"}
          </small>
        </div>
      </section>

      <section className="panel deployment-panel">
        <PanelTitle
          label="LIVE DEPLOYMENT"
          title="Canonical Studio Next pair"
          note="READS ON-CHAIN"
        />
        <p className="muted">
          The production Governor and governed target are preloaded. You can
          replace either address to inspect another deployment; ClauseRoot still
          verifies the Governor-to-target link on-chain.
        </p>
        <div className="field-row">
          <label>
            Governor address
            <input
              value={governor}
              onChange={(event) => setGovernor(event.target.value)}
              placeholder="0x…"
            />
          </label>
          <label>
            Target address
            <input
              value={target}
              onChange={(event) => setTarget(event.target.value)}
              placeholder="0x…"
            />
          </label>
          <button className="outline-button" onClick={loadState} disabled={loading}>
            {loading ? "READING…" : "Refresh live state ↗"}
          </button>
        </div>
        {notice && <p className="notice">{notice}</p>}
      </section>

      <div className="two-column">
        <section className="panel">
          <PanelTitle
            label="CONSTITUTION"
            title="Fixed clauses"
            note="4 CHECKS"
          />
          <div className="clause-list">
            {[
              ["C1", "Fee ceiling", "Fee must not exceed 2%."],
              ["C2", "User custody", "No arbitrary administrator path."],
              ["C3", "Withdrawal right", "Users retain a direct withdrawal path."],
              ["C4", "Governor bypass", "Upgrade authority remains governed."],
            ].map(([id, title, copy]) => (
              <div className="clause" key={id}>
                <b>{id}</b>
                <div>
                  <strong>{title}</strong>
                  <p>{copy}</p>
                </div>
                <span className="clause-state">
                  {state ? "ACTIVE RULE" : "NOT LOADED"}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <PanelTitle label="GOVERNANCE" title="Authority status" />
          <div className="status-stack">
            <Status
              label="Governor / target link"
              value={state ? "VERIFIED" : loading ? "READING" : "NOT VERIFIED"}
            />
            <Status
              label="Bootstrap authority"
              value={
                state?.governanceFinalized
                  ? "DISABLED"
                  : state
                    ? "CHECK REQUIRED"
                    : "—"
              }
            />
            <Status label="Protocol version" value={state?.version ?? "—"} />
            <Status
              label="Protocol fee"
              value={state ? `${Number(state.feeBps) / 100}%` : "—"}
            />
            <Status
              label="Target storage"
              value={state ? state.value : "—"}
            />
          </div>
          <div className="next-step">
            <span>NEXT STEP</span>
            <Link href="/activity">Inspect proposal evidence ↗</Link>
          </div>
        </section>
      </div>
    </Page>
  );
}

function Status({ label, value }: { label: string; value: string }) {
  return (
    <div className="status-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

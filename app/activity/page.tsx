"use client";

import { useEffect, useState } from "react";
import { Page, PanelTitle } from "../components/page-ui";
import {
  CLAUSEROOT_GOVERNOR,
  isContractAddress,
  readClient,
  shortenAddress,
} from "../../lib/genlayer";

type Proposal = {
  id: string | number | bigint;
  version: string;
  source_url: string;
  decision: string;
  violations: string;
  proposer: string;
  executed: boolean;
};

export default function ActivityPage() {
  const [governor, setGovernor] = useState(CLAUSEROOT_GOVERNOR);
  const [records, setRecords] = useState<Proposal[]>([]);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    setNotice("");
    setRecords([]);

    if (!isContractAddress(governor)) {
      setNotice("Enter a valid deployed Governor address.");
      return;
    }

    setLoading(true);
    try {
      const address = governor as `0x${string}`;
      const rawCount = await readClient.readContract({
        address,
        functionName: "get_proposal_count",
        args: [],
      });
      const count = Number(rawCount);
      const first = Math.max(1, count - 19);
      const ids = Array.from(
        { length: Math.max(0, count - first + 1) },
        (_, index) => count - index,
      );
      const loaded = await Promise.all(
        ids.map(
          async (id) =>
            (await readClient.readContract({
              address,
              functionName: "get_proposal",
              args: [BigInt(id)],
            })) as unknown as Proposal,
        ),
      );
      setRecords(loaded);
      if (count === 0) setNotice("This Governor has no proposals.");
    } catch (cause) {
      setNotice(
        cause instanceof Error ? cause.message : "Could not read proposal history.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // Load the canonical Governor once on entry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Page
      title="Activity"
      kicker="AUDIT TRAIL / ON-CHAIN EVIDENCE"
      intro="Read the real ClauseRoot proposal decisions directly from the Governor contract. The history below is not backed by a database or fixture data."
    >
      <section className="panel deployment-panel">
        <PanelTitle label="GOVERNOR" title="Live proposal history" note="LATEST 20" />
        <div className="field-row single-action">
          <label>
            Governor address
            <input
              value={governor}
              onChange={(event) => setGovernor(event.target.value)}
              placeholder="0x…"
            />
          </label>
          <button className="outline-button" type="button" onClick={load} disabled={loading}>
            {loading ? "LOADING…" : "Refresh history ↗"}
          </button>
        </div>
        {notice && <p className="notice">{notice}</p>}
      </section>

      <section className="panel activity-panel">
        <PanelTitle
          label="HISTORY"
          title="On-chain proposals"
          note={`${records.length} RECORDS`}
        />
        {records.length === 0 ? (
          <div className="empty-state">
            <span>◇</span>
            <strong>{loading ? "Reading Studio Next" : "No records loaded"}</strong>
            <p>
              {loading
                ? "Fetching authoritative proposal state from the live Governor."
                : "Refresh the canonical Governor or enter another deployment."}
            </p>
          </div>
        ) : (
          <div className="proposal-table" role="table">
            <div className="proposal-row header" role="row">
              <span>ID</span>
              <span>VERSION</span>
              <span>DECISION</span>
              <span>VIOLATIONS</span>
              <span>PROPOSER</span>
            </div>
            {records.map((record) => (
              <div className="proposal-row" role="row" key={String(record.id)}>
                <strong>#{String(record.id)}</strong>
                <span>{record.version}</span>
                <b className={record.decision === "APPROVE" ? "approved" : "rejected"}>
                  {record.decision}
                </b>
                <code>{record.violations || "NONE"}</code>
                <code>{shortenAddress(String(record.proposer))}</code>
              </div>
            ))}
          </div>
        )}
      </section>
    </Page>
  );
}

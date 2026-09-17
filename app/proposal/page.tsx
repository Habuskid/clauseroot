"use client";

import { FormEvent, useState } from "react";
import { Page, PanelTitle } from "../components/page-ui";
import { useWallet } from "../components/wallet-button";
import { isContractAddress, readClient } from "../../lib/genlayer";
import { createClauseRootTransactionKit } from "../../lib/transaction-kit";

type Lifecycle =
  | "IDLE"
  | "ESTIMATING"
  | "SIGNING"
  | "SUBMITTED"
  | "FINALIZING"
  | "FINALIZED"
  | "FAILED";

type ProposalRecord = {
  id: string;
  version: string;
  source_url: string;
  decision: string;
  violations: string;
  proposer: string;
  executed: boolean;
};

export default function ProposalPage() {
  const { address, provider, connect } = useWallet();
  const [governor, setGovernor] = useState("");
  const [version, setVersion] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [source, setSource] = useState("");
  const [stage, setStage] = useState<Lifecycle>("IDLE");
  const [notice, setNotice] = useState("");
  const [txId, setTxId] = useState("");
  const [children, setChildren] = useState<string[]>([]);
  const [proposal, setProposal] = useState<ProposalRecord | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    setTxId("");
    setChildren([]);
    setProposal(null);

    if (!isContractAddress(governor)) {
      setNotice("Enter a valid deployed Governor address.");
      return;
    }

    if (!address || !provider) {
      const connected = await connect();
      setNotice(
        connected
          ? "Wallet connected. Review the proposal and submit again to estimate fees and sign it."
          : "Connect a Studio Next wallet before submitting.",
      );
      return;
    }

    try {
      const account = address as `0x${string}`;
      const contract = governor as `0x${string}`;
      const kit = createClauseRootTransactionKit(provider, account);
      const tx = {
        kind: "write" as const,
        address: contract,
        method: "propose_upgrade",
        args: [version, sourceUrl, new TextEncoder().encode(source)],
      };

      setStage("ESTIMATING");
      const quote = await kit.estimate({ preset: "standard" }, tx);
      if (quote.verification.status === "mismatch") {
        throw new Error(
          "Studio Next fee policy changed while quoting. Re-submit to get a fresh verified quote.",
        );
      }

      setStage("SIGNING");
      const { genlayerTxId } = await kit.submit(quote, tx);
      setTxId(String(genlayerTxId));
      setStage("SUBMITTED");

      const tracked = await kit.track(
        genlayerTxId,
        (status) => {
          if (
            status.phase === "processing" ||
            status.phase === "decided" ||
            status.phase === "finalized"
          ) {
            setStage("FINALIZING");
          }
        },
        { until: "finalized" },
      );

      if (tracked.successful !== true) {
        throw new Error(
          `Proposal finalized without successful execution (${tracked.statusName ?? "unknown status"} / ${tracked.executionResultName ?? "unknown result"}).`,
        );
      }

      let childIds: string[] = [];
      try {
        const triggered = await readClient.getTriggeredTransactionIds({
          hash: genlayerTxId,
        });
        childIds = triggered.map(String);
      } catch {
        childIds = [];
      }
      setChildren(childIds);

      const count = await readClient.readContract({
        address: contract,
        functionName: "get_proposal_count",
        args: [],
      });
      const record = (await readClient.readContract({
        address: contract,
        functionName: "get_proposal",
        args: [count],
      })) as unknown as ProposalRecord;

      setProposal(record);
      setStage("FINALIZED");
    } catch (cause) {
      setStage("FAILED");
      setNotice(
        cause instanceof Error ? cause.message : "Proposal submission failed.",
      );
    }
  }

  const busy =
    stage === "ESTIMATING" ||
    stage === "SIGNING" ||
    stage === "SUBMITTED" ||
    stage === "FINALIZING";

  const buttonLabel =
    stage === "ESTIMATING"
      ? "ESTIMATING STUDIO NEXT FEES…"
      : stage === "SIGNING"
        ? "CONFIRM IN WALLET…"
        : stage === "FINALIZING" || stage === "SUBMITTED"
          ? "WAITING FOR FINALITY…"
          : "Submit proposal ↗";

  return (
    <Page
      title="New proposal"
      kicker="PROPOSAL / SOURCE REVIEW"
      intro="Submit exact contract bytes and a commit-pinned public source URL. Transaction Kit quotes Studio Next fees, your wallet signs the transaction, and validators decide the constitutional result."
    >
      <section className="panel narrow-panel">
        <PanelTitle
          label="SOURCE PAYLOAD"
          title="Review before signing"
          note={address ? "WALLET CONNECTED" : "WALLET REQUIRED"}
        />
        <form className="proposal-form" onSubmit={submit}>
          <label>
            Governor address
            <input
              value={governor}
              onChange={(event) => setGovernor(event.target.value)}
              placeholder="0x…"
              required
            />
          </label>
          <div className="two-fields">
            <label>
              Proposed version
              <input
                value={version}
                onChange={(event) => setVersion(event.target.value)}
                placeholder="e.g. 2.0"
                required
              />
            </label>
            <label>
              Commit-pinned raw GitHub URL
              <input
                value={sourceUrl}
                onChange={(event) => setSourceUrl(event.target.value)}
                placeholder="https://raw.githubusercontent.com/owner/repo/40-char-commit/contract.py"
                required
              />
            </label>
          </div>
          <label>
            Exact source bytes
            <textarea
              value={source}
              onChange={(event) => setSource(event.target.value)}
              placeholder="Paste the exact source served by the immutable URL"
              rows={12}
              required
            />
          </label>
          <button className="primary-button" type="submit" disabled={busy}>
            {buttonLabel}
          </button>
          {notice && (
            <p className="notice" role="alert">
              {notice}
            </p>
          )}
        </form>
      </section>

      <section className="panel lifecycle-panel">
        <PanelTitle label="TRANSACTION" title="Consensus lifecycle" note={stage} />
        <div className="status-stack">
          <Result label="Proposal transaction" value={txId || "—"} />
          <Result
            label="Execution result"
            value={
              proposal?.decision ?? (stage === "FINALIZED" ? "FINALIZED" : "—")
            }
          />
          <Result
            label="Violations"
            value={proposal?.violations || (proposal ? "NONE" : "—")}
          />
          <Result
            label="Upgrade scheduled"
            value={proposal ? (proposal.executed ? "YES" : "NO") : "—"}
          />
          <Result label="Child transaction" value={children[0] ?? "—"} />
        </div>
      </section>
    </Page>
  );
}

function Result({ label, value }: { label: string; value: string }) {
  return (
    <div className="status-row">
      <span>{label}</span>
      <code>{value}</code>
    </div>
  );
}

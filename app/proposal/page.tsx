"use client";

import { FormEvent, useState } from "react";
import { createClient } from "genlayer-js";
import { ExecutionResult, TransactionStatus } from "genlayer-js/types";
import { Page, PanelTitle } from "../components/page-ui";
import { useWallet } from "../components/wallet-button";
import { GENLAYER_CHAIN, GENLAYER_NETWORK, isContractAddress, readClient } from "../../lib/genlayer";

type Lifecycle = "IDLE" | "SIGNING" | "SUBMITTED" | "FINALIZING" | "FINALIZED" | "FAILED";
type ProposalRecord = { id: string; version: string; source_url: string; decision: string; violations: string; proposer: string; executed: boolean };

export default function ProposalPage() {
  const { address, provider, connect } = useWallet();
  const [governor, setGovernor] = useState(""); const [version, setVersion] = useState(""); const [sourceUrl, setSourceUrl] = useState(""); const [source, setSource] = useState("");
  const [stage, setStage] = useState<Lifecycle>("IDLE"); const [notice, setNotice] = useState(""); const [txId, setTxId] = useState(""); const [children, setChildren] = useState<string[]>([]); const [proposal, setProposal] = useState<ProposalRecord | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setNotice(""); setTxId(""); setChildren([]); setProposal(null);
    if (!isContractAddress(governor)) { setNotice("Enter a valid deployed Governor address."); return; }
    if (!address || !provider) { await connect(); setNotice("Wallet connected. Review the proposal and submit again to sign it."); return; }
    setStage("SIGNING");
    try {
      const writeClient = createClient({ chain: GENLAYER_CHAIN, account: address as `0x${string}`, provider });
      await writeClient.connect(GENLAYER_NETWORK);
      const hash = await writeClient.writeContract({ address: governor as `0x${string}`, functionName: "propose_upgrade", args: [version, sourceUrl, new TextEncoder().encode(source)], value: BigInt(0) });
      setTxId(hash); setStage("SUBMITTED"); setStage("FINALIZING");
      const receipt = await readClient.waitForTransactionReceipt({ hash, status: TransactionStatus.FINALIZED, interval: 3000, retries: 100 });
      if (receipt.txExecutionResultName !== ExecutionResult.FINISHED_WITH_RETURN) throw new Error(`Proposal finalized without successful execution (${receipt.txExecutionResultName ?? "unknown result"}).`);
      const childIds = await readClient.getTriggeredTransactionIds({ hash });
      setChildren(childIds);
      const count = await readClient.readContract({ address: governor as `0x${string}`, functionName: "get_proposal_count", args: [] });
      const record = await readClient.readContract({ address: governor as `0x${string}`, functionName: "get_proposal", args: [count] }) as unknown as ProposalRecord;
      setProposal(record); setStage("FINALIZED");
    } catch (cause) { setStage("FAILED"); setNotice(cause instanceof Error ? cause.message : "Proposal submission failed."); }
  }

  const busy = stage === "SIGNING" || stage === "SUBMITTED" || stage === "FINALIZING";
  return <Page title="New proposal" kicker="PROPOSAL / SOURCE REVIEW" intro="Submit exact contract bytes and a commit-pinned public source URL. Your wallet signs the transaction; validators decide the constitutional result."><section className="panel narrow-panel"><PanelTitle label="SOURCE PAYLOAD" title="Review before signing" note={address ? "WALLET CONNECTED" : "WALLET REQUIRED"}/><form className="proposal-form" onSubmit={submit}><label>Governor address<input value={governor} onChange={e => setGovernor(e.target.value)} placeholder="0x…" required /></label><div className="two-fields"><label>Proposed version<input value={version} onChange={e => setVersion(e.target.value)} placeholder="e.g. 2.0" required /></label><label>Commit-pinned raw GitHub URL<input value={sourceUrl} onChange={e => setSourceUrl(e.target.value)} placeholder="https://raw.githubusercontent.com/owner/repo/40-char-commit/contract.py" required /></label></div><label>Exact source bytes<textarea value={source} onChange={e => setSource(e.target.value)} placeholder="Paste the exact source served by the immutable URL" rows={12} required /></label><button className="primary-button" type="submit" disabled={busy}>{stage === "SIGNING" ? "CONFIRM IN WALLET…" : stage === "FINALIZING" ? "WAITING FOR FINALITY…" : "Submit proposal ↗"}</button>{notice && <p className="notice" role="alert">{notice}</p>}</form></section><section className="panel lifecycle-panel"><PanelTitle label="TRANSACTION" title="Consensus lifecycle" note={stage}/><div className="status-stack"><Result label="Proposal transaction" value={txId || "—"}/><Result label="Execution result" value={proposal?.decision ?? (stage === "FINALIZED" ? "FINALIZED" : "—")}/><Result label="Violations" value={proposal?.violations || (proposal ? "NONE" : "—")}/><Result label="Upgrade scheduled" value={proposal ? (proposal.executed ? "YES" : "NO") : "—"}/><Result label="Child transaction" value={children[0] ?? "—"}/></div></section></Page>;
}

function Result({ label, value }: { label: string; value: string }) { return <div className="status-row"><span>{label}</span><code>{value}</code></div>; }

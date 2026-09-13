"use client";
import { useEffect, useState } from "react";
import { createClient } from "genlayer-js";
import { localnet } from "genlayer-js/chains";

declare global { interface Window { ethereum?: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown>; on?: (event: string, cb: (...args: unknown[]) => void) => void; removeListener?: (event: string, cb: (...args: unknown[]) => void) => void; }; } }

export function WalletButton({ onConnected }: { onConnected?: (address: string) => void }) {
  const [address, setAddress] = useState(""); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function connect() {
    setError(""); if (!window.ethereum) { setError("Install a browser wallet with an EIP-1193 provider first."); return; }
    setBusy(true);
    try { const accounts = await window.ethereum.request({ method: "eth_requestAccounts" }) as string[]; const next = accounts[0] ?? ""; const client = createClient({ chain: localnet, account: next as `0x${string}`, provider: window.ethereum }); await client.connect("localnet"); setAddress(next); onConnected?.(next); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Wallet connection failed."); } finally { setBusy(false); }
  }
  useEffect(() => { const handler = (...args: unknown[]) => { const accounts = args[0] as string[]; const next = accounts?.[0] ?? ""; setAddress(next); onConnected?.(next); }; window.ethereum?.on?.("accountsChanged", handler); return () => window.ethereum?.removeListener?.("accountsChanged", handler); }, [onConnected]);
  return <div className="wallet-wrap"><button className="wallet-button" type="button" onClick={connect} disabled={busy}>{busy ? "CONNECTING…" : address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "CONNECT WALLET"}</button>{error && <span className="wallet-error" role="alert">{error}</span>}</div>;
}

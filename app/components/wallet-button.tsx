"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createClient } from "genlayer-js";
import { GENLAYER_CHAIN, GENLAYER_NETWORK } from "../../lib/genlayer";

export type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, cb: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, cb: (...args: unknown[]) => void) => void;
};

declare global { interface Window { ethereum?: EthereumProvider; } }

type WalletState = { address: string; provider: EthereumProvider | null; busy: boolean; error: string; connect: () => Promise<void>; };
const WalletContext = createContext<WalletState | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState(""); const [provider, setProvider] = useState<EthereumProvider | null>(null); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function connect() {
    setError(""); if (!window.ethereum) { setError("Install a browser wallet with an EIP-1193 provider first."); return; }
    setBusy(true);
    try { const accounts = await window.ethereum.request({ method: "eth_requestAccounts" }) as string[]; const next = accounts[0] ?? ""; if (!next) throw new Error("The wallet returned no account."); const client = createClient({ chain: GENLAYER_CHAIN, account: next as `0x${string}`, provider: window.ethereum }); await client.connect(GENLAYER_NETWORK); setProvider(window.ethereum); setAddress(next); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Wallet connection failed."); } finally { setBusy(false); }
  }
  useEffect(() => { const handler = (...args: unknown[]) => { const accounts = args[0] as string[]; setAddress(accounts?.[0] ?? ""); }; window.ethereum?.on?.("accountsChanged", handler); return () => window.ethereum?.removeListener?.("accountsChanged", handler); }, []);
  const value = useMemo(() => ({ address, provider, busy, error, connect }), [address, provider, busy, error]);
  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletState { const wallet = useContext(WalletContext); if (!wallet) throw new Error("useWallet must be used inside WalletProvider"); return wallet; }
export function WalletButton() { const { address, busy, error, connect } = useWallet(); return <div className="wallet-wrap"><button className="wallet-button" type="button" onClick={connect} disabled={busy}>{busy ? "CONNECTING…" : address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "CONNECT WALLET"}</button>{error && <span className="wallet-error" role="alert">{error}</span>}</div>; }

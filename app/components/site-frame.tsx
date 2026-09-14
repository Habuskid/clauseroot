"use client";

import { usePathname } from "next/navigation";
import { AppShell } from "./app-shell";
import { useWallet } from "./wallet-button";

export function SiteFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { initialized, authenticated, address, chainId, busy, error, connect } = useWallet();
  if (pathname === "/") return children;
  if (!initialized) return <main className="access-screen"><div className="access-card"><span className="mark">CR</span><p>Inspecting wallet connection…</p></div></main>;
  if (!authenticated) return <main className="access-screen"><div className="access-card"><p className="eyebrow">PROTOCOL CONSOLE</p><h1>{address ? "Switch to Bradbury" : "Connect your wallet"}</h1><p>{address ? `Your wallet is connected on chain ${chainId ?? "unknown"}. ClauseRoot requires Bradbury Testnet (4221).` : "Authorize a browser wallet to enter the console. ClauseRoot does not receive or store your private key."}</p><button className="primary-button" type="button" onClick={connect} disabled={busy}>{busy ? "CHECK YOUR WALLET…" : address ? "Switch network ↗" : "Connect wallet ↗"}</button>{error && <p className="notice" role="alert">{error}</p>}<a href="/">← Return to landing page</a></div></main>;
  return <AppShell>{children}</AppShell>;
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "./wallet-button";

export function LandingAction() {
  const router = useRouter(); const { authenticated, busy, error, connect } = useWallet();
  useEffect(() => { if (authenticated) router.prefetch("/dashboard"); }, [authenticated, router]);
  async function enter() { if (authenticated || await connect()) router.push("/dashboard"); }
  return <div className="landing-action"><button className="landing-primary" type="button" onClick={enter} disabled={busy}>{busy ? "CHECK YOUR WALLET…" : authenticated ? "Enter console ↗" : "Connect wallet ↗"}</button><a href="#how-it-works">How it works</a>{error && <p className="notice" role="alert">{error}</p>}</div>;
}

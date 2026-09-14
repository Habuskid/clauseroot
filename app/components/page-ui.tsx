import React from "react";
import { GENLAYER_CHAIN_ID_DECIMAL } from "../../lib/genlayer";
export function Page({ title, kicker, intro, children }: { title: string; kicker: string; intro: string; children: React.ReactNode }) { return <><div className="page-heading"><p className="eyebrow">{kicker}</p><h1>{title}</h1><p className="lede">{intro}</p></div>{children}<footer><span>ClauseRoot v0.1</span><span>State over spectacle.</span><span>GenLayer Bradbury / chain {GENLAYER_CHAIN_ID_DECIMAL}</span></footer></>; }
export function PanelTitle({ label, title, note }: { label: string; title: string; note?: string }) { return <div className="panel-title"><div><span className="section-label">{label}</span><h2>{title}</h2></div>{note && <span className="panel-note">{note}</span>}</div>; }

"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletButton } from "./wallet-button";
import { GENLAYER_CHAIN_ID_DECIMAL, GENLAYER_NETWORK_LABEL, GENLAYER_RPC_URL } from "../../lib/genlayer";
const links = [["/dashboard", "Overview"], ["/proposal", "New proposal"], ["/activity", "Activity"], ["/settings", "Settings"]];
export function AppShell({ children }: { children: React.ReactNode }) { return <div className="app-frame"><header className="topbar"><Link className="brand" href="/"><Image className="brand-root-logo" src="/root-logo.png" alt="ClauseRoot root logo" width={34} height={34} priority /><span>ClauseRoot</span></Link><span className="header-description">Constitutional upgrade control</span><div className="header-state"><span className="live-dot" /> {GENLAYER_NETWORK_LABEL}</div><WalletButton /></header><div className="body-frame"><aside className="side-nav" aria-label="Primary navigation"><p className="nav-caption">CONTROL PLANE</p>{links.map(([href, label]) => <NavItem key={href} href={href} label={label} />)}<div className="nav-foot"><p className="nav-caption">NETWORK</p><code>{new URL(GENLAYER_RPC_URL).host}</code><span>Chain ID {GENLAYER_CHAIN_ID_DECIMAL}</span></div></aside><main className="page-content">{children}</main></div></div>; }
function NavItem({ href, label }: { href: string; label: string }) { const pathname = usePathname(); return <Link className={`nav-item ${pathname === href ? "active" : ""}`} href={href}>{label}<span>↗</span></Link>; }

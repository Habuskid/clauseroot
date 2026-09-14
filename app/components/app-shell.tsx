"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletButton, WalletProvider } from "./wallet-button";
import { LOCALNET_CHAIN_ID_DECIMAL } from "../../lib/genlayer";
const links = [["/", "Overview"], ["/proposal", "New proposal"], ["/activity", "Activity"], ["/settings", "Settings"]];
export function AppShell({ children }: { children: React.ReactNode }) { return <WalletProvider><div className="app-frame"><header className="topbar"><Link className="brand" href="/"><span className="mark">CR</span><span>ClauseRoot</span></Link><span className="header-description">Constitutional upgrade control</span><div className="header-state"><span className="live-dot" /> LOCALNET</div><WalletButton /></header><div className="body-frame"><aside className="side-nav" aria-label="Primary navigation"><p className="nav-caption">CONTROL PLANE</p>{links.map(([href, label]) => <NavItem key={href} href={href} label={label} />)}<div className="nav-foot"><p className="nav-caption">NETWORK</p><code>127.0.0.1:4000</code><span>Chain ID {LOCALNET_CHAIN_ID_DECIMAL}</span></div></aside><main className="page-content">{children}</main></div></div></WalletProvider>; }
function NavItem({ href, label }: { href: string; label: string }) { const pathname = usePathname(); return <Link className={`nav-item ${pathname === href ? "active" : ""}`} href={href}>{label}<span>↗</span></Link>; }

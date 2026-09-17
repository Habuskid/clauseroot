"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppShell } from "./app-shell";
import { useWallet } from "./wallet-button";

export function SiteFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { initialized, authenticated } = useWallet();
  const isLanding = pathname === "/";

  useEffect(() => {
    if (isLanding || !initialized || authenticated) return;

    // Any loss of the authenticated wallet session (manual logout, account
    // permission removal, account disconnect, or leaving the required chain)
    // closes the protected console and returns the user to the public landing.
    router.replace("/");
  }, [authenticated, initialized, isLanding, router]);

  if (isLanding) return children;

  if (!initialized || !authenticated) {
    return (
      <main className="access-screen">
        <div className="access-card">
          <span className="mark">CR</span>
          <p>{initialized ? "Returning to ClauseRoot…" : "Inspecting wallet connection…"}</p>
        </div>
      </main>
    );
  }

  return <AppShell>{children}</AppShell>;
}

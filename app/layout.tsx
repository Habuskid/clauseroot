import type { Metadata } from "next";
import "./globals.css";
import { SiteFrame } from "./components/site-frame";
import { WalletProvider } from "./components/wallet-button";

export const metadata: Metadata = {
  title: "ClauseRoot Protocol Console",
  description: "Constitutional upgrade control for GenLayer intelligent contracts.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><WalletProvider><SiteFrame>{children}</SiteFrame></WalletProvider></body></html>;
}

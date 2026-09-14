"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { GENLAYER_CHAIN, GENLAYER_CHAIN_ID_DECIMAL } from "../../lib/genlayer";

export type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, cb: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, cb: (...args: unknown[]) => void) => void;
};

declare global { interface Window { ethereum?: EthereumProvider; } }

type WalletState = { address: string; provider: EthereumProvider | null; chainId: number | null; initialized: boolean; authenticated: boolean; busy: boolean; error: string; connect: () => Promise<boolean>; };
const WalletContext = createContext<WalletState | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState(""); const [provider, setProvider] = useState<EthereumProvider | null>(null); const [chainId, setChainId] = useState<number | null>(null); const [initialized, setInitialized] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function connect() {
    setError(""); if (!window.ethereum) { setError("Install MetaMask or another EIP-1193 browser wallet first."); return false; }
    setBusy(true);
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" }) as string[]; const next = accounts[0] ?? ""; if (!next) throw new Error("The wallet returned no account.");
      setProvider(window.ethereum); setAddress(next);
      const chainHex = `0x${GENLAYER_CHAIN_ID_DECIMAL.toString(16)}`;
      const current = await window.ethereum.request({ method: "eth_chainId" }) as string;
      if (current.toLowerCase() !== chainHex) {
        try { await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: chainHex }] }); }
        catch (switchError) {
          if (getErrorCode(switchError) !== 4902) throw switchError;
          await window.ethereum.request({ method: "wallet_addEthereumChain", params: [{ chainId: chainHex, chainName: GENLAYER_CHAIN.name, rpcUrls: [...GENLAYER_CHAIN.rpcUrls.default.http], nativeCurrency: GENLAYER_CHAIN.nativeCurrency, blockExplorerUrls: GENLAYER_CHAIN.blockExplorers ? [GENLAYER_CHAIN.blockExplorers.default.url] : [] }] });
          await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: chainHex }] });
        }
      }
      setChainId(GENLAYER_CHAIN_ID_DECIMAL); return true;
    }
    catch (cause) { setError(walletError(cause)); return false; } finally { setBusy(false); }
  }
  useEffect(() => {
    const injected = window.ethereum; if (!injected) { setInitialized(true); return; }
    setProvider(injected);
    Promise.all([injected.request({ method: "eth_accounts" }), injected.request({ method: "eth_chainId" })]).then(([accounts, chain]) => { setAddress((accounts as string[])[0] ?? ""); setChainId(Number.parseInt(chain as string, 16)); }).catch(() => setError("The browser wallet could not be inspected.")).finally(() => setInitialized(true));
    const accountHandler = (...args: unknown[]) => setAddress((args[0] as string[])?.[0] ?? "");
    const chainHandler = (...args: unknown[]) => setChainId(Number.parseInt(args[0] as string, 16));
    injected.on?.("accountsChanged", accountHandler); injected.on?.("chainChanged", chainHandler);
    return () => { injected.removeListener?.("accountsChanged", accountHandler); injected.removeListener?.("chainChanged", chainHandler); };
  }, []);
  const authenticated = Boolean(address) && chainId === GENLAYER_CHAIN_ID_DECIMAL;
  const value = useMemo(() => ({ address, provider, chainId, initialized, authenticated, busy, error, connect }), [address, provider, chainId, initialized, authenticated, busy, error]);
  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletState { const wallet = useContext(WalletContext); if (!wallet) throw new Error("useWallet must be used inside WalletProvider"); return wallet; }
export function WalletButton() { const { address, busy, error, connect } = useWallet(); return <div className="wallet-wrap"><button className="wallet-button" type="button" onClick={connect} disabled={busy}>{busy ? "CONNECTING…" : address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "CONNECT WALLET"}</button>{error && <span className="wallet-error" role="alert">{error}</span>}</div>; }

function getErrorCode(cause: unknown): number | undefined { return typeof cause === "object" && cause !== null && "code" in cause ? Number((cause as { code: unknown }).code) : undefined; }
function walletError(cause: unknown): string { const code = getErrorCode(cause); if (code === 4001) return "Wallet request cancelled. Approve account access and the Bradbury network switch to continue."; if (code === -32002) return "A wallet request is already open. Complete it in the wallet extension."; return cause instanceof Error && cause.message ? cause.message : "The wallet could not connect to Bradbury Testnet."; }

"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  GENLAYER_CHAIN,
  GENLAYER_CHAIN_ID_DECIMAL,
  GENLAYER_CHAIN_ID_HEX,
  GENLAYER_EXPLORER_URL,
  GENLAYER_RPC_URL,
} from "../../lib/genlayer";

const DISCONNECT_FLAG = "clauseroot_wallet_disconnected";

export type EthereumProvider = {
  isMetaMask?: boolean;
  providers?: EthereumProvider[];
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, cb: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, cb: (...args: unknown[]) => void) => void;
};

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

type WalletState = {
  address: string;
  provider: EthereumProvider | null;
  chainId: number | null;
  initialized: boolean;
  authenticated: boolean;
  busy: boolean;
  error: string;
  connect: () => Promise<boolean>;
  disconnect: () => Promise<void>;
};

const WalletContext = createContext<WalletState | null>(null);

function getInjectedProvider(): EthereumProvider | null {
  if (typeof window === "undefined" || !window.ethereum) return null;

  const injected = window.ethereum;
  const providers = injected.providers;

  if (Array.isArray(providers) && providers.length > 0) {
    return providers.find((candidate) => candidate.isMetaMask) ?? injected;
  }

  return injected;
}

function wasDisconnected() {
  return (
    typeof window !== "undefined" &&
    window.localStorage.getItem(DISCONNECT_FLAG) === "true"
  );
}

async function readWalletChainId(provider: EthereumProvider): Promise<number> {
  const value = await provider.request({ method: "eth_chainId" });
  if (typeof value !== "string") {
    throw new Error("The wallet returned an invalid chain ID.");
  }

  const parsed = Number.parseInt(value, 16);
  if (!Number.isSafeInteger(parsed)) {
    throw new Error(`The wallet returned an invalid chain ID: ${value}`);
  }
  return parsed;
}

async function addGenLayerNetwork(provider: EthereumProvider) {
  await provider.request({
    method: "wallet_addEthereumChain",
    params: [
      {
        chainId: GENLAYER_CHAIN_ID_HEX,
        chainName: GENLAYER_CHAIN.name,
        rpcUrls: [GENLAYER_RPC_URL],
        nativeCurrency: GENLAYER_CHAIN.nativeCurrency,
        blockExplorerUrls: [GENLAYER_EXPLORER_URL],
      },
    ],
  });
}

async function switchGenLayerNetwork(provider: EthereumProvider) {
  await provider.request({
    method: "wallet_switchEthereumChain",
    params: [{ chainId: GENLAYER_CHAIN_ID_HEX }],
  });
}

async function ensureGenLayerNetwork(provider: EthereumProvider): Promise<number> {
  const current = await readWalletChainId(provider);
  if (current === GENLAYER_CHAIN_ID_DECIMAL) return current;

  try {
    await switchGenLayerNetwork(provider);
  } catch (switchError) {
    if (getErrorCode(switchError) === 4001) throw switchError;
    if (!isUnknownChainError(switchError)) throw switchError;

    await addGenLayerNetwork(provider);

    if ((await readWalletChainId(provider)) !== GENLAYER_CHAIN_ID_DECIMAL) {
      try {
        await switchGenLayerNetwork(provider);
      } catch (firstSwitchAfterAdd) {
        if (!isUnknownChainError(firstSwitchAfterAdd)) {
          throw firstSwitchAfterAdd;
        }
        await delay(300);
        await switchGenLayerNetwork(provider);
      }
    }
  }

  const verified = await readWalletChainId(provider);
  if (verified !== GENLAYER_CHAIN_ID_DECIMAL) {
    throw new Error(
      `Wallet stayed on chain ${verified}. Switch to GenLayer Studio Dev (${GENLAYER_CHAIN_ID_DECIMAL}) and try again.`,
    );
  }

  return verified;
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState("");
  const [provider, setProvider] = useState<EthereumProvider | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function connect() {
    setError("");
    const injected = getInjectedProvider();
    if (!injected) {
      setError("Install MetaMask or another EIP-1193 browser wallet first.");
      return false;
    }

    setBusy(true);
    setProvider(injected);

    try {
      const accounts = (await injected.request({
        method: "eth_requestAccounts",
      })) as string[];
      const next = accounts[0] ?? "";
      if (!next) throw new Error("The wallet returned no account.");

      const verifiedChain = await ensureGenLayerNetwork(injected);

      window.localStorage.removeItem(DISCONNECT_FLAG);
      setAddress(next);
      setChainId(verifiedChain);
      return true;
    } catch (cause) {
      setAddress("");
      try {
        setChainId(await readWalletChainId(injected));
      } catch {
        setChainId(null);
      }
      setError(walletError(cause));
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    const injected = provider ?? getInjectedProvider();
    window.localStorage.setItem(DISCONNECT_FLAG, "true");
    setAddress("");
    setError("");

    if (!injected) return;

    // MetaMask supports permission revocation. Other EIP-1193 wallets may not,
    // so ClauseRoot always clears its own authenticated session first and then
    // asks the wallet to revoke account access when that method is available.
    try {
      await injected.request({
        method: "wallet_revokePermissions",
        params: [{ eth_accounts: {} }],
      });
    } catch {
      // Local disconnect remains authoritative for the app even when the wallet
      // does not implement wallet_revokePermissions.
    }
  }

  useEffect(() => {
    const injected = getInjectedProvider();
    if (!injected) {
      setInitialized(true);
      return;
    }

    setProvider(injected);
    Promise.all([
      injected.request({ method: "eth_accounts" }),
      injected.request({ method: "eth_chainId" }),
    ])
      .then(([accounts, chain]) => {
        const nextAddress = ((accounts as string[]) ?? [])[0] ?? "";
        setAddress(wasDisconnected() ? "" : nextAddress);
        setChainId(Number.parseInt(chain as string, 16));
      })
      .catch(() => setError("The browser wallet could not be inspected."))
      .finally(() => setInitialized(true));

    const accountHandler = (...args: unknown[]) => {
      const nextAddress = (args[0] as string[])?.[0] ?? "";
      setAddress(wasDisconnected() ? "" : nextAddress);
      setError("");
    };
    const chainHandler = (...args: unknown[]) => {
      setChainId(Number.parseInt(args[0] as string, 16));
      setError("");
    };

    injected.on?.("accountsChanged", accountHandler);
    injected.on?.("chainChanged", chainHandler);

    return () => {
      injected.removeListener?.("accountsChanged", accountHandler);
      injected.removeListener?.("chainChanged", chainHandler);
    };
  }, []);

  const authenticated =
    Boolean(address) && chainId === GENLAYER_CHAIN_ID_DECIMAL;

  const value = useMemo(
    () => ({
      address,
      provider,
      chainId,
      initialized,
      authenticated,
      busy,
      error,
      connect,
      disconnect,
    }),
    [address, provider, chainId, initialized, authenticated, busy, error],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletState {
  const wallet = useContext(WalletContext);
  if (!wallet) throw new Error("useWallet must be used inside WalletProvider");
  return wallet;
}

export function WalletButton() {
  const { address, authenticated, busy, error, connect, disconnect } = useWallet();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handlePrimaryClick() {
    if (authenticated) {
      setMenuOpen((current) => !current);
      return;
    }
    setMenuOpen(false);
    await connect();
  }

  async function handleDisconnect() {
    setMenuOpen(false);
    await disconnect();
  }

  return (
    <div className="wallet-wrap" style={{ position: "relative" }}>
      <button
        className="wallet-button"
        type="button"
        onClick={handlePrimaryClick}
        disabled={busy}
        aria-expanded={authenticated ? menuOpen : undefined}
        aria-haspopup={authenticated ? "menu" : undefined}
      >
        {busy
          ? "CONNECTING…"
          : address && !authenticated
            ? "SWITCH NETWORK"
            : authenticated
              ? `${address.slice(0, 6)}…${address.slice(-4)}  ▾`
              : "CONNECT WALLET"}
      </button>

      {authenticated && menuOpen && (
        <div
          role="menu"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            zIndex: 50,
            width: 230,
            padding: 10,
            border: "1px solid var(--ink)",
            borderRadius: 7,
            background: "var(--paper)",
            boxShadow: "0 10px 28px rgba(0,0,0,.10)",
            textAlign: "left",
          }}
        >
          <div style={{ padding: "4px 6px 10px", borderBottom: "1px solid var(--line)" }}>
            <div style={{ font: "10px monospace", color: "var(--muted)", letterSpacing: ".08em" }}>
              CONNECTED WALLET
            </div>
            <div style={{ marginTop: 6, font: "12px monospace", overflowWrap: "anywhere" }}>
              {address}
            </div>
            <div style={{ marginTop: 6, font: "10px monospace", color: "var(--muted)" }}>
              STUDIO DEV · {GENLAYER_CHAIN_ID_DECIMAL}
            </div>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={handleDisconnect}
            style={{
              width: "100%",
              marginTop: 8,
              padding: "10px 8px",
              border: 0,
              borderRadius: 4,
              background: "transparent",
              color: "#8b1e1e",
              textAlign: "left",
              font: "700 11px monospace",
            }}
          >
            DISCONNECT WALLET
          </button>
        </div>
      )}

      {error && (
        <span className="wallet-error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

function delay(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms));
}

function errorObjects(cause: unknown): Record<string, unknown>[] {
  const queue: unknown[] = [cause];
  const seen = new Set<unknown>();
  const results: Record<string, unknown>[] = [];

  while (queue.length > 0) {
    const item = queue.shift();
    if (typeof item !== "object" || item === null || seen.has(item)) continue;
    seen.add(item);

    const object = item as Record<string, unknown>;
    results.push(object);

    for (const key of ["cause", "error", "data", "originalError"] as const) {
      if (key in object) queue.push(object[key]);
    }
  }

  return results;
}

function getErrorCode(cause: unknown): number | undefined {
  for (const object of errorObjects(cause)) {
    if (!("code" in object)) continue;
    const code = Number(object.code);
    if (Number.isFinite(code)) return code;
  }
  return undefined;
}

function getErrorMessage(cause: unknown): string {
  if (cause instanceof Error && cause.message) return cause.message;

  for (const object of errorObjects(cause)) {
    for (const key of ["shortMessage", "message", "details"] as const) {
      const value = object[key];
      if (typeof value === "string" && value.trim()) return value;
    }
  }

  return "";
}

function isUnknownChainError(cause: unknown): boolean {
  if (getErrorCode(cause) === 4902) return true;

  const message = getErrorMessage(cause).toLowerCase();
  return (
    message.includes("unrecognized chain id") ||
    message.includes("unknown chain") ||
    message.includes("chain has not been added") ||
    message.includes("chain is not added")
  );
}

function walletError(cause: unknown): string {
  const code = getErrorCode(cause);
  if (code === 4001) {
    return "Wallet request cancelled. Approve account access and the GenLayer Studio Dev network request to continue.";
  }
  if (code === -32002) {
    return "A wallet request is already open. Complete it in the wallet extension.";
  }
  if (code === 4200 || code === -32601) {
    return "This wallet does not support automatic custom-network setup. Add GenLayer Studio Dev manually with chain ID 61997 and try again.";
  }
  if (isUnknownChainError(cause)) {
    return "The wallet still does not recognize GenLayer Studio Dev after the add-network request. Approve the network addition in the wallet, then try again.";
  }

  const message = getErrorMessage(cause);
  return message || "The wallet could not connect to GenLayer Studio Dev.";
}

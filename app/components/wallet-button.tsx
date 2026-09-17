"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  GENLAYER_CHAIN,
  GENLAYER_CHAIN_ID_DECIMAL,
  GENLAYER_CHAIN_ID_HEX,
  GENLAYER_EXPLORER_URL,
  GENLAYER_RPC_URL,
} from "../../lib/genlayer";

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
};

const WalletContext = createContext<WalletState | null>(null);

function getInjectedProvider(): EthereumProvider | null {
  if (typeof window === "undefined" || !window.ethereum) return null;

  const injected = window.ethereum;
  const providers = injected.providers;

  if (Array.isArray(providers) && providers.length > 0) {
    // When several extensions inject providers, prefer MetaMask if present.
    // Otherwise use the browser-selected provider instead of guessing another
    // extension. This prevents a secondary wallet from intercepting the flow.
    return providers.find((candidate) => candidate.isMetaMask) ?? injected;
  }

  return injected;
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

    // 0xf22d / 61997 is not present in the wallet yet. Add the exact Studio
    // Dev definition, then explicitly switch. Some wallets auto-switch after
    // add while others register the network asynchronously, so verify and
    // retry the switch once after a short delay when necessary.
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

      // Only mark the wallet authenticated after account access and network
      // verification have both succeeded. Proposal signing is therefore never
      // enabled while the wallet is on another chain.
      setAddress(next);
      setChainId(verifiedChain);
      return true;
    } catch (cause) {
      // Do not leave the UI looking connected after a failed network switch.
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
        setAddress(((accounts as string[]) ?? [])[0] ?? "");
        setChainId(Number.parseInt(chain as string, 16));
      })
      .catch(() => setError("The browser wallet could not be inspected."))
      .finally(() => setInitialized(true));

    const accountHandler = (...args: unknown[]) => {
      setAddress((args[0] as string[])?.[0] ?? "");
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
  const { address, authenticated, busy, error, connect } = useWallet();
  return (
    <div className="wallet-wrap">
      <button
        className="wallet-button"
        type="button"
        onClick={connect}
        disabled={busy}
      >
        {busy
          ? "CONNECTING…"
          : address && !authenticated
            ? "SWITCH NETWORK"
            : authenticated
              ? `${address.slice(0, 6)}…${address.slice(-4)}`
              : "CONNECT WALLET"}
      </button>
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

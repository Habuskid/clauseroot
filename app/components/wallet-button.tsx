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

async function ensureGenLayerNetwork(provider: EthereumProvider): Promise<number> {
  const current = await readWalletChainId(provider);
  if (current === GENLAYER_CHAIN_ID_DECIMAL) return current;

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: GENLAYER_CHAIN_ID_HEX }],
    });
  } catch (switchError) {
    if (getErrorCode(switchError) === 4001) throw switchError;
    if (getErrorCode(switchError) !== 4902) throw switchError;

    await addGenLayerNetwork(provider);

    const afterAdd = await readWalletChainId(provider);
    if (afterAdd !== GENLAYER_CHAIN_ID_DECIMAL) {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: GENLAYER_CHAIN_ID_HEX }],
      });
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
    const injected = window.ethereum;
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
      // verification have both succeeded.
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
    const injected = window.ethereum;
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

function getErrorCode(cause: unknown): number | undefined {
  if (typeof cause !== "object" || cause === null) return undefined;

  if ("code" in cause) {
    const code = Number((cause as { code: unknown }).code);
    if (Number.isFinite(code)) return code;
  }

  if ("cause" in cause) {
    return getErrorCode((cause as { cause: unknown }).cause);
  }

  return undefined;
}

function getErrorMessage(cause: unknown): string {
  if (cause instanceof Error && cause.message) return cause.message;
  if (typeof cause !== "object" || cause === null) return "";

  for (const key of ["shortMessage", "message", "details"] as const) {
    if (key in cause) {
      const value = (cause as Record<string, unknown>)[key];
      if (typeof value === "string" && value.trim()) return value;
    }
  }

  if ("cause" in cause) {
    return getErrorMessage((cause as { cause: unknown }).cause);
  }

  return "";
}

function walletError(cause: unknown): string {
  const code = getErrorCode(cause);
  if (code === 4001) {
    return "Wallet request cancelled. Approve account access and the GenLayer Studio Dev network switch to continue.";
  }
  if (code === -32002) {
    return "A wallet request is already open. Complete it in the wallet extension.";
  }
  if (code === 4902) {
    return "GenLayer Studio Dev is not configured in this wallet. Try Connect Wallet again to add the network.";
  }

  const message = getErrorMessage(cause);
  return message || "The wallet could not connect to GenLayer Studio Dev.";
}

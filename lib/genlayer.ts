import { createClient } from "genlayer-js";
import { studioDevnet } from "genlayer-js/chains";

const DEFAULT_RPC_URL = "https://studio-next.genlayer.com/api";
const DEFAULT_CHAIN_ID = 61997;
const DEFAULT_CHAIN_NAME = "GenLayer Studio Next";
const DEFAULT_SYMBOL = "GEN";

function parseChainId(value: string | undefined): number {
  if (!value?.trim()) return DEFAULT_CHAIN_ID;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`NEXT_PUBLIC_GENLAYER_CHAIN_ID must be a positive integer; received ${value}`);
  }
  return parsed;
}

const chainId = parseChainId(process.env.NEXT_PUBLIC_GENLAYER_CHAIN_ID);
const rpcUrl = process.env.NEXT_PUBLIC_GENLAYER_RPC_URL || DEFAULT_RPC_URL;
const chainName = process.env.NEXT_PUBLIC_GENLAYER_CHAIN_NAME || DEFAULT_CHAIN_NAME;
const symbol = process.env.NEXT_PUBLIC_GENLAYER_SYMBOL || DEFAULT_SYMBOL;

export const GENLAYER_CHAIN = {
  ...studioDevnet,
  id: chainId,
  name: chainName,
  nativeCurrency: {
    name: symbol,
    symbol,
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [rpcUrl],
    },
  },
} satisfies typeof studioDevnet;

export const GENLAYER_NETWORK = "studio-next" as const;
export const GENLAYER_NETWORK_LABEL = "STUDIO NEXT";
export const GENLAYER_CHAIN_ID_DECIMAL = chainId;
export const GENLAYER_CHAIN_ID_HEX = `0x${chainId.toString(16)}`;
export const GENLAYER_RPC_URL = rpcUrl;
export const GENLAYER_EXPLORER_URL = "https://explorer-studio-dev.genlayer.com/";

export const readClient = createClient({ chain: GENLAYER_CHAIN });

export const addressPattern = /^0x[0-9a-fA-F]{40}$/;

export function isContractAddress(value: string): boolean {
  return addressPattern.test(value.trim());
}

export function shortenAddress(value: string): string {
  return value.length > 12 ? `${value.slice(0, 6)}…${value.slice(-4)}` : value;
}

export async function readTargetState(target: `0x${string}`) {
  const [value, version, feeBps, governanceFinalized] = await Promise.all([
    readClient.readContract({ address: target, functionName: "get_value", args: [] }),
    readClient.readContract({ address: target, functionName: "get_version", args: [] }),
    readClient.readContract({ address: target, functionName: "get_fee_bps", args: [] }),
    readClient.readContract({ address: target, functionName: "is_governance_finalized", args: [] }),
  ]);

  return {
    value: String(value),
    version: String(version),
    feeBps: String(feeBps),
    governanceFinalized: Boolean(governanceFinalized),
  };
}

export async function readGovernorState(governor: `0x${string}`) {
  const target = await readClient.readContract({
    address: governor,
    functionName: "get_target",
    args: [],
  });
  return { target: String(target) };
}

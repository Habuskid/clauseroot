import { createClient } from "genlayer-js";
import { localnet } from "genlayer-js/chains";

export const LOCALNET_CHAIN_ID_DECIMAL = localnet.id;
export const LOCALNET_CHAIN_ID = `0x${localnet.id.toString(16)}`;
export const LOCALNET_RPC_URL = localnet.rpcUrls.default.http[0];
export const readClient = createClient({ chain: localnet });
export const addressPattern = /^0x[0-9a-fA-F]{40}$/;
export function isContractAddress(value: string): boolean { return addressPattern.test(value.trim()); }
export function shortenAddress(value: string): string { return value.length > 12 ? `${value.slice(0, 6)}…${value.slice(-4)}` : value; }

export async function readTargetState(target: `0x${string}`) {
  const [value, version, feeBps, governanceFinalized] = await Promise.all([
    readClient.readContract({ address: target, functionName: "get_value", args: [] }),
    readClient.readContract({ address: target, functionName: "get_version", args: [] }),
    readClient.readContract({ address: target, functionName: "get_fee_bps", args: [] }),
    readClient.readContract({ address: target, functionName: "is_governance_finalized", args: [] }),
  ]);
  return { value: String(value), version: String(version), feeBps: String(feeBps), governanceFinalized: Boolean(governanceFinalized) };
}

export async function readGovernorState(governor: `0x${string}`) {
  const target = await readClient.readContract({ address: governor, functionName: "get_target", args: [] });
  return { target: String(target) };
}

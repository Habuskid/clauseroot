"use client";

import { createTransactionKit } from "@genlayer/transaction-kit";
import { GENLAYER_CHAIN } from "./genlayer";

type Eip1193Provider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

export function createClauseRootTransactionKit(
  provider: Eip1193Provider,
  account: `0x${string}`,
) {
  return createTransactionKit({
    chain: GENLAYER_CHAIN,
    provider: provider as never,
    account,
  });
}

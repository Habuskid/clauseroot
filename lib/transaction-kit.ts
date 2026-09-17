"use client";

import {
  createTransactionKit,
  type Eip1193Provider,
} from "@genlayer/transaction-kit";
import { GENLAYER_CHAIN } from "./genlayer";

export function createClauseRootTransactionKit(
  provider: Eip1193Provider,
  account: `0x${string}`,
) {
  return createTransactionKit({
    chain: GENLAYER_CHAIN,
    provider,
    account,
  });
}

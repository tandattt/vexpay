import { apiFetch } from "../../shared/api";
import { dedupePromise } from "../../shared/lib/dedupePromise";
import type { WalletBalanceResponse, WalletTransactionPagedResponse } from "./types";

export function getMyBalance(token?: string | null) {
  return dedupePromise("wallet:balance", () =>
    apiFetch<WalletBalanceResponse>("/wallet/balance", { token }),
  );
}

export function getWalletTransactions(token: string, page = 1, pageSize = 20) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  return dedupePromise(`wallet:transactions:${params.toString()}`, () =>
    apiFetch<WalletTransactionPagedResponse>(`/wallet/transactions?${params}`, { token }),
  );
}

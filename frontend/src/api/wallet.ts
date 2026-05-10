import { apiFetch } from "./client";
import type { WalletBalanceResponse } from "../types";

export function getMyBalance(token: string) {
  return apiFetch<WalletBalanceResponse>("/wallet/balance", {
    method: "GET",
    token,
  });
}

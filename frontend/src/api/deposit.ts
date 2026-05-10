import { apiFetch, apiFetchBlob, HttpError } from "./client";
import type { DepositHistoryResponse, DepositStatusResponse } from "../types";

export async function createDepositQr(amount: number, token: string): Promise<{ code: string; imageUrl: string }> {
  const response = await apiFetchBlob("/deposit/qr", {
    method: "POST",
    body: { amount },
    token,
  });

  const code =
    response.headers.get("X-Deposit-Code") ??
    response.headers.get("Deposit-Code") ??
    response.headers.get("x-deposit-code");
  if (!code) {
    throw new HttpError("Thiếu mã giao dịch nạp từ server.", 500);
  }

  const blob = await response.blob();
  const imageUrl = URL.createObjectURL(blob);
  return { code, imageUrl };
}

export async function getDepositStatus(code: string, token: string): Promise<DepositStatusResponse> {
  return apiFetch<DepositStatusResponse>(`/deposit/status/${encodeURIComponent(code)}`, { token });
}

export async function getDepositHistory(token: string): Promise<DepositHistoryResponse[]> {
  return apiFetch<DepositHistoryResponse[]>("/deposit/history", { token });
}

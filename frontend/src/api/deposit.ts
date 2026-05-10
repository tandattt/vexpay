import { apiFetch, apiFetchBlob, HttpError } from "./client";
import type { DepositHistoryPagedResponse, DepositStatusResponse } from "../types";

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

export async function getDepositHistory(token: string, page = 1, pageSize = 5): Promise<DepositHistoryPagedResponse> {
  const query = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  return apiFetch<DepositHistoryPagedResponse>(`/deposit/history?${query.toString()}`, { token });
}

export async function getDepositHistoryQr(code: string, token: string): Promise<string> {
  const response = await apiFetchBlob(`/deposit/history/${encodeURIComponent(code)}/qr`, { token });
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

export async function cancelDeposit(code: string, token: string): Promise<void> {
  await apiFetch<{ success: boolean }>(`/deposit/cancel/${encodeURIComponent(code)}`, {
    method: "POST",
    token,
  });
}

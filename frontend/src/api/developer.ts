import { apiFetch } from "./client";
import type { DeveloperRequestStatusResponse } from "../types";

export async function getDeveloperRequestStatus(token: string): Promise<DeveloperRequestStatusResponse> {
  return apiFetch<DeveloperRequestStatusResponse>("/developer-requests/status", { token });
}

export async function requestBecomeDeveloper(token: string): Promise<DeveloperRequestStatusResponse> {
  return apiFetch<DeveloperRequestStatusResponse>("/developer-requests", {
    method: "POST",
    token,
  });
}

import { apiFetch } from "./client";
import type { LoginRequest, LoginResponse } from "../types";

export function login(payload: LoginRequest) {
  return apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: payload,
  });
}

export function refreshAccessToken() {
  return apiFetch<LoginResponse>("/auth/refresh", {
    method: "POST",
  });
}

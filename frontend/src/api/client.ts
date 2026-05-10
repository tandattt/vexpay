import { API_BASE_URL } from "../config/api";
import type { ApiError } from "../types";
import { getAccessToken, setAccessToken } from "./authTokenStore";

const BASE_URL = API_BASE_URL;

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string | null;
  signal?: AbortSignal;
  _retry?: boolean;
}

export class HttpError extends Error implements ApiError {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "HttpError";
  }
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, token, signal, _retry = false } = options;

  const resolvedToken = token ?? getAccessToken();
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (resolvedToken) {
    headers["Authorization"] = `Bearer ${resolvedToken}`;
  }

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      credentials: "include",
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch {
    throw new HttpError("Không thể kết nối máy chủ. Kiểm tra lại mạng.", 0);
  }

  if (response.status === 401 && !_retry && path !== "/auth/refresh") {
    try {
      const refreshedToken = await requestRefreshToken(signal);
      setAccessToken(refreshedToken);
      return await apiFetch<T>(path, { ...options, token: refreshedToken, _retry: true });
    } catch {
      setAccessToken(null);
      throw new HttpError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.", 401);
    }
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  const data = text ? safeParse(text) : null;

  if (!response.ok) {
    const message = extractMessage(data) ?? `Yêu cầu thất bại (${response.status}).`;
    throw new HttpError(message, response.status);
  }

  return data as T;
}

export async function apiFetchBlob(path: string, options: RequestOptions = {}): Promise<Response> {
  const { method = "GET", body, token, signal, _retry = false } = options;

  const resolvedToken = token ?? getAccessToken();
  const headers: Record<string, string> = {
    Accept: "*/*",
  };
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (resolvedToken) {
    headers["Authorization"] = `Bearer ${resolvedToken}`;
  }

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      credentials: "include",
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch {
    throw new HttpError("Không thể kết nối máy chủ. Kiểm tra lại mạng.", 0);
  }

  if (response.status === 401 && !_retry && path !== "/auth/refresh") {
    try {
      const refreshedToken = await requestRefreshToken(signal);
      setAccessToken(refreshedToken);
      return await apiFetchBlob(path, { ...options, token: refreshedToken, _retry: true });
    } catch {
      setAccessToken(null);
      throw new HttpError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.", 401);
    }
  }

  if (!response.ok) {
    const text = await response.text();
    const data = text ? safeParse(text) : null;
    const message = extractMessage(data) ?? `Yêu cầu thất bại (${response.status}).`;
    throw new HttpError(message, response.status);
  }

  return response;
}

async function requestRefreshToken(signal?: AbortSignal): Promise<string> {
  const response = await fetch(`${BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { Accept: "application/json" },
    credentials: "include",
    signal,
  });

  if (!response.ok) {
    throw new HttpError("Không thể làm mới phiên đăng nhập.", response.status);
  }

  const text = await response.text();
  const data = text ? (safeParse(text) as { accessToken?: string }) : {};
  if (!data.accessToken) {
    throw new HttpError("Phản hồi refresh token không hợp lệ.", 500);
  }

  return data.accessToken;
}

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function extractMessage(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const record = data as Record<string, unknown>;
  if (typeof record.message === "string") return record.message;
  if (typeof record.title === "string") return record.title;
  return null;
}

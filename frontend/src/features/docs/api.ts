import { API_BASE_URL } from "../../shared/config/api";
import { dedupePromise } from "../../shared/lib/dedupePromise";
import type { OpenApiDocument } from "./types";

/** Dev: same-origin qua Vite proxy. Prod: gọi thẳng BE. */
export function getOpenApiSpecUrl(): string {
  if (import.meta.env.DEV) {
    return "/openapi/public-v1.json";
  }
  return `${API_BASE_URL}/openapi/public-v1.json`;
}

export const OPENAPI_SPEC_URL = getOpenApiSpecUrl();

export async function fetchOpenApiSpec(): Promise<OpenApiDocument> {
  return dedupePromise("openapi:public-v1", async () => {
    const url = getOpenApiSpecUrl();
    let response: Response;

    try {
      response = await fetch(url, {
        headers: { Accept: "application/json" },
      });
    } catch {
      throw new Error(
        import.meta.env.DEV
          ? `Không kết nối được backend (${url}). Kiểm tra BE đang chạy và VITE_API_BASE_URL trong .env.`
          : `Không tải được OpenAPI từ ${url}. Kiểm tra CORS và URL API.`,
      );
    }

    if (!response.ok) {
      throw new Error(`Không tải được OpenAPI spec (${response.status}) từ ${url}.`);
    }

    return response.json() as Promise<OpenApiDocument>;
  });
}

import { apiFetch } from "../../shared/api";
import { dedupePromise } from "../../shared/lib/dedupePromise";
import type {
  DeveloperCreateProjectRequest,
  DeveloperProjectResponse,
  DeveloperRequestStatusResponse,
  IssueProjectApiKeyRequest,
  IssuedProjectApiKeyResponse,
  PaymentIntentPagedResponse,
  ProjectApiKeyResponse,
  ProjectPaymentStatsResponse,
  ProjectWebhookDeliveryPagedResponse,
  UpdateProjectWebhookRequest,
} from "./types";

export function getDeveloperRequestStatus() {
  return dedupePromise("developer:request-status", () =>
    apiFetch<DeveloperRequestStatusResponse>("/developer-requests/status"),
  );
}

export function requestBecomeDeveloper() {
  return apiFetch<DeveloperRequestStatusResponse>("/developer-requests", { method: "POST" });
}

export function getMyProjects() {
  return dedupePromise("developer:projects", () =>
    apiFetch<DeveloperProjectResponse[]>("/projects"),
  );
}

export function createMyProject(payload: DeveloperCreateProjectRequest) {
  return apiFetch<DeveloperProjectResponse>("/projects", { method: "POST", body: payload });
}

export function updateProjectWebhook(projectId: string, payload: UpdateProjectWebhookRequest) {
  return apiFetch<DeveloperProjectResponse>(`/projects/${encodeURIComponent(projectId)}/webhook`, {
    method: "PATCH",
    body: payload,
  });
}

export function getProjectApiKeys(projectId: string) {
  return apiFetch<ProjectApiKeyResponse[]>(`/projects/${encodeURIComponent(projectId)}/api-keys`);
}

export function issueProjectApiKey(projectId: string, payload: IssueProjectApiKeyRequest) {
  return apiFetch<IssuedProjectApiKeyResponse>(`/projects/${encodeURIComponent(projectId)}/api-keys`, {
    method: "POST",
    body: payload,
  });
}

export function revokeProjectApiKey(projectId: string, keyId: string) {
  return apiFetch<void>(
    `/projects/${encodeURIComponent(projectId)}/api-keys/${encodeURIComponent(keyId)}`,
    { method: "DELETE" },
  );
}

export function getPayments(
  page = 1,
  pageSize = 5,
  status?: string | null,
  projectId?: string | null,
) {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (status) params.set("status", status);
  if (projectId) params.set("projectId", projectId);
  const qs = params.toString();
  return dedupePromise(`developer:payments:${qs}`, () =>
    apiFetch<PaymentIntentPagedResponse>(`/projects/payments?${qs}`),
  );
}

export function getWebhookDeliveries(page = 1, pageSize = 20, projectId?: string | null) {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (projectId) params.set("projectId", projectId);
  const qs = params.toString();
  return dedupePromise(`developer:webhook-deliveries:${qs}`, () =>
    apiFetch<ProjectWebhookDeliveryPagedResponse>(`/projects/webhook-deliveries?${qs}`),
  );
}

export function getPaymentStats(from?: string, to?: string, projectId?: string | null) {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  if (projectId) params.set("projectId", projectId);
  const qs = params.toString();
  return dedupePromise(`developer:stats:${qs}`, () =>
    apiFetch<ProjectPaymentStatsResponse>(`/projects/stats${qs ? `?${qs}` : ""}`),
  );
}

export function getProjectPayments(
  projectId: string,
  page = 1,
  pageSize = 5,
  status?: string | null,
) {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (status) params.set("status", status);
  return apiFetch<PaymentIntentPagedResponse>(
    `/projects/${encodeURIComponent(projectId)}/payments?${params.toString()}`,
  );
}

export function getProjectWebhookDeliveries(projectId: string, page = 1, pageSize = 20) {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  return apiFetch<ProjectWebhookDeliveryPagedResponse>(
    `/projects/${encodeURIComponent(projectId)}/webhook-deliveries?${params.toString()}`,
  );
}

export function getProjectStats(projectId: string, from?: string, to?: string) {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const qs = params.toString();
  return apiFetch<ProjectPaymentStatsResponse>(
    `/projects/${encodeURIComponent(projectId)}/stats${qs ? `?${qs}` : ""}`,
  );
}

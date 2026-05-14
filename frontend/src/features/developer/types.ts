export interface DeveloperRequestStatusResponse {
  isDeveloper: boolean;
  hasPendingRequest: boolean;
  requestStatus?: string | null;
}

export interface DeveloperProjectResponse {
  id: string;
  userId: string;
  name: string;
  webhookUrl?: string | null;
  webhookSecretEnabled: boolean;
  webhookRetryEnabled: boolean;
  webhookSecretConfigured: boolean;
  webhookSecretMask?: string | null;
  createdAt: string;
}

export interface DeveloperCreateProjectRequest {
  name: string;
}

export interface UpdateProjectWebhookRequest {
  webhookUrl?: string | null;
  webhookSecretEnabled: boolean;
  webhookRetryEnabled: boolean;
  webhookSecretKey?: string | null;
}

export interface ProjectApiKeyResponse {
  id: string;
  projectId: string;
  keyPrefix: string;
  last4: string;
  name?: string | null;
  createdAt: string;
  revokedAt?: string | null;
  lastUsedAt?: string | null;
  isActive: boolean;
}

export interface IssuedProjectApiKeyResponse extends ProjectApiKeyResponse {
  secretKey: string;
}

export interface IssueProjectApiKeyRequest {
  name?: string;
}

export type PaymentIntentStatus =
  | "AwaitingTransfer"
  | "Paid"
  | "Failed"
  | "Expired"
  | "Cancelled";

export interface PaymentIntentItem {
  id: string;
  projectId: string;
  merchantRef?: string | null;
  amount: number;
  currency: string;
  status: PaymentIntentStatus | number;
  method: number;
  transferCode: string;
  description?: string | null;
  qrImageUrl?: string | null;
  createdAt: string;
  paidAt?: string | null;
  expiresAt?: string | null;
}

export interface PaymentIntentPagedResponse {
  items: PaymentIntentItem[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface ProjectWebhookDeliveryItem {
  id: string;
  paymentIntentId: string;
  eventType: string;
  attempt: number;
  webhookUrl: string;
  httpStatusCode?: number | null;
  success: boolean;
  responseBody?: string | null;
  errorMessage?: string | null;
  createdAt: string;
  projectId?: string | null;
  projectName?: string | null;
}

export interface ProjectWebhookDeliveryPagedResponse {
  items: ProjectWebhookDeliveryItem[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface DailyPaymentBucket {
  date: string;
  count: number;
  amount: number;
}

export interface ProjectPaymentStatsResponse {
  totalIntents: number;
  paidCount: number;
  failedCount: number;
  expiredCount: number;
  cancelledCount: number;
  awaitingCount: number;
  paidAmount: number;
  averageAmount: number;
  successRate: number;
  daily: DailyPaymentBucket[];
}

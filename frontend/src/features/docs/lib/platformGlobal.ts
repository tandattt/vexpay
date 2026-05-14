import type { PlatformGlobalConfig } from "../types";

const DEFAULT_WEBHOOK_MAX_ATTEMPTS = 5;
const DEFAULT_WEBHOOK_RETRY_DELAYS = [30, 120, 600, 1800];

export function resolvePlatformGlobal(config?: PlatformGlobalConfig): Required<
  Pick<PlatformGlobalConfig, "webhook_max_attempts" | "webhook_retry_delay_seconds">
> {
  return {
    webhook_max_attempts: config?.webhook_max_attempts ?? DEFAULT_WEBHOOK_MAX_ATTEMPTS,
    webhook_retry_delay_seconds:
      config?.webhook_retry_delay_seconds?.length
        ? config.webhook_retry_delay_seconds
        : DEFAULT_WEBHOOK_RETRY_DELAYS,
  };
}

export function formatDelaySeconds(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  return `${Math.round(seconds / 3600)}h`;
}

export function formatWebhookRetryPolicy(config?: PlatformGlobalConfig): {
  maxAttempts: number;
  maxRetries: number;
  delayLabel: string;
  switchDescription: string;
  docsRetryLine: string;
} {
  const { webhook_max_attempts: maxAttempts, webhook_retry_delay_seconds: delays } =
    resolvePlatformGlobal(config);
  const maxRetries = Math.max(0, maxAttempts - 1);
  const delayLabel = delays.map(formatDelaySeconds).join(" → ");

  return {
    maxAttempts,
    maxRetries,
    delayLabel,
    switchDescription: `Bật: tối đa ${maxAttempts} lần gửi nếu server không trả HTTP 200–299. Tắt: chỉ gửi một lần.`,
    docsRetryLine: `Bật thử lại: tối đa ${maxAttempts} lần gửi (1 lần đầu + tối đa ${maxRetries} lần retry) với backoff ${delayLabel} khi không nhận 200–299.`,
  };
}

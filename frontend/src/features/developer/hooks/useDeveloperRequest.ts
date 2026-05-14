import { useCallback, useEffect, useState } from "react";
import { HttpError } from "../../../shared/api";
import { getDeveloperRequestStatus, requestBecomeDeveloper } from "../api";
import type { DeveloperRequestStatusResponse } from "../types";

export function useDeveloperRequest(token: string | null, enabled: boolean) {
  const [status, setStatus] = useState<DeveloperRequestStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!enabled || !token) return;
    let cancelled = false;
    setError(null);
    setIsLoading(true);
    void getDeveloperRequestStatus()
      .then((data) => {
        if (!cancelled) setStatus(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof HttpError
            ? err.message
            : "Không tải được trạng thái yêu cầu developer.",
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, token]);

  const submit = useCallback(async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      const result = await requestBecomeDeveloper();
      setStatus(result);
    } catch (err) {
      const message =
        err instanceof HttpError
          ? err.message
          : "Không thể gửi yêu cầu trở thành nhà phát triển.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return { status, error, isLoading, isSubmitting, submit };
}

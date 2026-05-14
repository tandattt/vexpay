import { useCallback, useEffect, useState } from "react";
import { HttpError } from "../../../shared/api";
import { updateProjectWebhook } from "../api";
import type { DeveloperProjectResponse, UpdateProjectWebhookRequest } from "../types";

export function useProjectWebhook(
  project: DeveloperProjectResponse | null,
  onUpdated?: (project: DeveloperProjectResponse) => void,
) {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [secretEnabled, setSecretEnabled] = useState(false);
  const [retryEnabled, setRetryEnabled] = useState(false);
  const [secretKey, setSecretKey] = useState("");
  const [secretConfigured, setSecretConfigured] = useState(false);
  const [secretMask, setSecretMask] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!project) {
      setWebhookUrl("");
      setSecretEnabled(false);
      setRetryEnabled(false);
      setSecretKey("");
      setSecretConfigured(false);
      setSecretMask(null);
      setError(null);
      return;
    }

    setWebhookUrl(project.webhookUrl ?? "");
    setSecretEnabled(project.webhookSecretEnabled);
    setRetryEnabled(project.webhookRetryEnabled);
    setSecretKey("");
    setSecretConfigured(project.webhookSecretConfigured);
    setSecretMask(project.webhookSecretMask ?? null);
    setError(null);
  }, [project]);

  const save = useCallback(async () => {
    if (!project) return false;

    const payload: UpdateProjectWebhookRequest = {
      webhookUrl: webhookUrl.trim() || null,
      webhookSecretEnabled: secretEnabled,
      webhookRetryEnabled: retryEnabled,
      webhookSecretKey: secretKey.trim() || null,
    };

    try {
      setIsSaving(true);
      setError(null);
      const updated = await updateProjectWebhook(project.id, payload);
      setWebhookUrl(updated.webhookUrl ?? "");
      setSecretEnabled(updated.webhookSecretEnabled);
      setRetryEnabled(updated.webhookRetryEnabled);
      setSecretKey("");
      setSecretConfigured(updated.webhookSecretConfigured);
      setSecretMask(updated.webhookSecretMask ?? null);
      onUpdated?.(updated);
      return true;
    } catch (err) {
      setError(err instanceof HttpError ? err.message : "Không lưu được cấu hình webhook.");
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [onUpdated, project, retryEnabled, secretEnabled, secretKey, webhookUrl]);

  return {
    webhookUrl,
    secretEnabled,
    retryEnabled,
    secretKey,
    secretConfigured,
    secretMask,
    error,
    isSaving,
    setWebhookUrl,
    setSecretEnabled,
    setRetryEnabled,
    setSecretKey,
    save,
    clearError: () => setError(null),
  };
}

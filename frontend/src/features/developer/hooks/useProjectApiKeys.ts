import { useCallback, useEffect, useState } from "react";
import { HttpError } from "../../../shared/api";
import { getProjectApiKeys, issueProjectApiKey, revokeProjectApiKey } from "../api";
import type { IssuedProjectApiKeyResponse, ProjectApiKeyResponse } from "../types";

export function useProjectApiKeys(projectId: string | null) {
  const [keys, setKeys] = useState<ProjectApiKeyResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(projectId));
  const [isIssuing, setIsIssuing] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [issuedKey, setIssuedKey] = useState<IssuedProjectApiKeyResponse | null>(null);

  const load = useCallback(async () => {
    if (!projectId) return;
    try {
      setError(null);
      setIsLoading(true);
      const data = await getProjectApiKeys(projectId);
      setKeys(data);
    } catch (err) {
      setError(err instanceof HttpError ? err.message : "Không tải được danh sách API key.");
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (!projectId) {
      setKeys([]);
      setIssuedKey(null);
      setError(null);
      return;
    }
    void load();
  }, [projectId, load]);

  const issue = useCallback(
    async (name?: string) => {
      if (!projectId) return false;
      try {
        setIsIssuing(true);
        setError(null);
        const created = await issueProjectApiKey(projectId, { name: name?.trim() || undefined });
        setIssuedKey(created);
        const { secretKey: _ignored, ...metadata } = created;
        void _ignored;
        setKeys((current) => [metadata, ...current]);
        return true;
      } catch (err) {
        setError(err instanceof HttpError ? err.message : "Không phát được API key.");
        return false;
      } finally {
        setIsIssuing(false);
      }
    },
    [projectId],
  );

  const revoke = useCallback(
    async (keyId: string) => {
      if (!projectId) return false;
      try {
        setRevokingId(keyId);
        setError(null);
        await revokeProjectApiKey(projectId, keyId);
        setKeys((current) =>
          current.map((item) =>
            item.id === keyId
              ? { ...item, revokedAt: new Date().toISOString(), isActive: false }
              : item,
          ),
        );
        return true;
      } catch (err) {
        setError(err instanceof HttpError ? err.message : "Không thu hồi được API key.");
        return false;
      } finally {
        setRevokingId(null);
      }
    },
    [projectId],
  );

  const dismissIssuedKey = useCallback(() => setIssuedKey(null), []);
  const clearError = useCallback(() => setError(null), []);

  return {
    keys,
    error,
    isLoading,
    isIssuing,
    revokingId,
    issuedKey,
    load,
    issue,
    revoke,
    dismissIssuedKey,
    clearError,
  };
}

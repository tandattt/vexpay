import { useState } from "react";
import { Globe, KeyRound, Plus, Trash2, Webhook } from "lucide-react";
import { ApiKeysListSkeleton, Button, Modal, Switch, TextField } from "../../../shared/components/ui";
import { useStableLoading } from "../../../shared/hooks/useStableLoading";
import { formatDateTime } from "../../../shared/lib/format";
import { formatWebhookRetryPolicy } from "../../docs/lib/platformGlobal";
import { usePlatformGlobal } from "../../docs/hooks/usePlatformGlobal";
import { useProjectApiKeys } from "../hooks/useProjectApiKeys";
import { useProjectWebhook } from "../hooks/useProjectWebhook";
import type { DeveloperProjectResponse } from "../types";
import IssuedApiKeyAlert from "./IssuedApiKeyAlert";
import WebhookSecretField from "./WebhookSecretField";

interface Props {
  project: DeveloperProjectResponse | null;
  onClose: () => void;
  onProjectUpdated?: (project: DeveloperProjectResponse) => void;
}

export default function ProjectApiKeysModal({ project, onClose, onProjectUpdated }: Props) {
  const open = Boolean(project);
  const { global: platformGlobal } = usePlatformGlobal(open);
  const webhookRetry = formatWebhookRetryPolicy(platformGlobal);
  const {
    keys,
    error: keysError,
    isLoading,
    isIssuing,
    revokingId,
    issuedKey,
    issue,
    revoke,
    dismissIssuedKey,
  } = useProjectApiKeys(project?.id ?? null);

  const {
    webhookUrl,
    secretEnabled,
    retryEnabled,
    secretKey,
    secretConfigured,
    secretMask,
    error: webhookError,
    isSaving,
    setWebhookUrl,
    setSecretEnabled,
    setRetryEnabled,
    setSecretKey,
    save: saveWebhook,
  } = useProjectWebhook(project, onProjectUpdated);

  const showKeysSkeleton = useStableLoading(isLoading, { hasData: keys.length > 0 });
  const [name, setName] = useState("");

  const handleIssue = async () => {
    const ok = await issue(name);
    if (ok) setName("");
  };

  const handleClose = () => {
    if (isIssuing || revokingId || isSaving) return;
    setName("");
    dismissIssuedKey();
    onClose();
  };

  const error = keysError ?? webhookError;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      size="lg"
      title={project ? `${project.name}` : "Project"}
      description="Cấu hình webhook nhận sự kiện và quản lý API keys gọi VexPay."
    >
      <div className="space-y-5">
        <section className="rounded-xl border border-hairline bg-fill-subtle p-3 sm:p-4">
          <div className="flex items-center gap-2">
            <Webhook className="h-4 w-4 text-primary" />
            <h6 className="text-sm font-semibold text-ink">Webhook</h6>
          </div>

          <p className="mt-2 text-xs text-muted">
            Khi có sự kiện, VexPay sẽ gửi HTTP POST tới URL bạn cấu hình. Nếu bật secret key, hệ thống sẽ
            đính kèm giá trị bạn nhập trong header{" "}
            <code className="inline-code">api-key</code>{" "}
            để server của bạn xác thực request.
          </p>

          <div className="mt-4 space-y-3">
            <TextField
              label="Webhook URL"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://example.com/webhooks/vexpay"
              leftIcon={<Globe className="h-4 w-4" />}
            />

            <Switch
              label="Gửi secret key trên header"
              description="Bật để VexPay gửi secret key trong header api-key khi gọi webhook."
              checked={secretEnabled}
              onChange={setSecretEnabled}
              disabled={isSaving}
            />

            <Switch
              label="Thử lại khi webhook lỗi"
              description={webhookRetry.switchDescription}
              checked={retryEnabled}
              onChange={setRetryEnabled}
              disabled={isSaving}
            />

            {secretEnabled ? (
              <WebhookSecretField
                value={secretKey}
                configured={secretConfigured}
                secretMask={secretMask}
                disabled={isSaving}
                onChange={setSecretKey}
              />
            ) : null}

            <div className="flex justify-end">
              <Button variant="primary" size="sm" loading={isSaving} onClick={() => void saveWebhook()}>
                Lưu webhook
              </Button>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-primary" />
            <h6 className="text-sm font-semibold text-ink">API keys</h6>
          </div>

          {issuedKey ? <IssuedApiKeyAlert issued={issuedKey} onDismiss={dismissIssuedKey} /> : null}

          <div className="rounded-xl border border-hairline bg-fill-subtle p-3 sm:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <TextField
                label="Tên gợi nhớ (tuỳ chọn)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Production server"
                maxLength={150}
                wrapperClassName="flex-1"
              />
              <Button
                variant="gradient"
                size="md"
                loading={isIssuing}
                onClick={() => void handleIssue()}
                leftIcon={<Plus className="h-4 w-4" />}
              >
                Phát key mới
              </Button>
            </div>
          </div>

          {error ? (
            <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{error}</p>
          ) : null}

          {showKeysSkeleton ? (
            <ApiKeysListSkeleton />
          ) : keys.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-hairline bg-fill-subtle px-4 py-10 text-center">
              <KeyRound className="h-8 w-8 text-muted" />
              <p className="text-sm font-medium text-ink">Chưa có API key</p>
              <p className="text-xs text-muted">Phát key đầu tiên để bắt đầu tích hợp.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {keys.map((key) => (
                <li
                  key={key.id}
                  className="flex min-w-0 flex-col gap-2 overflow-hidden rounded-xl border border-hairline bg-fill-subtle p-3 transition-colors hover:border-primary/30 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-ink">
                        {key.name?.trim() || "Untitled key"}
                      </p>
                      {key.isActive ? (
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                          ACTIVE
                        </span>
                      ) : (
                        <span className="rounded-full border border-rose-500/30 bg-rose-500/15 px-2 py-0.5 text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                          REVOKED
                        </span>
                      )}
                    </div>
                    <p className="secret-key-value mt-1 font-mono text-xs text-muted">
                      <span className="inline-block whitespace-nowrap">
                        {key.keyPrefix}_••••{key.last4}
                      </span>
                    </p>
                    <p className="mt-1 text-[11px] text-muted">
                      Tạo: {formatDateTime(key.createdAt)}
                      {key.lastUsedAt
                        ? ` · Dùng gần nhất: ${formatDateTime(key.lastUsedAt)}`
                        : " · Chưa dùng"}
                      {key.revokedAt ? ` · Thu hồi: ${formatDateTime(key.revokedAt)}` : ""}
                    </p>
                  </div>

                  {key.isActive ? (
                    <Button
                      variant="danger"
                      size="sm"
                      loading={revokingId === key.id}
                      onClick={() => void revoke(key.id)}
                      leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                    >
                      Thu hồi
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Modal>
  );
}

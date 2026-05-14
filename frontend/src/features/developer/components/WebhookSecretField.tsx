import { useMemo, useState } from "react";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { TextField } from "../../../shared/components/ui";
import { scoreSecretStrength } from "../../../shared/lib/secretStrength";

interface Props {
  value: string;
  configured: boolean;
  secretMask?: string | null;
  disabled?: boolean;
  onChange: (value: string) => void;
}

export default function WebhookSecretField({ value, configured, secretMask, disabled, onChange }: Props) {
  const [showSecret, setShowSecret] = useState(false);
  const strength = useMemo(() => scoreSecretStrength(value), [value]);
  const isEditing = value.length > 0;

  return (
    <div className="space-y-3">
      {configured && secretMask && !isEditing ? (
        <div>
          <p className="text-xs font-semibold text-muted">Secret key hiện tại</p>
          <div className="secret-key-display mt-1.5 flex items-center gap-2 rounded-xl px-3 py-2.5">
            <KeyRound className="h-4 w-4 flex-shrink-0 text-muted" />
            <span className="secret-key-value font-mono text-xs text-ink">{secretMask}</span>
          </div>
          <p className="mt-1 text-xs text-muted">Secret đã được lưu an toàn. Nhập bên dưới nếu muốn thay đổi.</p>
        </div>
      ) : null}

      <TextField
        label={configured ? "Secret key mới (tuỳ chọn)" : "Secret key"}
        type={showSecret ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={configured ? "Nhập secret mới để thay thế" : "Nhập secret key của bạn"}
        disabled={disabled}
        leftIcon={<KeyRound className="h-4 w-4" />}
        rightSlot={
          <button
            type="button"
            onClick={() => setShowSecret((current) => !current)}
            className="rounded-md p-1 text-muted transition-colors hover:text-ink"
            aria-label={showSecret ? "Ẩn secret key" : "Hiện secret key"}
            disabled={disabled}
          >
            {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        }
        helper={
          !isEditing && !configured
            ? "Server của bạn nên kiểm tra header api-key khớp với giá trị này."
            : undefined
        }
      />

      {strength ? (
        <div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-medium text-muted">Độ mạnh secret</p>
            <p className={`text-[11px] font-semibold ${strength.textClass}`}>{strength.label}</p>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-fill-muted">
            <div
              className={`h-full rounded-full transition-all duration-300 ${strength.barClass}`}
              style={{ width: `${strength.percent}%` }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

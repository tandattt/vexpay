import { useState } from "react";
import { AlertTriangle, Check, Copy } from "lucide-react";
import { Button } from "../../../shared/components/ui";
import type { IssuedProjectApiKeyResponse } from "../types";

interface Props {
  issued: IssuedProjectApiKeyResponse;
  onDismiss: () => void;
}

export default function IssuedApiKeyAlert({ issued, onDismiss }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(issued.secretKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 dark:border-amber-500/30 dark:bg-amber-500/[0.08]">
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
            Lưu lại secret key ngay bây giờ
          </p>
          <p className="mt-0.5 text-xs text-amber-800/80 dark:text-amber-300/80">
            Đây là lần duy nhất hệ thống hiển thị secret này. Sau khi đóng, bạn không thể xem lại.
          </p>
        </div>
      </div>

      <div className="secret-key-display mt-3 flex items-stretch gap-2 rounded-lg py-2 pl-3 pr-2 font-mono text-xs">
        <div className="secret-key-value min-w-0 max-w-full flex-1 py-0.5">
          <span className="block whitespace-nowrap">{issued.secretKey}</span>
        </div>
        <button
          type="button"
          onClick={() => void handleCopy()}
          className="secret-key-copy-btn inline-flex h-7 flex-shrink-0 self-center items-center gap-1 rounded-md px-2 text-[11px] font-medium transition-colors hover:border-primary/40 hover:text-primary"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Đã copy" : "Copy"}
        </button>
      </div>

      <div className="mt-3 flex justify-end">
        <Button variant="subtle" size="sm" onClick={onDismiss}>
          Tôi đã lưu
        </Button>
      </div>
    </div>
  );
}

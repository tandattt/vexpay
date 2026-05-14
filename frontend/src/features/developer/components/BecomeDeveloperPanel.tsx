import { Code2 } from "lucide-react";
import { Button } from "../../../shared/components/ui";
import type { DeveloperRequestStatusResponse } from "../types";

interface Props {
  status: DeveloperRequestStatusResponse | null;
  isSubmitting: boolean;
  error: string | null;
  onSubmit: () => void;
}

export default function BecomeDeveloperPanel({ status, isSubmitting, error, onSubmit }: Props) {
  if (status?.requestStatus === "Pending") {
    return (
        <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-600 dark:text-amber-400">
          Yêu cầu của bạn đang chờ duyệt.
        </div>
    );
  }

  const isRejected = status?.requestStatus === "Rejected";
  const isRevoked = status?.requestStatus === "Revoked";

  return (
    <div className="mt-5 space-y-3">
      {isRejected ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-600 dark:text-rose-400">
          Yêu cầu trước đã bị từ chối. Bạn có thể gửi lại yêu cầu.
        </div>
      ) : isRevoked ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-600 dark:text-amber-400">
          Quyền developer của bạn đã bị thu hồi. Bạn có thể gửi lại yêu cầu.
        </div>
      ) : null}

      {error ? <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{error}</p> : null}

      <Button
        variant="gradient"
        size="md"
        loading={isSubmitting}
        leftIcon={!isSubmitting ? <Code2 className="h-4 w-4" /> : undefined}
        onClick={onSubmit}
      >
        {isSubmitting
          ? "Đang gửi yêu cầu..."
          : isRejected || isRevoked
          ? "Yêu cầu lại"
          : "Yêu cầu trở thành nhà phát triển"}
      </Button>
    </div>
  );
}

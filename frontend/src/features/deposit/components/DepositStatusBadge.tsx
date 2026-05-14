import { CheckCircle2, Info, LoaderCircle, XCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { NormalizedDepositStatus } from "../types";

interface Config {
  label: string;
  className: string;
  icon: LucideIcon;
  spin: boolean;
}

const CONFIG: Record<NormalizedDepositStatus, Config> = {
  Pending: {
    label: "Đang chờ thanh toán",
    className: "bg-primary/10 text-primary",
    icon: LoaderCircle,
    spin: true,
  },
  Completed: {
    label: "Thanh toán thành công",
    className: "bg-emerald-500/10 text-emerald-600",
    icon: CheckCircle2,
    spin: false,
  },
  Failed: {
    label: "Giao dịch thất bại",
    className: "bg-rose-500/10 text-rose-600",
    icon: XCircle,
    spin: false,
  },
  Cancelled: {
    label: "Đã hủy giao dịch",
    className: "bg-amber-400/15 text-amber-600",
    icon: XCircle,
    spin: false,
  },
  Expired: {
    label: "Giao dịch hết hạn",
    className: "bg-slate-200 text-slate-700",
    icon: Info,
    spin: false,
  },
};

export default function DepositStatusBadge({ status }: { status: NormalizedDepositStatus }) {
  const config = CONFIG[status];
  const Icon = config.icon;
  return (
    <div
      className={`mt-4 flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ${config.className}`}
    >
      <Icon className={`h-4 w-4 ${config.spin ? "animate-spin" : ""}`} />
      {config.label}
    </div>
  );
}

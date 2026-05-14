import type { NormalizedDepositStatus } from "../types";

const TONE: Record<NormalizedDepositStatus, string> = {
  Completed: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25",
  Pending: "bg-primary/15 text-primary border border-primary/25",
  Failed: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25",
  Cancelled: "bg-amber-400/15 text-amber-600 dark:text-amber-400 border border-amber-400/25",
  Expired: "bg-fill-muted text-muted border border-hairline",
};

export default function DepositRowStatusBadge({ status }: { status: NormalizedDepositStatus }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${TONE[status]}`}>
      {status}
    </span>
  );
}

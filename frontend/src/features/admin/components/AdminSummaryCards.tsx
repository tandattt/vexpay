import { Banknote, Building2, FileClock, ShieldAlert, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { formatCurrency } from "../../../shared/lib/format";
import type { AdminSummaryResponse } from "../types";

interface Props {
  summary: AdminSummaryResponse | null;
}

type Tone = "primary" | "secondary" | "tertiary" | "neutral" | "error";

const TONE: Record<Tone, { icon: string; glow: string }> = {
  primary: { icon: "bg-primary/15 text-primary border-primary/25", glow: "shadow-soft" },
  secondary: { icon: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25", glow: "" },
  tertiary: { icon: "bg-secondary/15 text-secondary border-secondary/25", glow: "shadow-soft-purple" },
  neutral: { icon: "bg-fill-muted text-muted border-hairline", glow: "" },
  error: { icon: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/25", glow: "" },
};

export default function AdminSummaryCards({ summary }: Props) {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <StatCard icon={Users} title="Users" value={String(summary?.totalUsers ?? 0)} tone="primary" />
      <StatCard icon={Banknote} title="Deposits" value={String(summary?.totalDeposits ?? 0)} tone="secondary" />
      <StatCard
        icon={Building2}
        title="Total amount"
        value={formatCurrency(summary?.totalDepositAmount ?? 0)}
        tone="tertiary"
      />
      <StatCard
        icon={FileClock}
        title="Pending deposits"
        value={String(summary?.pendingDeposits ?? 0)}
        tone="neutral"
      />
      <StatCard
        icon={ShieldAlert}
        title="Pending dev req"
        value={String(summary?.pendingDeveloperRequests ?? 0)}
        tone="error"
      />
    </section>
  );
}

function StatCard({
  icon: Icon,
  title,
  value,
  tone,
}: {
  icon: LucideIcon;
  title: string;
  value: string;
  tone: Tone;
}) {
  const t = TONE[tone];
  return (
    <div className={`glass rounded-2xl p-5 transition-all duration-200 hover:border-primary/20 ${t.glow}`}>
      <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl border ${t.icon}`}>
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted">{title}</h3>
      <p className="font-display text-2xl font-bold text-ink">{value}</p>
    </div>
  );
}

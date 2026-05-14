import { Activity, CheckCircle2, Clock, RefreshCcw, TrendingUp } from "lucide-react";
import {
  Pagination,
  ProjectPaymentsListSkeleton,
  ProjectStatsCardsSkeleton,
} from "../../../shared/components/ui";
import { useStableLoading } from "../../../shared/hooks/useStableLoading";
import { formatCurrency, formatDateTime } from "../../../shared/lib/format";
import { useInsightsPayments, useInsightsStats } from "../hooks/useInsightsData";
import type { PaymentStatusFilter } from "../hooks/useProjectPayments";
import type { DeveloperProjectResponse, PaymentIntentItem, PaymentIntentStatus } from "../types";

interface Props {
  projectId: string | null;
  projects: DeveloperProjectResponse[];
  enabled: boolean;
  projectsReady: boolean;
  showProjectName?: boolean;
}

const STATUS_LABEL: Record<string, string> = {
  AwaitingTransfer: "Đang chờ",
  Paid: "Thành công",
  Failed: "Thất bại",
  Expired: "Hết hạn",
  Cancelled: "Đã huỷ",
  "0": "Đang chờ",
  "1": "Thành công",
  "2": "Thất bại",
  "3": "Hết hạn",
  "4": "Đã huỷ",
};

const STATUS_BADGE_CLASS: Record<string, string> = {
  AwaitingTransfer: "dev-payment-status--awaiting",
  Paid: "dev-payment-status--paid",
  Failed: "dev-payment-status--failed",
  Expired: "dev-payment-status--neutral",
  Cancelled: "dev-payment-status--neutral",
  "0": "dev-payment-status--awaiting",
  "1": "dev-payment-status--paid",
  "2": "dev-payment-status--failed",
  "3": "dev-payment-status--neutral",
  "4": "dev-payment-status--neutral",
};

const FILTER_OPTIONS: { value: PaymentStatusFilter; label: string }[] = [
  { value: "All", label: "Tất cả" },
  { value: "AwaitingTransfer", label: "Đang chờ" },
  { value: "Paid", label: "Thành công" },
  { value: "Failed", label: "Thất bại" },
  { value: "Expired", label: "Hết hạn" },
  { value: "Cancelled", label: "Đã huỷ" },
];

const PAGE_SIZE_OPTIONS = [5, 10, 20];

function statusKey(status: PaymentIntentStatus | number): string {
  return typeof status === "number" ? String(status) : status;
}

export default function ProjectStatsPanel({
  projectId,
  projects,
  enabled,
  projectsReady,
  showProjectName = false,
}: Props) {
  const { stats, isLoading: statsLoading, error: statsError } = useInsightsStats(
    projectId,
    projects,
    enabled,
    projectsReady,
  );
  const {
    items,
    page,
    pageSize,
    totalItems,
    totalPages,
    statusFilter,
    isLoading: paymentsLoading,
    error: paymentsError,
    projectNameMap,
    setPage,
    setPageSize,
    setStatusFilter,
    reload,
  } = useInsightsPayments(projectId, projects, enabled, projectsReady);

  const showStatsSkeleton = useStableLoading(statsLoading && !stats, { hasData: Boolean(stats) });
  const paymentsReady = !paymentsLoading;
  const showPaymentsSkeleton = useStableLoading(paymentsLoading && items.length === 0, {
    hasData: items.length > 0 || paymentsReady,
  });

  if (!enabled) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Activity className="h-4 w-4 text-primary" />
        <h6 className="text-sm font-semibold text-ink">Thống kê 30 ngày gần nhất</h6>
      </div>

      {statsError ? (
        <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{statsError}</p>
      ) : null}

      {showStatsSkeleton ? <ProjectStatsCardsSkeleton /> : null}

      {!showStatsSkeleton && stats ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<TrendingUp className="h-4 w-4" />}
            label="Doanh thu"
            value={formatCurrency(stats.paidAmount)}
            tone="text-emerald-600 dark:text-emerald-400"
          />
          <StatCard
            icon={<CheckCircle2 className="h-4 w-4" />}
            label="Giao dịch thành công"
            value={`${stats.paidCount}/${stats.totalIntents}`}
            hint={`Tỷ lệ ${stats.successRate.toFixed(1)}%`}
          />
          <StatCard
            icon={<Activity className="h-4 w-4" />}
            label="Trung bình / đơn"
            value={formatCurrency(stats.averageAmount)}
          />
          <StatCard
            icon={<Clock className="h-4 w-4" />}
            label="Đang chờ"
            value={String(stats.awaitingCount)}
            hint={`Hết hạn: ${stats.expiredCount} · Huỷ: ${stats.cancelledCount}`}
          />
        </div>
      ) : null}

      <div className="rounded-xl border border-hairline bg-fill-subtle p-3 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <p className="text-xs font-semibold text-muted">
            Giao dịch gần đây {totalItems > 0 ? `· ${totalItems} đơn` : ""}
          </p>
          <div className="flex w-full items-center gap-2 sm:w-auto sm:justify-end">
            <div className="-mx-1 flex max-w-full flex-wrap gap-1.5 overflow-x-auto px-1 pb-0.5 sm:flex-wrap sm:overflow-visible">
              {FILTER_OPTIONS.map((opt) => {
                const active = statusFilter === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setStatusFilter(opt.value)}
                    className={`filter-chip shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      active ? "filter-chip-active" : ""
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => void reload()}
              className="filter-icon-btn inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
              aria-label="Làm mới"
              disabled={paymentsLoading}
            >
              <RefreshCcw className={`h-3.5 w-3.5 ${paymentsLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {paymentsError ? (
          <p className="mt-3 text-sm font-medium text-rose-600 dark:text-rose-400">
            {paymentsError}
          </p>
        ) : null}

        <div className="mt-3 min-h-[12.5rem]">
          {showPaymentsSkeleton ? (
            <ProjectPaymentsListSkeleton count={pageSize} />
          ) : items.length === 0 ? (
            <div className="flex min-h-[12.5rem] items-center justify-center">
              <p className="text-sm text-muted">
                {statusFilter === "All"
                  ? "Chưa có giao dịch nào."
                  : "Không có giao dịch khớp filter."}
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {items.map((item) => (
                <RecentRow
                  key={item.id}
                  item={item}
                  projectName={showProjectName ? projectNameMap.get(item.projectId) : undefined}
                />
              ))}
            </ul>
          )}
        </div>

        <Pagination
          page={page}
          totalPages={totalPages}
          onChange={setPage}
          pageSize={pageSize}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          onPageSizeChange={setPageSize}
          label={
            <span className="text-[11px] text-muted">
              Trang {totalPages === 0 ? 0 : page}/{totalPages}
            </span>
          }
        />
      </div>
    </section>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  tone?: string;
}) {
  return (
    <div className="min-h-[5.5rem] rounded-xl border border-hairline bg-fill-subtle p-3">
      <div className="flex items-center gap-2 text-muted">
        {icon}
        <span className="text-[11px] font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className={`mt-2 font-display text-lg font-bold ${tone ?? "text-ink"}`}>{value}</p>
      {hint ? (
        <p className="mt-0.5 text-[11px] text-muted">{hint}</p>
      ) : (
        <span className="mt-0.5 block h-3" aria-hidden />
      )}
    </div>
  );
}

function RecentRow({ item, projectName }: { item: PaymentIntentItem; projectName?: string }) {
  const key = statusKey(item.status);
  const label = STATUS_LABEL[key] ?? key;
  const badgeClass = STATUS_BADGE_CLASS[key] ?? "dev-payment-status--neutral";

  return (
    <li className="dev-payment-row flex flex-col gap-1 rounded-lg px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold">{item.transferCode}</p>
          <span className={`dev-payment-status rounded-full px-2 py-0.5 text-[10px] ${badgeClass}`}>
            {label}
          </span>
        </div>
        <p className="dev-payment-row__meta mt-0.5 truncate text-[11px]">
          {projectName ? `${projectName} · ` : ""}
          {item.merchantRef ? `${item.merchantRef} · ` : ""}
          {formatDateTime(item.createdAt)}
        </p>
      </div>
      <p className="font-mono text-sm font-semibold">{formatCurrency(item.amount)}</p>
    </li>
  );
}

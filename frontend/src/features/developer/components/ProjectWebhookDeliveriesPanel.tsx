import { RefreshCw } from "lucide-react";
import { DepositHistoryTableSkeleton, Pagination } from "../../../shared/components/ui";
import { useStableLoading } from "../../../shared/hooks/useStableLoading";
import { formatDateTime } from "../../../shared/lib/format";
import { useInsightsWebhookDeliveries } from "../hooks/useInsightsData";
import type { DeveloperProjectResponse } from "../types";

interface Props {
  projectId: string | null;
  projects: DeveloperProjectResponse[];
  enabled?: boolean;
  projectsReady: boolean;
  showProjectName?: boolean;
}

const EVENT_LABEL: Record<string, string> = {
  payment_paid: "Đã thanh toán",
  payment_failed: "Thất bại",
  payment_expired: "Hết hạn",
  payment_cancelled: "Đã hủy",
};

function eventLabel(eventType: string): string {
  return EVENT_LABEL[eventType] ?? eventType;
}

export default function ProjectWebhookDeliveriesPanel({
  projectId,
  projects,
  enabled = true,
  projectsReady,
  showProjectName = false,
}: Props) {
  const log = useInsightsWebhookDeliveries(projectId, projects, enabled, projectsReady);
  const showSkeleton = useStableLoading(log.loading, {
    hasData: log.items.length > 0 || Boolean(log.error) || !log.loading,
  });

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h6 className="text-sm font-semibold text-ink">Lịch sử gọi webhook</h6>
          <p className="mt-1 text-xs text-muted">
            Mỗi lần VexPay POST tới webhook URL của project (gồm các lần retry).
          </p>
        </div>
        <button
          type="button"
          onClick={log.reload}
          className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-all hover:bg-primary/20"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Làm mới
        </button>
      </div>

      {log.error ? (
        <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{log.error}</p>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-hairline">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-hairline bg-fill-subtle text-[11px] uppercase tracking-wider text-muted">
              <th className="px-3 py-2.5 font-semibold">Thời gian</th>
              {showProjectName ? (
                <th className="px-3 py-2.5 font-semibold">Project</th>
              ) : null}
              <th className="px-3 py-2.5 font-semibold">Sự kiện</th>
              <th className="px-3 py-2.5 font-semibold">Lần</th>
              <th className="px-3 py-2.5 font-semibold">HTTP</th>
              <th className="px-3 py-2.5 font-semibold">Payment</th>
              <th className="px-3 py-2.5 font-semibold">Chi tiết</th>
            </tr>
          </thead>
          <tbody
            className={`divide-y divide-hairline transition-opacity duration-150 ${
              log.paging ? "pointer-events-none opacity-45" : "opacity-100"
            }`}
          >
            {showSkeleton ? (
              <DepositHistoryTableSkeleton rowCount={6} />
            ) : log.items.length === 0 ? (
              <tr>
                <td colSpan={showProjectName ? 7 : 6} className="px-3 py-10 text-center text-muted">
                  Chưa có lần gọi webhook nào.
                </td>
              </tr>
            ) : (
              log.items.map((row) => (
                <tr key={row.id} className="align-top">
                  <td className="px-3 py-3 text-xs text-muted whitespace-nowrap">
                    {formatDateTime(row.createdAt)}
                  </td>
                  {showProjectName ? (
                    <td className="px-3 py-3 text-xs font-medium text-ink">{row.projectName}</td>
                  ) : null}
                  <td className="px-3 py-3">
                    <span className="inline-flex rounded-full bg-fill-subtle px-2 py-0.5 text-[11px] font-semibold text-ink">
                      {eventLabel(row.eventType)}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-xs text-muted">#{row.attempt}</td>
                  <td className="px-3 py-3">
                    {row.httpStatusCode != null ? (
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 font-mono text-[11px] font-semibold ${
                          row.success
                            ? "text-emerald-700 dark:text-emerald-300 bg-emerald-500/10"
                            : "text-rose-700 dark:text-rose-300 bg-rose-500/10"
                        }`}
                      >
                        {row.httpStatusCode}
                      </span>
                    ) : (
                      <span className="text-xs text-muted">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <code className="font-mono text-[11px] text-muted">
                      {row.paymentIntentId.slice(0, 8)}…
                    </code>
                  </td>
                  <td className="max-w-xs px-3 py-3 text-xs text-muted">
                    {row.success ? (
                      <span className="text-emerald-600 dark:text-emerald-400">Thành công</span>
                    ) : (
                      <span className="text-rose-600 dark:text-rose-400">
                        {row.errorMessage ?? row.responseBody ?? "Lỗi không xác định"}
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {log.totalPages > 1 ? (
        <Pagination page={log.page} totalPages={log.totalPages} onChange={log.changePage} />
      ) : null}
    </section>
  );
}

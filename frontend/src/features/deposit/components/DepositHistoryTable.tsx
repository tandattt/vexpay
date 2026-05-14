import { Fragment } from "react";
import { ChevronDown, ChevronRight, RefreshCw } from "lucide-react";
import { DepositHistoryTableSkeleton, QrFrameSkeleton } from "../../../shared/components/ui";
import { useStableLoading } from "../../../shared/hooks/useStableLoading";
import { formatCountdown } from "../../../shared/lib/format";
import BankInfoLine from "./BankInfoLine";
import DepositRowStatusBadge from "./DepositRowStatusBadge";
import QrFrame from "./QrFrame";
import type { DepositQrConfigResponse, HistoryRow } from "../types";

const HISTORY_PAGE_SIZE = 5;

interface Props {
  rows: HistoryRow[];
  isLoading: boolean;
  isPaging: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  expandedId: string | null;
  expandedQrImageUrl: string | null;
  qrConfig: DepositQrConfigResponse | null;
  onToggleRow: (row: HistoryRow) => void;
  onRefresh: () => void;
  onChangePage: (page: number) => void;
}

export default function DepositHistoryTable({
  rows,
  isLoading,
  isPaging,
  error,
  page,
  totalPages,
  expandedId,
  expandedQrImageUrl,
  qrConfig,
  onToggleRow,
  onRefresh,
  onChangePage,
}: Props) {
  const showInitialSkeleton = useStableLoading(isLoading, {
    hasData: rows.length > 0 || Boolean(error) || !isLoading,
  });

  return (
    <section className="glass overflow-hidden rounded-2xl">
      <div className="flex items-center justify-between border-b border-hairline px-6 py-5">
        <h3 className="font-display text-base font-semibold text-ink">Lịch sử nạp tiền</h3>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-all hover:bg-primary/20"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Làm mới
        </button>
      </div>

      <div className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-hairline bg-fill-subtle text-[11px] uppercase tracking-wider text-muted">
              <th className="px-4 py-3 font-semibold">Ngày</th>
              <th className="px-4 py-3 font-semibold">Số tiền</th>
              <th className="px-4 py-3 font-semibold">Trạng thái</th>
              <th className="px-4 py-3 font-semibold">Phương thức</th>
              <th className="px-4 py-3 text-right font-semibold"> </th>
            </tr>
          </thead>
          <tbody
            className={`divide-y divide-hairline transition-opacity duration-150 ${
              isPaging ? "pointer-events-none opacity-45" : "opacity-100"
            }`}
          >
            {showInitialSkeleton ? (
              <DepositHistoryTableSkeleton rowCount={HISTORY_PAGE_SIZE} />
            ) : error ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-rose-600 dark:text-rose-400">
                  {error}
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted">
                  Chưa có giao dịch nạp nào.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const isExpanded = expandedId === row.id;
                return (
                  <Fragment key={row.id}>
                    <tr
                      onClick={row.status === "Pending" ? () => onToggleRow(row) : undefined}
                      className={
                        "transition-colors " +
                        (row.status === "Pending"
                          ? "cursor-pointer hover:bg-primary/5"
                          : "hover:bg-fill-subtle")
                      }
                    >
                      <td className="px-4 py-3 text-muted">{row.date}</td>
                      <td className="px-4 py-3 font-semibold text-ink">{row.amount}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <DepositRowStatusBadge status={row.status} />
                          {row.status === "Pending" ? (
                            <span className="text-xs font-semibold text-primary">
                              {formatCountdown(row.remainingSeconds)}
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted">{row.method}</td>
                      <td className="px-4 py-3 text-right">
                        {row.status === "Pending" ? (
                          <span className="inline-flex items-center text-primary">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </span>
                        ) : null}
                      </td>
                    </tr>
                    {isExpanded ? (
                      <tr className="bg-fill-subtle">
                        <td colSpan={5} className="px-4 py-4">
                          <div className="flex flex-col items-center gap-2">
                            <p className="text-xs font-medium text-muted">
                              Mã nạp: <span className="text-primary">{row.code}</span>
                            </p>
                            {expandedQrImageUrl ? (
                              <QrFrame
                                src={expandedQrImageUrl}
                                alt={`QR ${row.code}`}
                                size="sm"
                              />
                            ) : (
                              <QrFrameSkeleton size="sm" />
                            )}
                            {qrConfig ? <BankInfoLine config={qrConfig} size="sm" /> : null}
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>

        <div className="flex items-center justify-between border-t border-hairline px-4 py-3 text-xs text-muted">
          <span className="inline-flex items-center gap-2">
            Trang {totalPages === 0 ? 0 : page}/{totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onChangePage(page - 1)}
              disabled={isLoading || isPaging || page <= 1}
              className="rounded-lg border border-hairline px-3 py-1.5 font-semibold text-ink transition-colors hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              Trước
            </button>
            <button
              type="button"
              onClick={() => onChangePage(page + 1)}
              disabled={isLoading || isPaging || page >= totalPages}
              className="rounded-lg border border-hairline px-3 py-1.5 font-semibold text-ink transition-colors hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              Sau
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

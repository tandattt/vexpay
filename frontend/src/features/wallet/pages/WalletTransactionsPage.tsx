import { RefreshCw } from "lucide-react";
import { Pagination, DepositHistoryTableSkeleton } from "../../../shared/components/ui";
import { useStableLoading } from "../../../shared/hooks/useStableLoading";
import { formatCurrency, formatDateTime } from "../../../shared/lib/format";
import { useWalletTransactions } from "../hooks/useWalletTransactions";
import type { DepositStatusValue, WalletTransactionDirection, WalletTransactionType } from "../types";

interface Props {
  token: string;
  enabled?: boolean;
}

const TYPE_LABEL: Record<string, string> = {
  Deposit: "Nạp tiền",
  PaymentDebit: "Thanh toán",
  PaymentCredit: "Thu thanh toán",
  "0": "Nạp tiền",
  "1": "Thanh toán",
  "2": "Thu thanh toán",
};

const DEPOSIT_STATUS_LABEL: Record<string, string> = {
  Pending: "Đang chờ",
  Completed: "Thành công",
  Failed: "Thất bại",
  Cancelled: "Đã hủy",
  Expired: "Hết hạn",
  "0": "Đang chờ",
  "1": "Thành công",
  "2": "Thất bại",
  "3": "Đã hủy",
  "4": "Hết hạn",
};

function isCredit(direction: WalletTransactionDirection): boolean {
  return direction === "Credit" || direction === 0;
}

function typeLabel(type: WalletTransactionType): string {
  return TYPE_LABEL[String(type)] ?? String(type);
}

function depositStatusLabel(status?: DepositStatusValue | null): string | null {
  if (status === undefined || status === null) return null;
  return DEPOSIT_STATUS_LABEL[String(status)] ?? null;
}

function isSettledCredit(
  credit: boolean,
  depositStatus?: DepositStatusValue | null,
): boolean {
  if (!credit) return false;
  if (depositStatus === undefined || depositStatus === null) return true;
  return depositStatus === "Completed" || depositStatus === 1;
}

export default function WalletTransactionsPage({ token, enabled = true }: Props) {
  const tx = useWalletTransactions(token, enabled);
  const showSkeleton = useStableLoading(tx.loading, {
    hasData: tx.items.length > 0 || Boolean(tx.error) || !tx.loading,
  });

  return (
    <section className="glass overflow-hidden rounded-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-6 py-5">
        <div>
          <h3 className="font-display text-base font-semibold text-ink">Lịch sử biến động ví</h3>
          <p className="mt-1 text-xs text-muted">
            Nạp tiền, thanh toán dịch vụ và thu từ khách hàng trong một danh sách.
          </p>
        </div>
        <button
          type="button"
          onClick={tx.reload}
          className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-all hover:bg-primary/20"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Làm mới
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-hairline bg-fill-subtle text-[11px] uppercase tracking-wider text-muted">
              <th className="px-4 py-3 font-semibold">Thời gian</th>
              <th className="px-4 py-3 font-semibold">Loại</th>
              <th className="px-4 py-3 font-semibold">Mô tả</th>
              <th className="px-4 py-3 text-right font-semibold">Số tiền</th>
            </tr>
          </thead>
          <tbody
            className={`divide-y divide-hairline transition-opacity duration-150 ${
              tx.paging ? "pointer-events-none opacity-45" : "opacity-100"
            }`}
          >
            {showSkeleton ? (
              <DepositHistoryTableSkeleton rowCount={8} />
            ) : tx.error ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-rose-600 dark:text-rose-400">
                  {tx.error}
                </td>
              </tr>
            ) : tx.items.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted">
                  Chưa có biến động ví nào.
                </td>
              </tr>
            ) : (
              tx.items.map((row) => {
                const credit = isCredit(row.direction);
                const settled = isSettledCredit(credit, row.depositStatus);
                const statusLabel = depositStatusLabel(row.depositStatus);
                return (
                  <tr key={row.id} className="wallet-tx-row">
                    <td className="px-4 py-3 text-muted">{formatDateTime(row.createdAt)}</td>
                    <td className="px-4 py-3">
                      <span className="wallet-tx-type inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold">
                        {typeLabel(row.type)}
                      </span>
                    </td>
                    <td className="max-w-md px-4 py-3 text-ink">
                      <div className="flex flex-wrap items-center gap-2">
                        <span>{row.description}</span>
                        {statusLabel ? (
                          <span className="rounded-full bg-fill-subtle px-2 py-0.5 text-[11px] font-semibold text-muted">
                            {statusLabel}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-mono font-semibold ${
                        settled
                          ? "text-emerald-600 dark:text-emerald-400"
                          : credit
                            ? "text-muted"
                            : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {settled ? "+" : credit ? "" : "−"}
                      {formatCurrency(row.amount)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {tx.totalPages > 1 ? (
        <div className="border-t border-hairline px-4 py-4">
          <Pagination page={tx.page} totalPages={tx.totalPages} onChange={tx.changePage} />
        </div>
      ) : null}
    </section>
  );
}

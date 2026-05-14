import { DataTable, StatusBadge } from "../../../shared/components/ui";
import { formatDateTime } from "../../../shared/lib/format";
import type { AdminDeveloperRequestItemResponse } from "../types";

interface Props {
  rows: AdminDeveloperRequestItemResponse[];
  onApprove: (row: AdminDeveloperRequestItemResponse) => void;
  onReject: (row: AdminDeveloperRequestItemResponse) => void;
  onRevoke: (row: AdminDeveloperRequestItemResponse) => void;
}

export default function AdminDeveloperRequestsTable({
  rows,
  onApprove,
  onReject,
  onRevoke,
}: Props) {
  return (
    <DataTable headers={["User", "Status", "Requested", "Hành động"]}>
      {rows.map((r) => (
        <tr key={r.id} className="group transition-colors hover:bg-fill-subtle">
          <td className="px-6 py-4 text-sm font-semibold text-ink">{r.userName}</td>
          <td className="px-6 py-4">
            <StatusBadge status={r.status} />
          </td>
          <td className="px-6 py-4 text-sm text-muted">{formatDateTime(r.requestedAt)}</td>
          <td className="space-x-2 px-6 py-4 text-right">
            {r.status === "Approved" ? (
              <button
                className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 transition-colors hover:bg-amber-500/20"
                onClick={() => onRevoke(r)}
              >
                Thu hồi
              </button>
            ) : (
              <button
                className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 transition-colors hover:bg-emerald-500/20"
                onClick={() => onApprove(r)}
              >
                Duyệt
              </button>
            )}
            {r.status === "Pending" ? (
              <button
                className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 transition-colors hover:bg-rose-500/20"
                onClick={() => onReject(r)}
              >
                Từ chối
              </button>
            ) : null}
          </td>
        </tr>
      ))}
    </DataTable>
  );
}

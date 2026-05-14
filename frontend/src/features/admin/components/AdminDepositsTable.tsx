import { CircleEllipsis } from "lucide-react";
import { DataTable, StatusBadge } from "../../../shared/components/ui";
import { formatCurrency } from "../../../shared/lib/format";
import type { AdminDepositItemResponse } from "../types";

interface Props {
  rows: AdminDepositItemResponse[];
}

export default function AdminDepositsTable({ rows }: Props) {
  return (
    <DataTable headers={["Code", "User", "Amount", "Status", "Hành động"]}>
      {rows.map((d) => (
        <tr key={d.id} className="group transition-colors hover:bg-fill-subtle">
          <td className="px-6 py-4 text-sm font-bold text-primary">{d.code}</td>
          <td className="px-6 py-4">
            <div className="flex items-center">
              <span className="mr-3 flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary text-xs font-bold text-on-primary">
                {d.userName.charAt(0).toUpperCase() || "U"}
              </span>
              <span className="text-sm font-medium text-ink">{d.userName}</span>
            </div>
          </td>
          <td className="px-6 py-4 text-sm font-semibold text-ink">
            {formatCurrency(d.amount)}
          </td>
          <td className="px-6 py-4 text-center">
            <StatusBadge status={d.status} />
          </td>
          <td className="px-6 py-4 text-right">
            <CircleEllipsis className="ml-auto h-5 w-5 text-muted" />
          </td>
        </tr>
      ))}
    </DataTable>
  );
}

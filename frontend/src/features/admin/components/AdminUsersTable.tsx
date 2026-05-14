import { DataTable } from "../../../shared/components/ui";
import type { AdminUserItemResponse } from "../types";

interface Props {
  rows: AdminUserItemResponse[];
  onLock: (user: AdminUserItemResponse) => void;
  onOpenRoles: (user: AdminUserItemResponse) => void;
}

export default function AdminUsersTable({ rows, onLock, onOpenRoles }: Props) {
  return (
    <DataTable headers={["Username", "Tên", "Email", "Roles", "Hành động"]}>
      {rows.map((u) => {
        const isAdmin = u.roles.includes("ADMIN");
        return (
          <tr key={u.id} className="group transition-colors hover:bg-fill-subtle">
            <td className="px-6 py-4 text-sm font-bold text-primary">{u.username}</td>
            <td className="px-6 py-4 text-sm font-medium text-ink">{u.fullName}</td>
            <td className="px-6 py-4 text-sm text-muted">{u.email}</td>
            <td className="px-6 py-4 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                {u.roles.map((role) => (
                  <span
                    key={role}
                    className="rounded-full border border-secondary/25 bg-secondary/15 px-2.5 py-0.5 text-[11px] font-semibold text-secondary"
                  >
                    {role.toLowerCase()}
                  </span>
                ))}
                {u.isLocked ? (
                  <span className="rounded-full border border-rose-500/25 bg-rose-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                    locked
                  </span>
                ) : null}
              </div>
            </td>
            <td className="space-x-2 px-6 py-4 text-right">
              {isAdmin ? null : (
                <>
                  <button
                    className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 transition-colors hover:bg-amber-500/20"
                    onClick={() => onLock(u)}
                  >
                    {u.isLocked ? "Mở khóa" : "Khóa"}
                  </button>
                  <button
                    className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
                    onClick={() => onOpenRoles(u)}
                  >
                    Nâng quyền
                  </button>
                </>
              )}
            </td>
          </tr>
        );
      })}
    </DataTable>
  );
}

import { useMemo, useState } from "react";
import {
  setAdminUserLock,
  updateAdminDeveloperRequestStatus,
  updateAdminUser,
} from "../api";
import AdminDepositsTable from "../components/AdminDepositsTable";
import AdminDeveloperRequestsTable from "../components/AdminDeveloperRequestsTable";
import AdminPaginationBar from "../components/AdminPaginationBar";
import AdminSummaryCards from "../components/AdminSummaryCards";
import AdminToolbar from "../components/AdminToolbar";
import AdminUsersTable from "../components/AdminUsersTable";
import UserRolesModal from "../components/UserRolesModal";
import { useAdminData } from "../hooks/useAdminData";
import type { AdminMenu, AdminUserItemResponse } from "../types";
import {
  AdminPaginationSkeleton,
  AdminSummaryCardsSkeleton,
  TableBodySkeleton,
} from "../../../shared/components/ui";
import { useStableLoading } from "../../../shared/hooks/useStableLoading";

interface Props {
  token: string | null;
  activeMenu: AdminMenu;
}

const TABLE_HEADERS: Record<Exclude<AdminMenu, "admin-dashboard">, string[]> = {
  "admin-users": ["Username", "Tên", "Email", "Roles", "Hành động"],
  "admin-deposits": ["Code", "User", "Amount", "Status", "Hành động"],
  "admin-developers": ["User", "Status", "Requested", "Hành động"],
};

export default function AdminPage({ token, activeMenu }: Props) {
  const data = useAdminData({ token, activeMenu });
  const showInitialSkeleton = useStableLoading(data.loading);
  const showRefreshSkeleton = useStableLoading(data.isRefreshing);

  const [query, setQuery] = useState("");
  const [roleModalUser, setRoleModalUser] = useState<AdminUserItemResponse | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [isSavingRoles, setIsSavingRoles] = useState(false);

  const filteredUsers = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return data.users;
    return data.users.filter((u) =>
      [u.username, u.fullName, u.email, u.roles.join(" ")].some((x) =>
        x.toLowerCase().includes(keyword),
      ),
    );
  }, [query, data.users]);

  const filteredDeposits = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return data.deposits;
    return data.deposits.filter((d) =>
      [d.code, d.userName, d.status, String(d.amount)].some((x) =>
        x.toLowerCase().includes(keyword),
      ),
    );
  }, [query, data.deposits]);

  const filteredRequests = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return data.requests;
    return data.requests.filter((r) =>
      [r.userName, r.status, new Date(r.requestedAt).toLocaleString("vi-VN")].some((x) =>
        x.toLowerCase().includes(keyword),
      ),
    );
  }, [query, data.requests]);

  if (data.error && !data.loading) {
    return (
      <section className="glass rounded-2xl border-rose-500/30 p-8 text-center text-rose-600 dark:text-rose-400">
        {data.error}
      </section>
    );
  }

  if (activeMenu === "admin-dashboard") {
    if (showInitialSkeleton) return <AdminSummaryCardsSkeleton />;
    return <AdminSummaryCards summary={data.summary} />;
  }

  const activeTitle =
    activeMenu === "admin-users"
      ? "Danh sách người dùng"
      : activeMenu === "admin-deposits"
      ? "Danh sách nạp tiền"
      : "Danh sách yêu cầu developer";

  const placeholder =
    activeMenu === "admin-users"
      ? "Tìm kiếm người dùng..."
      : activeMenu === "admin-deposits"
      ? "Tìm kiếm giao dịch..."
      : "Tìm kiếm yêu cầu...";

  const tablePageSize =
    activeMenu === "admin-users"
      ? data.usersPageSize
      : activeMenu === "admin-deposits"
      ? data.depositsPageSize
      : data.requestsPageSize;

  const refresh = () =>
    void data.load(data.usersPaging.page, data.depositsPaging.page, data.requestsPaging.page);

  const refreshSilent = () =>
    void data.load(
      data.usersPaging.page,
      data.depositsPaging.page,
      data.requestsPaging.page,
      { silent: true },
    );

  const handleDeveloperAction = async (id: string, status: string) => {
    await updateAdminDeveloperRequestStatus(id, { status });
    refreshSilent();
  };

  const showTableSkeleton = showInitialSkeleton || showRefreshSkeleton;
  const headers = TABLE_HEADERS[activeMenu];

  return (
    <div className="space-y-8">
      <section className="glass overflow-hidden rounded-2xl">
        <AdminToolbar
          title={activeTitle}
          query={query}
          onQueryChange={setQuery}
          placeholder={placeholder}
          isRefreshing={data.isRefreshing}
          onRefresh={refresh}
        />

        {showTableSkeleton ? (
          <TableBodySkeleton
            headers={headers}
            rowCount={tablePageSize}
            depositsUserColumn={activeMenu === "admin-deposits"}
          />
        ) : (
          <>
            {activeMenu === "admin-users" ? (
              <AdminUsersTable
                rows={filteredUsers}
                onLock={async (u) => {
                  await setAdminUserLock(u.id, !u.isLocked);
                  refreshSilent();
                }}
                onOpenRoles={(u) => {
                  setRoleModalUser(u);
                  setSelectedRoles(u.roles);
                }}
              />
            ) : null}
            {activeMenu === "admin-deposits" ? (
              <AdminDepositsTable rows={filteredDeposits} />
            ) : null}
            {activeMenu === "admin-developers" ? (
              <AdminDeveloperRequestsTable
                rows={filteredRequests}
                onApprove={(r) => void handleDeveloperAction(r.id, "Approved")}
                onReject={(r) => void handleDeveloperAction(r.id, "Rejected")}
                onRevoke={(r) => void handleDeveloperAction(r.id, "Revoked")}
              />
            ) : null}
          </>
        )}
      </section>

      {showInitialSkeleton ? (
        <AdminPaginationSkeleton />
      ) : activeMenu === "admin-users" ? (
        <AdminPaginationBar
          label={`Hiển thị ${filteredUsers.length} người dùng`}
          page={data.usersPaging.page}
          totalPages={data.usersPaging.totalPages}
          pageSize={data.usersPageSize}
          pageSizeOptions={data.pageSizeOptions}
          onPageSizeChange={data.changeUsersPageSize}
          onChange={(page) =>
            void data.load(page, data.depositsPaging.page, data.requestsPaging.page, { silent: true })
          }
        />
      ) : activeMenu === "admin-deposits" ? (
        <AdminPaginationBar
          label={`Hiển thị ${filteredDeposits.length} giao dịch`}
          page={data.depositsPaging.page}
          totalPages={data.depositsPaging.totalPages}
          pageSize={data.depositsPageSize}
          pageSizeOptions={data.pageSizeOptions}
          onPageSizeChange={data.changeDepositsPageSize}
          onChange={(page) =>
            void data.load(data.usersPaging.page, page, data.requestsPaging.page, { silent: true })
          }
        />
      ) : (
        <AdminPaginationBar
          label={`Hiển thị ${filteredRequests.length} yêu cầu`}
          page={data.requestsPaging.page}
          totalPages={data.requestsPaging.totalPages}
          pageSize={data.requestsPageSize}
          pageSizeOptions={data.pageSizeOptions}
          onPageSizeChange={data.changeRequestsPageSize}
          onChange={(page) =>
            void data.load(data.usersPaging.page, data.depositsPaging.page, page, { silent: true })
          }
        />
      )}

      <UserRolesModal
        user={roleModalUser}
        selectedRoles={selectedRoles}
        isSaving={isSavingRoles}
        onToggleRole={(role) =>
          setSelectedRoles((current) =>
            current.includes(role) ? current.filter((x) => x !== role) : [...current, role],
          )
        }
        onCancel={() => setRoleModalUser(null)}
        onSave={async () => {
          if (!roleModalUser) return;
          try {
            setIsSavingRoles(true);
            await updateAdminUser(roleModalUser.id, {
              fullName: roleModalUser.fullName,
              phoneNumber: roleModalUser.phoneNumber,
              email: roleModalUser.email,
              roles: selectedRoles,
            });
            setRoleModalUser(null);
            refreshSilent();
          } finally {
            setIsSavingRoles(false);
          }
        }}
      />
    </div>
  );
}

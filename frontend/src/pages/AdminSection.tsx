import { useEffect, useMemo, useState } from "react";
import { Banknote, Building2, Check, ChevronLeft, ChevronRight, CircleEllipsis, Code2, FileClock, RefreshCw, Search, ShieldAlert, ShoppingCart, UserRound, Users } from "lucide-react";
import {
  getAdminDeposits,
  getAdminDeveloperRequests,
  getAdminSummary,
  getAdminUsers,
  setAdminUserLock,
  updateAdminDeveloperRequestStatus,
  updateAdminUser,
} from "../api/admin";
import { HttpError } from "../api/client";
import type { AdminDepositItemResponse, AdminDeveloperRequestItemResponse, AdminSummaryResponse, AdminUserItemResponse } from "../types";

export type AdminMenu = "admin-dashboard" | "admin-users" | "admin-deposits" | "admin-developers";
type AdminDataMenu = Exclude<AdminMenu, "admin-dashboard">;
type PageSize = 10 | 20 | 30 | 40;

const PAGE_SIZE_OPTIONS: PageSize[] = [10, 20, 30, 40];
const PAGE_SIZE_STORAGE_KEYS: Record<AdminDataMenu, string> = {
  "admin-users": "vexpay.admin.page_size.users",
  "admin-deposits": "vexpay.admin.page_size.deposits",
  "admin-developers": "vexpay.admin.page_size.developers",
};

interface Props {
  token: string;
  activeMenu: AdminMenu;
}

function readStoredPageSize(menu: AdminDataMenu): PageSize {
  if (typeof window === "undefined") return 10;
  const raw = window.localStorage.getItem(PAGE_SIZE_STORAGE_KEYS[menu]);
  const parsed = Number(raw);
  return PAGE_SIZE_OPTIONS.includes(parsed as PageSize) ? (parsed as PageSize) : 10;
}

export default function AdminSection({ token, activeMenu }: Props) {
  const [summary, setSummary] = useState<AdminSummaryResponse | null>(null);
  const [users, setUsers] = useState<AdminUserItemResponse[]>([]);
  const [deposits, setDeposits] = useState<AdminDepositItemResponse[]>([]);
  const [requests, setRequests] = useState<AdminDeveloperRequestItemResponse[]>([]);
  const [usersPage, setUsersPage] = useState(1);
  const [depositsPage, setDepositsPage] = useState(1);
  const [requestsPage, setRequestsPage] = useState(1);
  const [usersTotalPages, setUsersTotalPages] = useState(0);
  const [depositsTotalPages, setDepositsTotalPages] = useState(0);
  const [requestsTotalPages, setRequestsTotalPages] = useState(0);
  const [usersPageSize, setUsersPageSize] = useState<PageSize>(() => readStoredPageSize("admin-users"));
  const [depositsPageSize, setDepositsPageSize] = useState<PageSize>(() => readStoredPageSize("admin-deposits"));
  const [requestsPageSize, setRequestsPageSize] = useState<PageSize>(() => readStoredPageSize("admin-developers"));
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [roleModalUser, setRoleModalUser] = useState<AdminUserItemResponse | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [isSavingRoles, setIsSavingRoles] = useState(false);

  const loadAll = async (
    nextUsersPage = usersPage,
    nextDepositsPage = depositsPage,
    nextRequestsPage = requestsPage,
    options?: { silent?: boolean },
  ) => {
    try {
      setError(null);
      if (loading) setLoading(true);
      else setIsRefreshing(!options?.silent);
      const [s, u, d, r] = await Promise.all([
        getAdminSummary(token),
        getAdminUsers(token, nextUsersPage, usersPageSize),
        getAdminDeposits(token, nextDepositsPage, depositsPageSize),
        getAdminDeveloperRequests(token, nextRequestsPage, requestsPageSize),
      ]);

      const resolvePaged = <T,>(value: unknown) => {
        if (Array.isArray(value)) return { items: value as T[], page: 1, totalPages: 1 };
        const maybe = value as { items?: T[]; page?: number; totalPages?: number } | null;
        return {
          items: Array.isArray(maybe?.items) ? maybe.items : [],
          page: typeof maybe?.page === "number" && maybe.page > 0 ? maybe.page : 1,
          totalPages: typeof maybe?.totalPages === "number" && maybe.totalPages >= 0 ? maybe.totalPages : 1,
        };
      };

      const usersPaged = resolvePaged<AdminUserItemResponse>(u);
      const depositsPaged = resolvePaged<AdminDepositItemResponse>(d);
      const requestsPaged = resolvePaged<AdminDeveloperRequestItemResponse>(r);

      setSummary(s);
      setUsers(usersPaged.items);
      setDeposits(depositsPaged.items);
      setRequests(requestsPaged.items);
      setUsersPage(usersPaged.page);
      setDepositsPage(depositsPaged.page);
      setRequestsPage(requestsPaged.page);
      setUsersTotalPages(usersPaged.totalPages);
      setDepositsTotalPages(depositsPaged.totalPages);
      setRequestsTotalPages(requestsPaged.totalPages);
    } catch (e) {
      setError(e instanceof HttpError ? e.message : "Không tải được dữ liệu admin.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => { void loadAll(); }, [token]);
  useEffect(() => { setQuery(""); void loadAll(usersPage, depositsPage, requestsPage, { silent: true }); }, [activeMenu]);
  useEffect(() => { void loadAll(usersPage, depositsPage, requestsPage, { silent: true }); }, [usersPageSize, depositsPageSize, requestsPageSize]);

  const filteredUsers = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return users;
    return users.filter((u) => [u.username, u.fullName, u.email, u.roles.join(" ")].some((x) => x.toLowerCase().includes(keyword)));
  }, [query, users]);

  const filteredDeposits = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return deposits;
    return deposits.filter((d) => [d.code, d.userName, d.status, String(d.amount)].some((x) => x.toLowerCase().includes(keyword)));
  }, [query, deposits]);

  const filteredRequests = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return requests;
    return requests.filter((r) => [r.userName, r.status, new Date(r.requestedAt).toLocaleString("vi-VN")].some((x) => x.toLowerCase().includes(keyword)));
  }, [query, requests]);

  if (loading) return <section className="rounded-3xl border border-[#dce2f3] bg-white p-8 text-[#424656] shadow-sm">Đang tải dữ liệu quản trị...</section>;
  if (error) return <section className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-rose-700 shadow-sm">{error}</section>;

  const activeTitle = activeMenu === "admin-users" ? "Danh sách người dùng" : activeMenu === "admin-deposits" ? "Danh sách nạp tiền" : "Danh sách yêu cầu developer";
  const placeholder = activeMenu === "admin-users" ? "Tìm kiếm người dùng..." : activeMenu === "admin-deposits" ? "Tìm kiếm giao dịch..." : "Tìm kiếm yêu cầu...";

  if (activeMenu === "admin-dashboard") {
    return (
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard icon={Users} title="Users" value={String(summary?.totalUsers ?? 0)} tone="primary" />
        <StatCard icon={Banknote} title="Deposits" value={String(summary?.totalDeposits ?? 0)} tone="secondary" />
        <StatCard icon={Building2} title="Total amount" value={`${new Intl.NumberFormat("vi-VN").format(summary?.totalDepositAmount ?? 0)}đ`} tone="tertiary" />
        <StatCard icon={FileClock} title="Pending deposits" value={String(summary?.pendingDeposits ?? 0)} tone="neutral" />
        <StatCard icon={ShieldAlert} title="Pending dev req" value={String(summary?.pendingDeveloperRequests ?? 0)} tone="error" />
      </section>
    );
  }

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-3xl border border-[#dce2f3] bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-[#e2e8f8] bg-white px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <h2 className="text-lg font-bold text-[#151c27]">{activeTitle}</h2>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-full min-w-0 items-center rounded-full border border-[#dce2f3] bg-[#f0f3ff] px-4 sm:w-72">
              <Search className="mr-2 h-4 w-4 text-[#727687]" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} className="min-w-0 flex-1 border-none bg-transparent text-sm text-[#151c27] outline-none placeholder:text-[#727687] focus:ring-0" placeholder={placeholder} type="search" />
            </div>
            <button type="button" disabled={isRefreshing} onClick={() => void loadAll(usersPage, depositsPage, requestsPage)} className="inline-flex h-11 shrink-0 items-center gap-2 rounded-lg bg-[#0050cb] px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#003fa4] disabled:cursor-not-allowed disabled:opacity-70">
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />{isRefreshing ? "Đang tải" : "Làm mới"}
            </button>
          </div>
        </div>

        <div className={`transition-opacity duration-200 ${isRefreshing ? "opacity-70" : "opacity-100"}`}>
          {activeMenu === "admin-users" ? <AdminUsersTable rows={filteredUsers} token={token} reload={loadAll} onLock={async (u) => { await setAdminUserLock(token, u.id, !u.isLocked); await loadAll(usersPage, depositsPage, requestsPage, { silent: true }); }} onOpenRoles={(u) => { setRoleModalUser(u); setSelectedRoles(u.roles); }} /> : null}
          {activeMenu === "admin-deposits" ? <AdminDepositsTable rows={filteredDeposits} /> : null}
          {activeMenu === "admin-developers" ? <AdminDevelopersTable rows={filteredRequests} token={token} reload={loadAll} /> : null}
        </div>
      </section>

      {activeMenu === "admin-users" ? (
        <AdminPagination
          label={`Hiển thị ${filteredUsers.length} người dùng`}
          page={usersPage}
          totalPages={usersTotalPages}
          pageSize={usersPageSize}
          onPageSizeChange={(value) => {
            setUsersPage(1);
            setUsersPageSize(value);
            window.localStorage.setItem(PAGE_SIZE_STORAGE_KEYS["admin-users"], String(value));
          }}
          onChange={(page) => void loadAll(page, depositsPage, requestsPage, { silent: true })}
        />
      ) : null}

      {activeMenu === "admin-deposits" ? (
        <AdminPagination
          label={`Hiển thị ${filteredDeposits.length} giao dịch`}
          page={depositsPage}
          totalPages={depositsTotalPages}
          pageSize={depositsPageSize}
          onPageSizeChange={(value) => {
            setDepositsPage(1);
            setDepositsPageSize(value);
            window.localStorage.setItem(PAGE_SIZE_STORAGE_KEYS["admin-deposits"], String(value));
          }}
          onChange={(page) => void loadAll(usersPage, page, requestsPage, { silent: true })}
        />
      ) : null}

      {activeMenu === "admin-developers" ? (
        <AdminPagination
          label={`Hiển thị ${filteredRequests.length} yêu cầu`}
          page={requestsPage}
          totalPages={requestsTotalPages}
          pageSize={requestsPageSize}
          onPageSizeChange={(value) => {
            setRequestsPage(1);
            setRequestsPageSize(value);
            window.localStorage.setItem(PAGE_SIZE_STORAGE_KEYS["admin-developers"], String(value));
          }}
          onChange={(page) => void loadAll(usersPage, depositsPage, page, { silent: true })}
        />
      ) : null}

      {roleModalUser ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-3 sm:p-4">
          <div className="w-full max-w-[560px] overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="px-5 pt-5 pb-3 sm:px-6 sm:pt-6">
              <h3 className="text-lg font-bold text-slate-900">Nâng quyền: <span className="text-[#0066ff]">{roleModalUser.username}</span></h3>
              <p className="mt-1 text-xs text-slate-500">Chọn role cần gán cho tài khoản.</p>
            </div>

            <div className="space-y-2.5 px-5 pb-6 sm:px-6">
              {[
                { key: "CUSTOMER", label: "CUSTOMER", desc: "Người dùng cuối cơ bản", icon: UserRound },
                { key: "DEVELOPER", label: "DEVELOPER", desc: "Truy cập API và công cụ lập trình", icon: Code2 },
                { key: "SHOP_OWNER", label: "SHOP_OWNER", desc: "Quản lý cửa hàng và sản phẩm", icon: ShoppingCart },
              ].map((role) => {
                const checked = selectedRoles.includes(role.key);
                const Icon = role.icon;
                return (
                  <button
                    key={role.key}
                    type="button"
                    onClick={() => setSelectedRoles((current) => checked ? current.filter((x) => x !== role.key) : [...current, role.key])}
                    className={`flex w-full items-center rounded-lg border px-3 py-3 text-left transition-all sm:px-3.5 ${checked ? "border-[#0066ff] bg-[#f0f3ff] shadow-[0_0_0_1px_#0066ff]" : "border-slate-200 bg-white hover:border-[#0066ff]/50"}`}
                  >
                    <span className={`mr-3 flex h-8 w-8 items-center justify-center rounded-full ${checked ? "bg-[#0066ff] text-white" : "bg-slate-100 text-slate-600"}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="flex-1">
                      <span className="block text-sm font-semibold text-slate-800">{role.label}</span>
                      <span className="text-[11px] text-slate-400">{role.desc}</span>
                    </span>
                    <span className={`flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#0066ff] ${checked ? "opacity-100" : "opacity-0"}`}>
                      <Check className="h-3 w-3 text-white" />
                    </span>
                  </button>
                );
              })}

              <div className="mt-8 flex items-center justify-end gap-3">
                <button className="rounded-lg border border-slate-200 px-6 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50" onClick={() => setRoleModalUser(null)}>
                  Hủy
                </button>
                <button
                  disabled={isSavingRoles}
                  className="rounded-lg bg-[#0066ff] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-70"
                  onClick={async () => {
                    try {
                      setIsSavingRoles(true);
                      await updateAdminUser(token, roleModalUser.id, {
                        fullName: roleModalUser.fullName,
                        phoneNumber: roleModalUser.phoneNumber,
                        email: roleModalUser.email,
                        roles: selectedRoles,
                      });
                      setRoleModalUser(null);
                      await loadAll(usersPage, depositsPage, requestsPage, { silent: true });
                    } finally {
                      setIsSavingRoles(false);
                    }
                  }}
                >
                  {isSavingRoles ? "Đang lưu..." : "Lưu quyền"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function AdminUsersTable({ rows, onLock, onOpenRoles }: { rows: AdminUserItemResponse[]; onLock: (u: AdminUserItemResponse) => Promise<void>; onOpenRoles: (u: AdminUserItemResponse) => void }) {
  return (
    <AdminTable headers={["Username", "Tên", "Email", "Roles", "Hành động"]}>
      {rows.map((u) => {
        const isAdmin = u.roles.includes("ADMIN");
        return (
          <tr key={u.id} className="group transition-colors hover:bg-[#f0f3ff]">
            <td className="px-8 py-5 text-sm font-bold text-[#0050cb]">{u.username}</td>
            <td className="px-8 py-5 text-sm font-medium text-[#151c27]">{u.fullName}</td>
            <td className="px-8 py-5 text-sm text-[#424656]">{u.email}</td>
            <td className="px-8 py-5 text-sm text-[#424656]">
              <div className="flex flex-wrap items-center gap-2">
                {u.roles.map((role) => (
                  <span key={role} className="rounded-full bg-[#e8edff] px-2.5 py-1 text-[11px] font-semibold text-[#2d3b66]">
                    {role.toLowerCase()}
                  </span>
                ))}
                {u.isLocked ? <span className="rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-semibold text-rose-700">locked</span> : null}
              </div>
            </td>
            <td className="space-x-2 px-8 py-5 text-right">
              {isAdmin ? null : (
                <>
                  <button className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700" onClick={() => void onLock(u)}>{u.isLocked ? "Mở khóa" : "Khóa"}</button>
                  <button className="rounded-lg border border-[#dce2f3] bg-white px-3 py-1.5 text-xs font-semibold text-[#0050cb]" onClick={() => onOpenRoles(u)}>Nâng quyền</button>
                </>
              )}
            </td>
          </tr>
        );
      })}
    </AdminTable>
  );
}

function AdminDepositsTable({ rows }: { rows: AdminDepositItemResponse[] }) {
  return (
    <AdminTable headers={["Code", "User", "Amount", "Status", "Hành động"]}>
      {rows.map((d) => (
        <tr key={d.id} className="group transition-colors hover:bg-[#f0f3ff]">
          <td className="px-8 py-5 text-sm font-bold text-[#0050cb]">{d.code}</td>
          <td className="px-8 py-5"><div className="flex items-center"><div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#e2e8f8] text-xs font-bold text-[#424656]">{d.userName.charAt(0).toUpperCase() || "U"}</div><span className="text-sm font-medium text-[#151c27]">{d.userName}</span></div></td>
          <td className="px-8 py-5 text-sm font-semibold text-[#151c27]">{new Intl.NumberFormat("vi-VN").format(d.amount)}đ</td>
          <td className="px-8 py-5 text-center"><AdminStatusBadge status={d.status} /></td>
          <td className="px-8 py-5 text-right"><CircleEllipsis className="ml-auto h-5 w-5 text-[#727687]" /></td>
        </tr>
      ))}
    </AdminTable>
  );
}

function AdminDevelopersTable({ rows, token, reload }: { rows: AdminDeveloperRequestItemResponse[]; token: string; reload: (a?: number, b?: number, c?: number) => Promise<void> }) {
  return (
    <AdminTable headers={["User", "Status", "Requested", "Hành động"]}>
      {rows.map((r) => (
        <tr key={r.id} className="group transition-colors hover:bg-[#f0f3ff]">
          <td className="px-8 py-5 text-sm font-semibold text-[#151c27]">{r.userName}</td>
          <td className="px-8 py-5"><AdminStatusBadge status={r.status} /></td>
          <td className="px-8 py-5 text-sm text-[#424656]">{new Date(r.requestedAt).toLocaleString("vi-VN")}</td>
          <td className="space-x-2 px-8 py-5 text-right">
            {r.status === "Approved" ? (
              <button className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700" onClick={async () => { await updateAdminDeveloperRequestStatus(token, r.id, { status: "Revoked" }); await reload(); }}>Thu hồi</button>
            ) : (
              <button className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700" onClick={async () => { await updateAdminDeveloperRequestStatus(token, r.id, { status: "Approved" }); await reload(); }}>Duyệt</button>
            )}
            {r.status === "Pending" ? (
              <button className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600" onClick={async () => { await updateAdminDeveloperRequestStatus(token, r.id, { status: "Rejected" }); await reload(); }}>Từ chối</button>
            ) : null}
          </td>
        </tr>
      ))}
    </AdminTable>
  );
}

function StatCard({ icon: Icon, title, value, tone }: { icon: typeof Users; title: string; value: string; tone: "primary" | "secondary" | "tertiary" | "neutral" | "error" }) {
  const tones = { primary: "bg-[#dae1ff] text-[#001849]", secondary: "bg-[#6ffbbe] text-[#002113]", tertiary: "bg-[#ffdbd0] text-[#390c00]", neutral: "bg-[#e2e8f8] text-[#424656]", error: "bg-[#ffdad6] text-[#93000a]" } as const;
  return <div className="rounded-2xl border border-[#dce2f3] bg-white p-6 shadow-sm transition-shadow hover:shadow-md"><div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${tones[tone]}`}><Icon className="h-5 w-5" /></div><h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-[#424656]">{title}</h3><p className="text-3xl font-bold text-[#151c27]">{value}</p></div>;
}

function AdminTable({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="border-b border-[#e2e8f8] bg-[#f0f3ff] text-xs font-bold uppercase tracking-wider text-[#424656]">{headers.map((header, index) => <th key={header} className={`px-8 py-4 ${index >= headers.length - 2 ? "text-center" : ""} ${index === headers.length - 1 ? "text-right" : ""}`}>{header}</th>)}</tr></thead><tbody className="divide-y divide-[#e2e8f8]">{children}</tbody></table></div>;
}

function AdminStatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const success = normalized.includes("complete") || normalized.includes("approved");
  const pending = normalized.includes("pending");
  const cancelled = normalized.includes("cancel");
  const expired = normalized.includes("expire");
  const failed = normalized.includes("fail") || normalized.includes("reject");
  const revoked = normalized.includes("revok") || normalized.includes("thu hồi");

  let className = "bg-[#dae1ff] text-[#003fa4]";
  let dotClassName = "bg-[#0050cb]";

  if (success) {
    className = "bg-[#6cf8bb] text-[#00714d]";
    dotClassName = "bg-[#006c49]";
  } else if (cancelled) {
    className = "bg-[#fff2cc] text-[#8a6d1d]";
    dotClassName = "bg-[#d4a017]";
  } else if (expired) {
    className = "bg-[#e5e7eb] text-[#4b5563]";
    dotClassName = "bg-[#6b7280]";
  } else if (revoked) {
    className = "bg-[#fff2cc] text-[#8a6d1d]";
    dotClassName = "bg-[#d4a017]";
  } else if (failed) {
    className = "bg-[#ffdad6] text-[#93000a]";
    dotClassName = "bg-[#ba1a1a]";
  } else if (pending) {
    className = "bg-[#e2e8f8] text-[#424656]";
    dotClassName = "bg-[#727687]";
  }

  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${className}`}><span className={`mr-2 h-1.5 w-1.5 rounded-full ${dotClassName}`} />{status}</span>;
}

function AdminPagination({ label, page, totalPages, pageSize, onPageSizeChange, onChange }: { label: string; page: number; totalPages: number; pageSize: PageSize; onPageSizeChange: (size: PageSize) => void; onChange: (page: number) => void }) {
  return (
    <div className="mt-8 flex flex-col items-center justify-between gap-4 sm:flex-row">
      <div className="flex items-center gap-3 text-sm text-[#424656]">
        <span>{label}</span>
        <select value={pageSize} onChange={(e) => onPageSizeChange(Number(e.target.value) as PageSize)} className="rounded-lg border border-[#dce2f3] bg-white px-2 py-1 text-sm font-medium text-[#151c27] outline-none focus:border-[#0050cb]">
          {PAGE_SIZE_OPTIONS.map((size) => <option key={size} value={size}>{size} / page</option>)}
        </select>
      </div>
      <div className="inline-flex items-center rounded-xl border border-[#dce2f3] bg-white p-1 shadow-sm">
        <button disabled={page <= 1} className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[#151c27] transition-colors hover:bg-[#f0f3ff] disabled:cursor-not-allowed disabled:text-[#c2c6d8]" onClick={() => onChange(1)}><ChevronLeft className="h-4 w-4" /></button>
        <button disabled={page <= 1} className="rounded-lg px-4 py-2 text-sm font-semibold text-[#424656] transition-colors hover:bg-[#f0f3ff] disabled:cursor-not-allowed disabled:text-[#c2c6d8]" onClick={() => onChange(page - 1)}>Trước</button>
        <div className="flex items-center px-4 py-2 text-sm"><span className="font-bold text-[#0050cb]">{totalPages === 0 ? 0 : page}</span><span className="mx-1 text-[#c2c6d8]">/</span><span className="font-medium text-[#424656]">{totalPages}</span></div>
        <button disabled={page >= totalPages} className="rounded-lg px-4 py-2 text-sm font-semibold text-[#424656] transition-colors hover:bg-[#f0f3ff] disabled:cursor-not-allowed disabled:text-[#c2c6d8]" onClick={() => onChange(page + 1)}>Sau</button>
        <button disabled={page >= totalPages} className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[#151c27] transition-colors hover:bg-[#f0f3ff] disabled:cursor-not-allowed disabled:text-[#c2c6d8]" onClick={() => onChange(totalPages)}><ChevronRight className="h-4 w-4" /></button>
      </div>
    </div>
  );
}

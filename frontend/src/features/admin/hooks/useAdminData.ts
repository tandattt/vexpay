import { useCallback, useEffect, useState } from "react";
import { HttpError } from "../../../shared/api";
import { readStorage, writeStorage } from "../../../shared/lib/storage";
import {
  getAdminDeposits,
  getAdminDeveloperRequests,
  getAdminSummary,
  getAdminUsers,
} from "../api";
import type {
  AdminDataMenu,
  AdminDepositItemResponse,
  AdminDeveloperRequestItemResponse,
  AdminMenu,
  AdminPageSize,
  AdminSummaryResponse,
  AdminUserItemResponse,
} from "../types";

const PAGE_SIZE_OPTIONS: AdminPageSize[] = [10, 20, 30, 40];
const PAGE_SIZE_STORAGE_KEYS: Record<AdminDataMenu, string> = {
  "admin-users": "vexpay.admin.page_size.users",
  "admin-deposits": "vexpay.admin.page_size.deposits",
  "admin-developers": "vexpay.admin.page_size.developers",
};

function readStoredPageSize(menu: AdminDataMenu): AdminPageSize {
  const value = readStorage<number>("local", PAGE_SIZE_STORAGE_KEYS[menu], 10);
  return PAGE_SIZE_OPTIONS.includes(value as AdminPageSize) ? (value as AdminPageSize) : 10;
}

interface Options {
  token: string | null;
  activeMenu: AdminMenu;
}

interface PagedState {
  page: number;
  totalPages: number;
}

function resolvePaged<T>(value: unknown): { items: T[]; page: number; totalPages: number } {
  if (Array.isArray(value)) return { items: value as T[], page: 1, totalPages: 1 };
  const maybe = value as { items?: T[]; page?: number; totalPages?: number } | null;
  return {
    items: Array.isArray(maybe?.items) ? maybe!.items : [],
    page: typeof maybe?.page === "number" && maybe.page > 0 ? maybe.page : 1,
    totalPages:
      typeof maybe?.totalPages === "number" && maybe.totalPages >= 0 ? maybe.totalPages : 1,
  };
}

export function useAdminData({ token, activeMenu }: Options) {
  const [summary, setSummary] = useState<AdminSummaryResponse | null>(null);
  const [users, setUsers] = useState<AdminUserItemResponse[]>([]);
  const [deposits, setDeposits] = useState<AdminDepositItemResponse[]>([]);
  const [requests, setRequests] = useState<AdminDeveloperRequestItemResponse[]>([]);

  const [usersPaging, setUsersPaging] = useState<PagedState>({ page: 1, totalPages: 0 });
  const [depositsPaging, setDepositsPaging] = useState<PagedState>({ page: 1, totalPages: 0 });
  const [requestsPaging, setRequestsPaging] = useState<PagedState>({ page: 1, totalPages: 0 });

  const [usersPageSize, setUsersPageSize] = useState<AdminPageSize>(() =>
    readStoredPageSize("admin-users"),
  );
  const [depositsPageSize, setDepositsPageSize] = useState<AdminPageSize>(() =>
    readStoredPageSize("admin-deposits"),
  );
  const [requestsPageSize, setRequestsPageSize] = useState<AdminPageSize>(() =>
    readStoredPageSize("admin-developers"),
  );

  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (
      nextUsersPage = usersPaging.page,
      nextDepositsPage = depositsPaging.page,
      nextRequestsPage = requestsPaging.page,
      options?: { silent?: boolean },
    ) => {
      if (!token) return;
      try {
        setError(null);
        if (loading) setLoading(true);
        else setIsRefreshing(!options?.silent);

        const [s, u, d, r] = await Promise.all([
          getAdminSummary(),
          getAdminUsers(nextUsersPage, usersPageSize),
          getAdminDeposits(nextDepositsPage, depositsPageSize),
          getAdminDeveloperRequests(nextRequestsPage, requestsPageSize),
        ]);

        const usersPaged = resolvePaged<AdminUserItemResponse>(u);
        const depositsPaged = resolvePaged<AdminDepositItemResponse>(d);
        const requestsPaged = resolvePaged<AdminDeveloperRequestItemResponse>(r);

        setSummary(s);
        setUsers(usersPaged.items);
        setDeposits(depositsPaged.items);
        setRequests(requestsPaged.items);
        setUsersPaging({ page: usersPaged.page, totalPages: usersPaged.totalPages });
        setDepositsPaging({ page: depositsPaged.page, totalPages: depositsPaged.totalPages });
        setRequestsPaging({ page: requestsPaged.page, totalPages: requestsPaged.totalPages });
      } catch (e) {
        setError(e instanceof HttpError ? e.message : "Không tải được dữ liệu admin.");
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [
      token,
      loading,
      usersPaging.page,
      depositsPaging.page,
      requestsPaging.page,
      usersPageSize,
      depositsPageSize,
      requestsPageSize,
    ],
  );

  useEffect(() => {
    if (!token) return;
    void load();
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!token) return;
    void load(usersPaging.page, depositsPaging.page, requestsPaging.page, { silent: true });
  }, [activeMenu]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!token) return;
    void load(usersPaging.page, depositsPaging.page, requestsPaging.page, { silent: true });
  }, [usersPageSize, depositsPageSize, requestsPageSize]); // eslint-disable-line react-hooks/exhaustive-deps

  const changeUsersPageSize = useCallback((value: AdminPageSize) => {
    setUsersPaging((s) => ({ ...s, page: 1 }));
    setUsersPageSize(value);
    writeStorage("local", PAGE_SIZE_STORAGE_KEYS["admin-users"], value);
  }, []);

  const changeDepositsPageSize = useCallback((value: AdminPageSize) => {
    setDepositsPaging((s) => ({ ...s, page: 1 }));
    setDepositsPageSize(value);
    writeStorage("local", PAGE_SIZE_STORAGE_KEYS["admin-deposits"], value);
  }, []);

  const changeRequestsPageSize = useCallback((value: AdminPageSize) => {
    setRequestsPaging((s) => ({ ...s, page: 1 }));
    setRequestsPageSize(value);
    writeStorage("local", PAGE_SIZE_STORAGE_KEYS["admin-developers"], value);
  }, []);

  return {
    summary,
    users,
    deposits,
    requests,
    usersPaging,
    depositsPaging,
    requestsPaging,
    usersPageSize,
    depositsPageSize,
    requestsPageSize,
    loading,
    isRefreshing,
    error,
    load,
    changeUsersPageSize,
    changeDepositsPageSize,
    changeRequestsPageSize,
    pageSizeOptions: PAGE_SIZE_OPTIONS,
  };
}

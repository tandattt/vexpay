import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BadgePercent,
  Banknote,
  CheckCircle2,
  ShieldCheck,
  Users,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Headphones,
  HelpCircle,
  Info,
  LayoutDashboard,
  LoaderCircle,
  Code2,
  LogOut,
  QrCode,
  Search,
  Wallet,
  XCircle,
} from "lucide-react";
import { cancelDeposit, createDepositQr, getDepositHistory, getDepositHistoryQr, getDepositQrConfig, getDepositStatus } from "../api/deposit";
import { getDeveloperRequestStatus, requestBecomeDeveloper } from "../api/developer";
import { createMyProject, getMyProjects } from "../api/project";
import AdminSection, { type AdminMenu } from "./AdminSection";
import { HttpError } from "../api/client";
import { getMyBalance } from "../api/wallet";
import type {
  DepositHistoryResponse,
  DepositQrConfigResponse,
  DeveloperProjectResponse,
  DeveloperRequestStatusResponse,
  UserInfo,
} from "../types";

interface Props {
  user: UserInfo;
  token: string;
  onSignOut: () => void;
}

const QUICK_AMOUNTS = [10_000, 20_000, 500_000, 1_000_000, 10_000_000];
const HISTORY_PAGE_SIZE = 5;
const ACTIVE_DEPOSIT_CODE_KEY = "vexpay.active_deposit_code";
const ACTIVE_MENU_KEY = "vexpay.active_menu";

type DepositMethod = "qr" | "bank";
type ActiveMenu = "dashboard" | "deposit" | "wallet" | "transactions" | "developer" | "admin-dashboard" | "admin-users" | "admin-deposits" | "admin-developers";

interface HistoryRow {
  id: string;
  date: string;
  amount: string;
  status: "Completed" | "Pending" | "Failed" | "Cancelled" | "Expired";
  method: string;
  code: string;
  remainingSeconds: number | null;
}

function mapDepositStatus(value: DepositHistoryResponse["status"]): HistoryRow["status"] {
  if (value === 1 || value === "Completed") return "Completed";
  if (value === 2 || value === "Failed") return "Failed";
  if (value === 3 || value === "Cancelled") return "Cancelled";
  if (value === 4 || value === "Expired") return "Expired";
  return "Pending";
}

function mapDepositMethod(value: DepositHistoryResponse["method"]): string {
  if (value === 0 || value === "QrCode") return "QR Code";
  return "Bank Transfer";
}

function toHistoryRow(item: DepositHistoryResponse): HistoryRow {
  return {
    id: item.id,
    code: item.code,
    date: new Date(item.createdAt).toLocaleString("vi-VN"),
    amount: `${new Intl.NumberFormat("vi-VN").format(item.amount)}đ`,
    status: mapDepositStatus(item.status),
    method: mapDepositMethod(item.method),
    remainingSeconds: item.remainingSeconds ?? null,
  };
}

function formatCountdown(seconds: number | null) {
  if (seconds === null) return null;
  const safeSeconds = Math.max(seconds, 0);
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

export default function DashboardPage({ user, token, onSignOut }: Props) {
  const [balance, setBalance] = useState<number | null>(null);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [isHistoryPaging, setIsHistoryPaging] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(0);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);
  const [expandedQrImageUrl, setExpandedQrImageUrl] = useState<string | null>(null);
  const hasAdminRole = user.roles.includes("ADMIN");
  const [activeMenu, setActiveMenu] = useState<ActiveMenu>(() => {
    const fallback: ActiveMenu = "deposit";
    if (typeof window === "undefined") return fallback;
    const saved = window.localStorage.getItem(ACTIVE_MENU_KEY) as ActiveMenu | null;
    const validMenus: ActiveMenu[] = hasAdminRole
      ? ["dashboard", "deposit", "wallet", "transactions", "developer", "admin-dashboard", "admin-users", "admin-deposits", "admin-developers"]
      : ["dashboard", "deposit", "wallet", "transactions", "developer"];
    return saved && validMenus.includes(saved) ? saved : fallback;
  });
  const isAdminView = activeMenu.startsWith("admin-");
  const [selectedMethod, setSelectedMethod] = useState<DepositMethod>("qr");
  const [amount, setAmount] = useState<number>(1_000_000);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [depositCode, setDepositCode] = useState<string | null>(() => sessionStorage.getItem(ACTIVE_DEPOSIT_CODE_KEY));
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [depositStatus, setDepositStatus] = useState<"Pending" | "Completed" | "Failed" | "Cancelled" | "Expired" | null>(null);
  const [depositRemainingSeconds, setDepositRemainingSeconds] = useState<number | null>(null);
  const [depositError, setDepositError] = useState<string | null>(null);
  const [depositQrConfig, setDepositQrConfig] = useState<DepositQrConfigResponse | null>(null);
  const [developerStatus, setDeveloperStatus] = useState<DeveloperRequestStatusResponse | null>(null);
  const [developerStatusError, setDeveloperStatusError] = useState<string | null>(null);
  const [projects, setProjects] = useState<DeveloperProjectResponse[]>([]);
  const [newProjectName, setNewProjectName] = useState("");
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [isLoadingDeveloperStatus, setIsLoadingDeveloperStatus] = useState(false);
  const [isRequestingDeveloper, setIsRequestingDeveloper] = useState(false);
  const [isCreatingDeposit, setIsCreatingDeposit] = useState(false);
  const [isCancellingDeposit, setIsCancellingDeposit] = useState(false);
  const [historyTick, setHistoryTick] = useState(0);
  const expiredHandledRef = useRef(new Set<string>());
  const activeQrExpiredHandledRef = useRef<string | null>(null);

  const initials =
    user.fullName
      .split(" ")
      .map((part) => part.charAt(0))
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U";

  const formattedBalance = useMemo(() => {
    if (balance === null) return "Đang tải...";
    return `${new Intl.NumberFormat("vi-VN").format(balance)}đ`;
  }, [balance]);

  useEffect(() => {
    window.localStorage.setItem(ACTIVE_MENU_KEY, activeMenu);
  }, [activeMenu]);

  const loadBalance = async (ignore?: () => boolean) => {
    try {
      setBalanceError(null);
      const response = await getMyBalance(token);
      if (!ignore?.()) setBalance(response.balance);
    } catch (error) {
      if (ignore?.()) return;
      const message = error instanceof HttpError ? error.message : "Không tải được số dư ví.";
      setBalanceError(message);
    }
  };

  const loadHistory = async (page = historyPage, showLoading = true, excludeCode?: string | null) => {
    try {
      setHistoryError(null);
      if (showLoading) {
        if (history.length === 0) setIsHistoryLoading(true);
        else setIsHistoryPaging(true);
      }
      const data = await getDepositHistory(token, page, HISTORY_PAGE_SIZE);
      const rows = data.items.map(toHistoryRow);
      const existingCodes = new Set(rows.map((row) => row.code));
      expiredHandledRef.current.forEach((code) => {
        if (!existingCodes.has(code)) {
          expiredHandledRef.current.delete(code);
        }
      });
      const activeCode = excludeCode ?? depositCode;
      const filteredRows = activeCode ? rows.filter((x) => x.code !== activeCode) : rows;
      setHistory(filteredRows);
      if (activeCode) {
        const active = rows.find((x) => x.code === activeCode && x.status === "Pending");
        setDepositRemainingSeconds(active?.remainingSeconds ?? null);
      }
      setHistoryPage(data.page);
      setHistoryTotalPages(data.totalPages);
      if (expandedHistoryId && !filteredRows.some((x) => x.id === expandedHistoryId && x.status === "Pending")) {
        setExpandedHistoryId(null);
        if (expandedQrImageUrl) URL.revokeObjectURL(expandedQrImageUrl);
        setExpandedQrImageUrl(null);
      }
    } catch (error) {
      const message = error instanceof HttpError ? error.message : "Không tải được lịch sử nạp.";
      setHistoryError(message);
    } finally {
      if (showLoading) {
        setIsHistoryLoading(false);
        setIsHistoryPaging(false);
      }
    }
  };

  useEffect(() => {
    if (depositCode) {
      sessionStorage.setItem(ACTIVE_DEPOSIT_CODE_KEY, depositCode);
    } else {
      sessionStorage.removeItem(ACTIVE_DEPOSIT_CODE_KEY);
    }
  }, [depositCode]);

  useEffect(() => {
    if (!depositCode || qrImageUrl) return;

    let cancelled = false;
    (async () => {
      try {
        const response = await getDepositStatus(depositCode, token);
        const status = mapDepositStatus(response.status);
        if (cancelled) return;
        if (status !== "Pending") {
          setDepositCode(null);
          setDepositStatus(null);
          setDepositRemainingSeconds(null);
          return;
        }
        const image = await getDepositHistoryQr(depositCode, token);
        if (cancelled) {
          URL.revokeObjectURL(image);
          return;
        }
        setQrImageUrl(image);
        setDepositStatus("Pending");
      } catch {
        if (cancelled) return;
        setDepositCode(null);
        setDepositStatus(null);
        setDepositRemainingSeconds(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [depositCode, qrImageUrl, token]);

  useEffect(() => {
    let ignore = false;
    void loadBalance(() => ignore);

    if (activeMenu === "deposit") {
      void loadHistory(1);
      void getDepositQrConfig(token)
        .then((config) => {
          if (!ignore) setDepositQrConfig(config);
        })
        .catch(() => {
          if (!ignore) setDepositQrConfig(null);
        });
    }

    return () => {
      ignore = true;
    };
  }, [token, activeMenu]);

  useEffect(() => {
    if (activeMenu !== "developer") return;
    let cancelled = false;
    setDeveloperStatusError(null);
    setIsLoadingDeveloperStatus(true);
    void getDeveloperRequestStatus(token)
      .then((data) => {
        if (cancelled) return;
        setDeveloperStatus(data);
      })
      .catch((error) => {
        if (cancelled) return;
        const message = error instanceof HttpError ? error.message : "Không tải được trạng thái yêu cầu developer.";
        setDeveloperStatusError(message);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingDeveloperStatus(false);
      });

    if (user.roles.includes("DEVELOPER")) {
      void loadProjects();
    }

    return () => {
      cancelled = true;
    };
  }, [activeMenu, token]);

  useEffect(() => {
    const countdown = setInterval(() => {
      setHistory((current) => current.map((row) => (
        row.status === "Pending" && row.remainingSeconds !== null
          ? { ...row, remainingSeconds: Math.max(row.remainingSeconds - 1, 0) }
          : row
      )));
      setDepositRemainingSeconds((current) => (current === null ? null : Math.max(current - 1, 0)));
      setHistoryTick((value) => value + 1);
    }, 1000);

    return () => clearInterval(countdown);
  }, []);

  useEffect(() => {
    const newlyExpiredHistory = history.filter(
      (row) => row.status === "Pending" && row.remainingSeconds === 0 && !expiredHandledRef.current.has(row.code),
    );
    const activeQrExpired =
      depositStatus === "Pending" &&
      depositRemainingSeconds === 0 &&
      depositCode !== null &&
      activeQrExpiredHandledRef.current !== depositCode;

    if (newlyExpiredHistory.length === 0 && !activeQrExpired) return;

    newlyExpiredHistory.forEach((row) => expiredHandledRef.current.add(row.code));
    if (activeQrExpired && depositCode) {
      activeQrExpiredHandledRef.current = depositCode;
    }

    void loadHistory(historyPage, false);
    if (activeQrExpired && depositCode) {
      void getDepositStatus(depositCode, token)
        .then((response) => setDepositStatus(mapDepositStatus(response.status)))
        .catch(() => undefined);
    }
  }, [historyTick]);

  useEffect(() => {
    if (activeMenu !== "deposit") return;

    const refresh = setInterval(() => {
      void loadHistory(historyPage, false);
      void loadBalance();
    }, 10000);

    return () => clearInterval(refresh);
  }, [activeMenu, historyPage, token, depositCode]);

  useEffect(() => {
    if (!depositCode || depositStatus === "Completed" || depositStatus === "Failed" || depositStatus === "Cancelled" || depositStatus === "Expired") return;

    const timer = setInterval(async () => {
      try {
        const response = await getDepositStatus(depositCode, token);
        setDepositStatus(mapDepositStatus(response.status));
      } catch {
        // keep polling silently
      }
    }, 5000);

    return () => clearInterval(timer);
  }, [depositCode, depositStatus, token]);

  useEffect(() => {
    return () => {
      if (qrImageUrl) {
        URL.revokeObjectURL(qrImageUrl);
      }
      if (expandedQrImageUrl) {
        URL.revokeObjectURL(expandedQrImageUrl);
      }
    };
  }, [qrImageUrl, expandedQrImageUrl]);

  const resolvedAmount = customAmount.trim().length > 0 ? Number(customAmount) : amount;

  useEffect(() => {
    if (depositStatus !== "Completed") return;

    (async () => {
      try {
        await loadBalance();
        await loadHistory(historyPage);
      } catch {
        // ignore balance refresh failure
      }
    })();
  }, [depositStatus, token]);

  useEffect(() => {
    if (!qrImageUrl || !depositCode) return;
    if (depositStatus !== "Completed" && depositStatus !== "Failed" && depositStatus !== "Cancelled" && depositStatus !== "Expired") return;

    const timer = setTimeout(() => {
      if (qrImageUrl) URL.revokeObjectURL(qrImageUrl);
      setQrImageUrl(null);
      setDepositCode(null);
      setDepositStatus(null);
      setDepositRemainingSeconds(null);
      activeQrExpiredHandledRef.current = null;
    }, 2000);

    return () => clearTimeout(timer);
  }, [depositStatus, qrImageUrl, depositCode]);

  const handleToggleHistoryQr = async (row: HistoryRow) => {
    if (row.status !== "Pending") return;

    if (expandedHistoryId === row.id) {
      setExpandedHistoryId(null);
      if (expandedQrImageUrl) URL.revokeObjectURL(expandedQrImageUrl);
      setExpandedQrImageUrl(null);
      return;
    }

    try {
      if (expandedQrImageUrl) URL.revokeObjectURL(expandedQrImageUrl);
      setExpandedQrImageUrl(null);
      setExpandedHistoryId(row.id);
      const imageUrl = await getDepositHistoryQr(row.code, token);
      setExpandedQrImageUrl(imageUrl);
    } catch (error) {
      const message = error instanceof HttpError ? error.message : "Không tải được mã QR.";
      setHistoryError(message);
      setExpandedHistoryId(null);
    }
  };

  const handleCancelDeposit = async () => {
    if (!depositCode) return;
    try {
      setIsCancellingDeposit(true);
      await cancelDeposit(depositCode, token);
      setDepositStatus("Cancelled");
      await loadHistory(historyPage, false);
    } catch (error) {
      const message = error instanceof HttpError ? error.message : "Không hủy được giao dịch.";
      setDepositError(message);
    } finally {
      setIsCancellingDeposit(false);
    }
  };

  const handleCreateDeposit = async () => {
    if (selectedMethod !== "qr") {
      setDepositError("Hiện tại chỉ hỗ trợ nạp qua QR Code.");
      return;
    }

    try {
      setIsCreatingDeposit(true);
      setDepositError(null);
      setDepositStatus("Pending");
      setDepositRemainingSeconds(null);
      const result = await createDepositQr(resolvedAmount, token);
      if (qrImageUrl) URL.revokeObjectURL(qrImageUrl);
      setQrImageUrl(result.imageUrl);
      setDepositCode(result.code);
      setDepositRemainingSeconds(15 * 60);
      await loadHistory(historyPage, true, result.code);
    } catch (error) {
      const message = error instanceof HttpError ? error.message : "Không tạo được mã QR nạp tiền.";
      setDepositError(message);
      setDepositStatus(null);
    } finally {
      setIsCreatingDeposit(false);
    }
  };

  const loadProjects = async () => {
    try {
      setProjectsError(null);
      setIsLoadingProjects(true);
      const data = await getMyProjects(token);
      setProjects(data);
    } catch (error) {
      const message = error instanceof HttpError ? error.message : "Không tải được danh sách project.";
      setProjectsError(message);
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const handleCreateProject = async () => {
    const name = newProjectName.trim();
    if (!name) {
      setProjectsError("Vui lòng nhập tên project.");
      return;
    }

    try {
      setIsCreatingProject(true);
      setProjectsError(null);
      const created = await createMyProject(token, { name });
      setProjects((current) => [created, ...current]);
      setNewProjectName("");
      setIsCreateProjectModalOpen(false);
    } catch (error) {
      const message = error instanceof HttpError ? error.message : "Không tạo được project.";
      setProjectsError(message);
    } finally {
      setIsCreatingProject(false);
    }
  };

  const handleRequestBecomeDeveloper = async () => {
    try {
      setIsRequestingDeveloper(true);
      setDeveloperStatusError(null);
      const result = await requestBecomeDeveloper(token);
      setDeveloperStatus(result);
    } catch (error) {
      const message = error instanceof HttpError ? error.message : "Không thể gửi yêu cầu trở thành nhà phát triển.";
      setDeveloperStatusError(message);
    } finally {
      setIsRequestingDeveloper(false);
    }
  };

  const pageTitle = isAdminView
    ? {
        "admin-dashboard": "Dashboard",
        "admin-users": "Quản lý người dùng",
        "admin-deposits": "Quản lý nạp tiền",
        "admin-developers": "Duyệt developer",
      }[activeMenu as "admin-dashboard" | "admin-users" | "admin-deposits" | "admin-developers"]
    : {
        dashboard: "Dashboard",
        deposit: "Nạp tiền",
        wallet: "Ví",
        transactions: "Lịch sử giao dịch",
        developer: user.roles.includes("DEVELOPER") ? "Khu vực nhà phát triển" : "Trở thành nhà phát triển",
      }[activeMenu as "dashboard" | "deposit" | "wallet" | "transactions" | "developer"];

  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-20 border-b border-hairline bg-card/80 backdrop-blur">
        <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
          <img src="/logo.png" alt="VexPay" className="h-12 w-12 object-contain" />
          <div className="leading-tight">
            <p className="text-sm font-bold text-ink">VexPay</p>
            <p className="text-[11px] text-muted">Three Hutech</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="relative hidden lg:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                type="search"
                placeholder="Tìm kiếm giao dịch..."
                className="h-9 w-64 rounded-full border border-hairline bg-canvas/60 pl-10 pr-4 text-sm text-ink placeholder:text-muted focus:border-primary focus:bg-card focus:outline-none focus:ring-4 focus:ring-primary/10"
              />
            </div>
            <div className="hidden items-center gap-2 rounded-full border border-hairline bg-canvas/60 px-3 py-1.5 text-xs sm:flex">
              <Wallet className="h-4 w-4 text-muted" />
              <span className="text-muted">Số dư:</span>
              {balanceError ? (
                <span className="max-w-40 truncate font-semibold text-rose-600" title={balanceError}>
                  Lỗi
                </span>
              ) : (
                <span className="font-semibold text-emerald-600">{formattedBalance}</span>
              )}
            </div>
            {hasAdminRole ? (
              <button
                type="button"
                onClick={() => setActiveMenu((prev) => (prev.startsWith("admin-") ? "deposit" : "admin-dashboard"))}
                className="hidden items-center gap-2 rounded-xl border border-hairline bg-card px-2 py-1.5 text-left transition-colors hover:border-primary sm:flex"
                title={isAdminView ? "Chuyển sang giao diện người dùng" : "Chuyển sang giao diện admin"}
              >
                <div className="leading-tight">
                  <p className="text-xs font-semibold text-ink">{user.fullName}</p>
                  <p className="text-[11px] text-muted">{isAdminView ? "ADMIN" : "CUSTOMER"}</p>
                </div>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-xs font-semibold text-white">
                  {initials}
                </span>
              </button>
            ) : (
              <>
                <div className="hidden text-right leading-tight sm:block">
                  <p className="text-xs font-semibold text-ink">{user.fullName}</p>
                  <p className="text-[11px] text-muted">{user.roles.join(" · ") || "—"}</p>
                </div>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-xs font-semibold text-white">
                  {initials}
                </span>
              </>
            )}
            <button
              type="button"
              onClick={onSignOut}
              className="inline-flex items-center gap-1.5 rounded-xl border border-hairline bg-card px-3 py-2 text-xs font-semibold text-muted transition-colors hover:text-ink"
            >
              <LogOut className="h-3.5 w-3.5" />
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-61px)]">
        <aside className="sticky top-[61px] hidden h-[calc(100vh-61px)] w-64 shrink-0 border-r border-hairline bg-card lg:flex lg:flex-col">
          <div className="px-4 py-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Menu</p>
            <nav className="mt-3 flex flex-col gap-1">
              {isAdminView ? (
                <>
                  <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeMenu === "admin-dashboard"} onClick={() => setActiveMenu("admin-dashboard")} />
                  <SidebarItem icon={Users} label="Người dùng" active={activeMenu === "admin-users"} onClick={() => setActiveMenu("admin-users")} />
                  <SidebarItem icon={Banknote} label="Nạp tiền" active={activeMenu === "admin-deposits"} onClick={() => setActiveMenu("admin-deposits")} />
                  <SidebarItem icon={ShieldCheck} label="Developer" active={activeMenu === "admin-developers"} onClick={() => setActiveMenu("admin-developers")} />
                </>
              ) : (
                <>
                  <SidebarItem
                    icon={LayoutDashboard}
                    label="Dashboard"
                    active={activeMenu === "dashboard"}
                    onClick={() => setActiveMenu("dashboard")}
                  />
                  <SidebarItem
                    icon={CircleDollarSign}
                    label="Nạp tiền"
                    active={activeMenu === "deposit"}
                    onClick={() => setActiveMenu("deposit")}
                  />
                  <SidebarItem
                    icon={Wallet}
                    label="Ví"
                    active={activeMenu === "wallet"}
                    onClick={() => setActiveMenu("wallet")}
                  />
                  <SidebarItem
                    icon={Banknote}
                    label="Lịch sử giao dịch"
                    active={activeMenu === "transactions"}
                    onClick={() => setActiveMenu("transactions")}
                  />
                  <SidebarItem
                    icon={Code2}
                    label="Trở thành nhà phát triển"
                    active={activeMenu === "developer"}
                    onClick={() => setActiveMenu("developer")}
                  />
                </>
              )}
            </nav>
          </div>

          <div className="px-4 pb-5 pt-2">
            <button className="w-full rounded-xl bg-gradient-to-r from-primary to-secondary px-3 py-2.5 text-sm font-semibold text-white shadow-soft transition-transform hover:-translate-y-0.5">
              Hỗ trợ
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1180px]">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Wallet</p>
              <h1 className="mt-1 text-2xl font-bold text-ink sm:text-[28px]">{pageTitle}</h1>
              <p className="mt-1 text-sm text-muted">
                {isAdminView
                  ? "Khu vực quản trị hệ thống. Chỉ tài khoản ADMIN mới truy cập được."
                  : activeMenu === "deposit"
                    ? "Chọn phương thức và số tiền để tạo giao dịch nạp."
                    : activeMenu === "developer"
                      ? user.roles.includes("DEVELOPER")
                        ? "Quản lý thông tin và cấu hình nhà phát triển."
                        : "Gửi yêu cầu để được cấp quyền nhà phát triển."
                      : "Trang mô phỏng giao diện. Chức năng sẽ được triển khai sau."}
              </p>
            </div>
          </div>

            {isAdminView ? <AdminSection token={token} activeMenu={activeMenu as AdminMenu} /> : null}

            {!isAdminView && activeMenu !== "deposit" && activeMenu !== "developer" ? (
              <section className="rounded-2xl border border-dashed border-hairline bg-card p-8 text-center shadow-card">
                <Code2 className="mx-auto h-10 w-10 text-primary" />
                <h3 className="mt-3 text-lg font-semibold text-ink">{pageTitle}</h3>
                <p className="mt-2 text-sm text-muted">Đây là trang mock UI. Chưa có nghiệp vụ backend.</p>
              </section>
            ) : null}

            {!isAdminView && activeMenu === "developer" ? (
              <section className="rounded-2xl border border-hairline bg-card p-6 shadow-card">
                <h3 className="text-lg font-semibold text-ink">Work Space</h3>
                {isLoadingDeveloperStatus ? (
                  <p className="mt-3 text-sm text-muted">Đang tải trạng thái yêu cầu...</p>
                ) : developerStatusError ? (
                  <p className="mt-3 text-sm font-medium text-rose-600">{developerStatusError}</p>
                ) : developerStatus?.isDeveloper || user.roles.includes("DEVELOPER") ? (
                  <div className="mt-4 space-y-4">
                    <section className="rounded-2xl border border-hairline bg-[#f8f9fc] p-4 sm:p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h4 className="text-base font-semibold text-ink">Projects</h4>
                          <p className="mt-0.5 text-xs text-muted">Managing your available API integrations</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setProjectsError(null);
                              setIsCreateProjectModalOpen(true);
                            }}
                            className="inline-flex h-9 items-center rounded-lg bg-[#0050cb] px-3 text-xs font-semibold text-white hover:bg-[#003fa4]"
                          >
                            + Create New Project
                          </button>
                        </div>
                      </div>

                      {projectsError ? <p className="mt-3 text-sm font-medium text-rose-600">{projectsError}</p> : null}

                      {isCreateProjectModalOpen ? (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
                            <h5 className="text-base font-semibold text-ink">Create new project</h5>
                            <p className="mt-1 text-sm text-muted">Nhập tên project để tạo mới.</p>
                            <input
                              type="text"
                              value={newProjectName}
                              onChange={(e) => setNewProjectName(e.target.value)}
                              placeholder="Project name"
                              className="mt-4 h-10 w-full rounded-lg border border-hairline bg-white px-3 text-sm text-ink outline-none focus:border-primary"
                            />
                            <div className="mt-4 flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  if (isCreatingProject) return;
                                  setIsCreateProjectModalOpen(false);
                                }}
                                className="inline-flex h-9 items-center rounded-lg border border-hairline px-3 text-xs font-semibold text-ink hover:bg-slate-50"
                              >
                                Huỷ
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleCreateProject()}
                                disabled={isCreatingProject}
                                className="inline-flex h-9 items-center rounded-lg bg-[#0050cb] px-3 text-xs font-semibold text-white hover:bg-[#003fa4] disabled:opacity-70"
                              >
                                {isCreatingProject ? "Đang tạo..." : "Tạo project"}
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : null}

                      <div className="mt-4 rounded-xl border border-hairline bg-white p-4">
                        <h5 className="text-sm font-semibold text-ink">Projects</h5>
                        <p className="mt-1 text-xs text-muted">Chọn dự án để xem cấu hình.</p>

                        {isLoadingProjects ? (
                          <p className="mt-4 text-sm text-muted">Đang tải project...</p>
                        ) : projects.length === 0 ? (
                          <p className="mt-4 text-sm text-muted">Chưa có project nào.</p>
                        ) : (
                          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {projects.map((project) => (
                              <article key={project.id} className="rounded-xl border border-hairline bg-card px-4 py-3">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="line-clamp-1 text-sm font-semibold text-ink">{project.name}</p>
                                  <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">ACTIVE</span>
                                </div>
                                <p className="mt-1 text-xs text-muted">{project.id}</p>
                                <div className="mt-4 flex items-center justify-between">
                                  <p className="text-[11px] text-muted">{new Date(project.createdAt).toLocaleDateString("vi-VN")}</p>
                                  <ChevronRight className="h-4 w-4 text-muted" />
                                </div>
                              </article>
                            ))}
                          </div>
                        )}
                      </div>
                    </section>
                  </div>
                ) : developerStatus?.requestStatus === "Pending" ? (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
                    Yêu cầu của bạn đang chờ duyệt.
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {developerStatus?.requestStatus === "Rejected" ? (
                      <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                        Yêu cầu trước đã bị từ chối. Bạn có thể gửi lại yêu cầu.
                      </div>
                    ) : developerStatus?.requestStatus === "Revoked" ? (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
                        Quyền developer của bạn đã bị thu hồi. Bạn có thể gửi lại yêu cầu.
                      </div>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => void handleRequestBecomeDeveloper()}
                      disabled={isRequestingDeveloper}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary px-4 py-2.5 text-sm font-semibold text-white shadow-soft disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isRequestingDeveloper ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Code2 className="h-4 w-4" />}
                      {isRequestingDeveloper ? "Đang gửi yêu cầu..." : (developerStatus?.requestStatus === "Rejected" || developerStatus?.requestStatus === "Revoked") ? "Yêu cầu lại" : "Yêu cầu trở thành nhà phát triển"}
                    </button>
                  </div>
                )}
              </section>
            ) : null}

            {!isAdminView && activeMenu === "deposit" ? (
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 space-y-6 lg:col-span-8">
              {/* Section 1: Phương thức thanh toán */}
              <section className="rounded-3xl border border-[#dce2f3] bg-white p-6 shadow-sm">
                <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-ink">
                  <Banknote className="h-5 w-5 text-primary" />
                  Chọn phương thức thanh toán
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <MethodCard
                    icon={QrCode}
                    title="Thanh toán QR Code"
                    subtitle="Xử lý ngay lập tức"
                    active={selectedMethod === "qr"}
                    onClick={() => setSelectedMethod("qr")}
                  />
                  <MethodCard
                    icon={Banknote}
                    title="Chuyển khoản ngân hàng"
                    subtitle="Xử lý trong 5-15 phút"
                    active={selectedMethod === "bank"}
                    onClick={() => setSelectedMethod("bank")}
                  />
                </div>
              </section>

              {/* Section 2: Số tiền nạp */}
              <section className="rounded-3xl border border-[#dce2f3] bg-white p-6 shadow-sm sm:p-7">
                <h3 className="text-base font-semibold text-ink">Số tiền nạp</h3>
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                  {QUICK_AMOUNTS.map((value) => {
                    const isActive = customAmount.trim().length === 0 && amount === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => {
                          setAmount(value);
                          setCustomAmount("");
                        }}
                        className={
                          "rounded-xl border py-3 text-sm font-semibold transition-all " +
                          (isActive
                            ? "border-[#0050cb] bg-[#dae1ff] text-[#003fa4]"
                            : "border-[#c2c6d8] text-ink hover:-translate-y-0.5 hover:border-[#0050cb]/40 hover:bg-[#f0f3ff]")
                        }
                      >
                        {new Intl.NumberFormat("vi-VN").format(value)}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-6 space-y-2">
                  <label className="block text-xs font-semibold text-muted" htmlFor="custom-amount">
                    Hoặc nhập số tiền khác
                  </label>
                  <div className="relative">
                    <input
                      id="custom-amount"
                      type="text"
                      inputMode="numeric"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value.replace(/[^\d]/g, ""))}
                      placeholder="VND"
                      className="h-14 w-full rounded-xl border-2 border-[#0050cb] bg-[#f9f9ff] px-4 pr-12 text-right text-lg font-semibold text-ink outline-none placeholder:text-muted focus:bg-white focus:ring-4 focus:ring-[#0050cb]/10"
                    />
                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-lg font-bold text-muted">
                      ₫
                    </span>
                  </div>
                  <p className="flex items-center gap-1 text-xs text-primary">
                    <Info className="h-3.5 w-3.5" />
                    Tối thiểu 10.000đ
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCreateDeposit}
                  disabled={isCreatingDeposit}
                  className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#0050cb] text-base font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-[#003fa4] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isCreatingDeposit ? "Đang tạo mã QR..." : "Tiếp tục nạp tiền"}
                  {isCreatingDeposit ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
                </button>

                {depositError ? (
                  <p className="mt-3 text-sm font-medium text-rose-600">{depositError}</p>
                ) : null}

                {qrImageUrl && depositCode ? (
                  <div className="mt-6 rounded-2xl border border-[#dce2f3] bg-[#f9f9ff] p-4">
                    <p className="text-sm font-semibold text-ink">Mã nạp: {depositCode}</p>
                    <p className="mt-1 text-xs text-muted">Giữ nguyên nội dung chuyển khoản khi thanh toán.</p>
                    {depositStatus === "Pending" ? (
                      <p className="mt-1 text-xs font-semibold text-primary">Thời gian còn lại: {formatCountdown(depositRemainingSeconds)}</p>
                    ) : null}
                    <div className="mt-4 flex justify-center">
                      <div className="qr-scan-frame h-64 w-64">
                        <span className="qr-scan-corner tl" />
                        <span className="qr-scan-corner tr" />
                        <span className="qr-scan-corner bl" />
                        <span className="qr-scan-corner br" />
                        <img src={qrImageUrl} alt="Mã QR nạp tiền" className="h-full w-full rounded-xl bg-white p-2" />
                      </div>
                    </div>

                    {depositQrConfig ? (
                      <div className="mt-4 p-1 text-center">
                        <div className="flex items-center justify-center gap-2 text-sm font-medium text-muted">
                          {depositQrConfig.bankIconUrl ? (
                            <img
                              src={depositQrConfig.bankIconUrl}
                              alt={depositQrConfig.bankShortName || depositQrConfig.bankName}
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : null}
                          <span>{depositQrConfig.bankName}</span>
                        </div>
                        <p className="mt-2 text-xs font-semibold text-primary">{depositQrConfig.accountNumber}</p>
                        <p className="mt-1 text-[11px] text-muted">{depositQrConfig.accountName?.toUpperCase() || ""}</p>
                      </div>
                    ) : null}
                    {depositStatus ? (
                      depositStatus === "Pending" ? (
                        <div className="mt-4 flex items-stretch gap-3">
                          <button
                            type="button"
                            onClick={() => void handleCancelDeposit()}
                            disabled={isCancellingDeposit}
                            className="flex basis-1/3 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            <XCircle className="h-4 w-4" />
                            {isCancellingDeposit ? "Đang hủy..." : "Hủy giao dịch"}
                          </button>
                          <div className="flex basis-2/3 items-center justify-center gap-2 rounded-xl bg-primary/10 px-3 py-2 text-sm font-semibold text-primary">
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                            Đang chờ thanh toán
                          </div>
                        </div>
                      ) : (
                        <DepositStateBadge status={depositStatus} />
                      )
                    ) : null}
                  </div>
                ) : null}
              </section>

              {/* Section 3: Lịch sử nạp gần đây */}
              <section className="overflow-hidden rounded-3xl border border-[#dce2f3] bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-[#e2e8f8] bg-[#ffffff] px-6 py-5">
                  <h3 className="text-base font-semibold text-ink">Lịch sử nạp gần đây</h3>
                  <button
                    type="button"
                    onClick={() => void loadHistory(historyPage, true)}
                    className="rounded-lg bg-[#0050cb] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#003fa4]"
                  >
                    Làm mới
                  </button>
                </div>
                <div className="overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-[#f0f3ff] text-[11px] uppercase tracking-[0.1em] text-[#424656]">
                        <th className="px-4 py-3 font-semibold">Ngày</th>
                        <th className="px-4 py-3 font-semibold">Số tiền</th>
                        <th className="px-4 py-3 font-semibold">Trạng thái</th>
                        <th className="px-4 py-3 font-semibold">Phương thức</th>
                        <th className="px-4 py-3 text-right font-semibold"> </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e2e8f8]">
                      {isHistoryLoading ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-6 text-center text-muted">
                            Đang tải lịch sử nạp...
                          </td>
                        </tr>
                      ) : historyError ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-6 text-center text-rose-600">
                            {historyError}
                          </td>
                        </tr>
                      ) : history.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-6 text-center text-muted">
                            Chưa có giao dịch nạp nào.
                          </td>
                        </tr>
                      ) : (
                        history.map((row) => {
                          const isExpanded = expandedHistoryId === row.id;
                          return (
                            <Fragment key={row.id}>
                              <tr
                                onClick={row.status === "Pending" ? () => void handleToggleHistoryQr(row) : undefined}
                                className={
                                  "transition-colors " +
                                  (row.status === "Pending" ? "cursor-pointer hover:bg-[#f0f3ff]" : "hover:bg-[#f9f9ff]")
                                }
                              >
                                <td className="px-4 py-3 text-muted">{row.date}</td>
                                <td className="px-4 py-3 font-semibold text-ink">{row.amount}</td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <StatusBadge status={row.status} />
                                    {row.status === "Pending" ? (
                                      <span className="text-xs font-semibold text-primary">{formatCountdown(row.remainingSeconds)}</span>
                                    ) : null}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-muted">{row.method}</td>
                                <td className="px-4 py-3 text-right">
                                  {row.status === "Pending" ? (
                                    <span className="inline-flex items-center text-primary">
                                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                    </span>
                                  ) : null}
                                </td>
                              </tr>
                              {isExpanded ? (
                                <tr className="bg-[#f9f9ff]">
                                  <td colSpan={5} className="px-4 py-4">
                                    <div className="flex flex-col items-center gap-2">
                                      <p className="text-xs font-medium text-muted">Mã nạp: {row.code}</p>
                                      {expandedQrImageUrl ? (
                                        <div className="qr-scan-frame h-48 w-48">
                                          <span className="qr-scan-corner tl" />
                                          <span className="qr-scan-corner tr" />
                                          <span className="qr-scan-corner bl" />
                                          <span className="qr-scan-corner br" />
                                          <img src={expandedQrImageUrl} alt={`QR ${row.code}`} className="h-full w-full rounded-xl bg-white p-2" />
                                        </div>
                                      ) : (
                                        <div className="flex h-48 w-48 items-center justify-center rounded-xl border border-[#dce2f3] bg-white text-xs text-muted">
                                          Đang tải QR...
                                        </div>
                                      )}

                                      {depositQrConfig ? (
                                        <div className="mt-1 text-center">
                                          <div className="flex items-center justify-center gap-1.5 text-xs text-muted">
                                            {depositQrConfig.bankIconUrl ? (
                                              <img
                                                src={depositQrConfig.bankIconUrl}
                                                alt={depositQrConfig.bankShortName || depositQrConfig.bankName}
                                                className="h-5 w-5 rounded-full object-cover"
                                              />
                                            ) : null}
                                            <span>{depositQrConfig.bankName}</span>
                                          </div>
                                          <p className="mt-1 text-[11px] font-semibold text-primary">{depositQrConfig.accountNumber}</p>
                                          <p className="text-[10px] text-muted">{depositQrConfig.accountName?.toUpperCase() || ""}</p>
                                        </div>
                                      ) : null}
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
                  <div className="flex items-center justify-between border-t border-[#e2e8f8] px-4 py-3 text-xs text-muted">
                    <span className="inline-flex items-center gap-2">
                      Trang {historyTotalPages === 0 ? 0 : historyPage}/{historyTotalPages}
                      {isHistoryPaging ? <LoaderCircle className="h-3.5 w-3.5 animate-spin text-primary" /> : null}
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => void loadHistory(historyPage - 1)}
                        disabled={isHistoryLoading || isHistoryPaging || historyPage <= 1}
                        className="rounded-lg border border-[#c2c6d8] px-3 py-1.5 font-semibold text-ink transition-colors hover:border-[#0050cb] hover:text-[#0050cb] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Trước
                      </button>
                      <button
                        type="button"
                        onClick={() => void loadHistory(historyPage + 1)}
                        disabled={isHistoryLoading || isHistoryPaging || historyPage >= historyTotalPages}
                        className="rounded-lg border border-[#c2c6d8] px-3 py-1.5 font-semibold text-ink transition-colors hover:border-[#0050cb] hover:text-[#0050cb] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Sau
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Right column */}
            <div className="col-span-12 space-y-6 lg:col-span-4">
              <section className="rounded-3xl border border-[#dce2f3] bg-[#f9f9ff] p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-primary" />
                  <h3 className="text-base font-semibold text-primary">Hướng dẫn nạp tiền</h3>
                </div>
                <ol className="space-y-5">
                  <Step
                    index={1}
                    title="Chọn số tiền"
                    detail="Chọn một trong các mức nạp nhanh hoặc nhập số tiền cụ thể bạn muốn nạp vào tài khoản."
                  />
                  <Step
                    index={2}
                    title="Quét mã QR"
                    detail="Sử dụng ứng dụng Ngân hàng hoặc Ví điện tử của bạn để quét mã QR được hiển thị ở bước tiếp theo."
                  />
                  <Step
                    index={3}
                    title="Xác nhận giao dịch"
                    detail="Sau khi thanh toán thành công trên ứng dụng ngân hàng, hệ thống sẽ tự động cập nhật số dư cho bạn."
                  />
                </ol>
              </section>

              <section className="relative overflow-hidden rounded-3xl border border-[#dce2f3] bg-white p-6 shadow-sm">
                <div className="relative z-10">
                  <h4 className="text-base font-semibold text-primary">Nạp tiền nhận ưu đãi</h4>
                  <p className="mt-2 text-sm text-muted">
                    Hoàn tiền 1% cho mỗi giao dịch nạp tiền qua QR Code đầu tiên trong tháng.
                  </p>
                  <button className="mt-4 rounded-lg bg-[#0050cb] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-[#003fa4]">
                    Tìm hiểu thêm
                  </button>
                </div>
                <BadgePercent className="pointer-events-none absolute -bottom-6 -right-6 h-36 w-36 text-primary/10" />
              </section>

              <section className="flex items-center justify-between rounded-3xl border border-[#dce2f3] bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                    <Headphones className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink">Cần hỗ trợ?</p>
                    <p className="text-xs text-muted">Liên hệ chúng tôi 24/7</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted" />
              </section>
            </div>
          </div>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}

function SidebarItem({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof CircleDollarSign;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all " +
        (active
          ? "bg-gradient-to-r from-primary/10 to-secondary/10 text-primary shadow-inner ring-1 ring-primary/20"
          : "text-muted hover:-translate-y-0.5 hover:bg-canvas hover:text-ink")
      }
    >
      <Icon
        className={
          "h-[18px] w-[18px] transition-colors " +
          (active ? "text-primary" : "text-muted group-hover:text-primary")
        }
        strokeWidth={1.9}
      />
      <span className={active ? "font-semibold" : undefined}>{label}</span>
    </button>
  );
}

function MethodCard({
  icon: Icon,
  title,
  subtitle,
  active,
  onClick,
}: {
  icon: typeof QrCode;
  title: string;
  subtitle: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "relative flex items-center gap-3 rounded-xl border bg-card p-4 text-left transition-all " +
        (active
          ? "border-primary shadow-card ring-2 ring-primary/20"
          : "border-hairline hover:-translate-y-0.5 hover:border-primary/30 hover:bg-canvas/60")
      }
    >
      <span
        className={
          "flex h-12 w-12 items-center justify-center rounded-lg " +
          (active ? "bg-gradient-to-br from-primary/10 to-secondary/10 text-primary" : "bg-canvas text-muted")
        }
      >
        <Icon className="h-6 w-6" />
      </span>
      <span className="flex-1">
        <span className="block text-sm font-semibold text-ink">{title}</span>
        <span className="block text-xs text-muted">{subtitle}</span>
      </span>
      {active ? (
        <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-gradient-to-br from-primary to-secondary" />
      ) : null}
    </button>
  );
}

function Step({ index, title, detail }: { index: number; title: string; detail: string }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-xs font-bold text-white shadow-soft">
        {index}
      </span>
      <div>
        <p className="text-sm font-semibold text-ink">{title}</p>
        <p className="mt-0.5 text-xs text-muted">{detail}</p>
      </div>
    </li>
  );
}

function DepositStateBadge({ status }: { status: "Pending" | "Completed" | "Failed" | "Cancelled" | "Expired" }) {
  const config = {
    Pending: {
      label: "Đang chờ thanh toán   ",
      className: "bg-primary/10 text-primary",
      icon: LoaderCircle,
      spin: true,
    },
    Completed: {
      label: "Thanh toán thành công",
      className: "bg-emerald-500/10 text-emerald-600",
      icon: CheckCircle2,
      spin: false,
    },
    Failed: {
      label: "Giao dịch thất bại",
      className: "bg-rose-500/10 text-rose-600",
      icon: XCircle,
      spin: false,
    },
    Cancelled: {
      label: "Đã hủy giao dịch",
      className: "bg-amber-400/15 text-amber-600",
      icon: XCircle,
      spin: false,
    },
    Expired: {
      label: "Giao dịch hết hạn",
      className: "bg-slate-200 text-slate-700",
      icon: Info,
      spin: false,
    },
  }[status];
  const Icon = config.icon;

  return (
    <div className={`mt-4 flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ${config.className}`}>
      <Icon className={`h-4 w-4 ${config.spin ? "animate-spin" : ""}`} />
      {config.label}
    </div>
  );
}

function StatusBadge({ status }: { status: HistoryRow["status"] }) {
  const map = {
    Completed: "bg-emerald-500/10 text-emerald-600",
    Pending: "bg-primary/10 text-primary",
    Failed: "bg-rose-500/10 text-rose-600",
    Cancelled: "bg-amber-400/15 text-amber-600",
    Expired: "bg-slate-200 text-slate-700",
  } as const;
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${map[status]}`}>
      {status}
    </span>
  );
}

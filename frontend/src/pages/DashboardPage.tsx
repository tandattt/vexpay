import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Banknote,
  BookOpen,
  CircleDollarSign,
  Code2,
  History,
  LayoutDashboard,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
import { AdminPage, type AdminMenu } from "../features/admin";
import { DepositPage } from "../features/deposit";
import { DeveloperPage } from "../features/developer";
import DeveloperInsightsPage from "../features/developer/pages/DeveloperInsightsPage";
import { ApiDocsPage } from "../features/docs";
import { useBalance, WalletTransactionsPage } from "../features/wallet";
import { AppHeader, AppShell, AppSidebar, type SidebarItem } from "../shared/components/layout";
import { useActiveRole } from "../shared/hooks/useActiveRole";
import { defaultMenuForRole, type AppRole } from "../shared/lib/roles";
import { formatCurrency } from "../shared/lib/format";
import { useStableLoading } from "../shared/hooks/useStableLoading";
import { readRaw, writeRaw } from "../shared/lib/storage";
import type { UserInfo } from "../shared/types";

interface DashboardPageProps {
  user: UserInfo;
  token: string;
  onSignOut: () => void;
}

type CustomerMenu = "dashboard" | "deposit" | "wallet" | "transactions" | "developer";
type DeveloperMenu = "developer" | "api-docs" | "stats" | "webhook-log";
type ActiveMenu = CustomerMenu | DeveloperMenu | AdminMenu;

const ACTIVE_MENU_KEY = "vexpay.active_menu";

const CUSTOMER_ITEMS: SidebarItem<CustomerMenu>[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "deposit", label: "Nạp tiền", icon: CircleDollarSign },
  { key: "wallet", label: "Ví", icon: Wallet },
  { key: "transactions", label: "Lịch sử giao dịch", icon: Banknote },
  { key: "developer", label: "Nhà phát triển", icon: Code2 },
];

const DEVELOPER_ITEMS: SidebarItem<DeveloperMenu>[] = [
  { key: "developer", label: "Khu vực nhà phát triển", icon: Code2 },
  { key: "api-docs", label: "Tài liệu API", icon: BookOpen },
  { key: "stats", label: "Thống kê", icon: Activity },
  { key: "webhook-log", label: "Webhook log", icon: History },
];

const ADMIN_ITEMS: SidebarItem<AdminMenu>[] = [
  { key: "admin-dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "admin-users", label: "Người dùng", icon: Users },
  { key: "admin-deposits", label: "Nạp tiền", icon: Banknote },
  { key: "admin-developers", label: "Developer", icon: ShieldCheck },
];

export default function DashboardPage({ user, token, onSignOut }: DashboardPageProps) {
  const {
    activeRole,
    availableRoles,
    setActiveRole,
    handleRoleControlClick,
    canSwitchRole,
    useRoleDropdown,
  } = useActiveRole(user);

  const validMenus = useMemo(() => getValidMenus(activeRole), [activeRole]);
  const [activeMenu, setActiveMenu] = useState<ActiveMenu>(() =>
    readActiveMenu(validMenus, defaultMenuForRole(activeRole) as ActiveMenu),
  );

  const balance = useBalance(token);
  const balanceLoading = useStableLoading(balance.balance === null && !balance.error, {
    hasData: balance.balance !== null,
  });

  useEffect(() => {
    writeRaw("local", ACTIVE_MENU_KEY, activeMenu);
  }, [activeMenu]);

  useEffect(() => {
    if (!validMenus.includes(activeMenu)) {
      setActiveMenu(defaultMenuForRole(activeRole) as ActiveMenu);
    }
  }, [activeMenu, activeRole, validMenus]);

  const handleRoleSelect = (role: AppRole) => {
    setActiveRole(role);
    setActiveMenu(defaultMenuForRole(role) as ActiveMenu);
  };

  const handleRoleToggle = () => {
    handleRoleControlClick();
    const nextRole = availableRoles.find((role) => role !== activeRole) ?? activeRole;
    setActiveMenu(defaultMenuForRole(nextRole) as ActiveMenu);
  };

  const balanceLabel = balance.balance === null ? "" : formatCurrency(balance.balance);
  const pageTitle = computePageTitle(activeMenu, activeRole);
  const subtitle = computeSubtitle(activeMenu, activeRole);

  return (
    <AppShell
      header={
        <AppHeader
          user={user}
          balanceLabel={balanceLabel}
          balanceLoading={balanceLoading}
          balanceError={balance.error}
          activeRole={activeRole}
          availableRoles={availableRoles}
          canSwitchRole={canSwitchRole}
          useRoleDropdown={useRoleDropdown}
          onRoleToggle={handleRoleToggle}
          onRoleSelect={handleRoleSelect}
          onSignOut={onSignOut}
        />
      }
      sidebar={
        activeRole === "admin" ? (
          <AppSidebar
            items={ADMIN_ITEMS}
            active={activeMenu as AdminMenu}
            onSelect={(key) => setActiveMenu(key)}
            footer={<SupportButton />}
          />
        ) : activeRole === "developer" ? (
          <AppSidebar
            items={DEVELOPER_ITEMS}
            active={activeMenu as DeveloperMenu}
            onSelect={(key) => setActiveMenu(key)}
            footer={<SupportButton />}
          />
        ) : (
          <AppSidebar
            items={CUSTOMER_ITEMS}
            active={activeMenu as CustomerMenu}
            onSelect={(key) => setActiveMenu(key)}
            footer={<SupportButton />}
          />
        )
      }
      eyebrow={activeRole === "admin" ? "Admin" : activeRole === "developer" ? "Developer" : "Wallet"}
      title={pageTitle}
      subtitle={subtitle}
    >
      {activeRole === "admin" ? <AdminPage token={token} activeMenu={activeMenu as AdminMenu} /> : null}

      {activeRole === "customer" && activeMenu === "deposit" ? (
        <DepositPage token={token} enabled onBalanceMayChange={balance.reload} />
      ) : null}

      {activeRole === "customer" && activeMenu === "developer" ? (
        <DeveloperPage user={user} token={token} enabled viewMode="customer" />
      ) : null}

      {activeRole === "developer" && activeMenu === "developer" ? (
        <DeveloperPage user={user} token={token} enabled viewMode="developer" />
      ) : null}

      {activeRole === "developer" && activeMenu === "api-docs" ? <ApiDocsPage enabled /> : null}

      {activeRole === "developer" && activeMenu === "stats" ? (
        <DeveloperInsightsPage token={token} view="stats" enabled />
      ) : null}

      {activeRole === "developer" && activeMenu === "webhook-log" ? (
        <DeveloperInsightsPage token={token} view="webhook-log" enabled />
      ) : null}

      {activeRole === "customer" && activeMenu === "transactions" ? (
        <WalletTransactionsPage token={token} enabled />
      ) : null}

      {shouldShowPlaceholder(activeRole, activeMenu) ? (
        <section className="glass flex flex-col items-center rounded-2xl border border-dashed border-hairline p-10 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-subtle">
            <Code2 className="h-7 w-7 text-primary" />
          </div>
          <h3 className="mt-4 font-display text-lg font-semibold text-ink">{pageTitle}</h3>
          <p className="mt-2 max-w-sm text-sm text-muted">Đây là trang mock UI. Chưa có nghiệp vụ backend.</p>
        </section>
      ) : null}
    </AppShell>
  );
}

function SupportButton() {
  return (
    <button className="w-full rounded-xl bg-gradient-primary px-3 py-2.5 text-sm font-semibold text-on-primary shadow-soft transition-all hover:-translate-y-0.5">
      Hỗ trợ
    </button>
  );
}

function getValidMenus(role: AppRole): ActiveMenu[] {
  if (role === "admin") {
    return ["admin-dashboard", "admin-users", "admin-deposits", "admin-developers"];
  }
  if (role === "developer") {
    return ["developer", "api-docs", "stats", "webhook-log"];
  }
  return ["dashboard", "deposit", "wallet", "transactions", "developer"];
}

function readActiveMenu(validMenus: ActiveMenu[], fallback: ActiveMenu): ActiveMenu {
  const saved = readRaw("local", ACTIVE_MENU_KEY) as ActiveMenu | null;
  return saved && validMenus.includes(saved) ? saved : fallback;
}

function shouldShowPlaceholder(role: AppRole, activeMenu: ActiveMenu): boolean {
  if (role === "admin") return false;
  if (role === "developer") return false;
  return activeMenu !== "deposit" && activeMenu !== "developer" && activeMenu !== "transactions";
}

function computePageTitle(activeMenu: ActiveMenu, role: AppRole): string {
  if (role === "admin") {
    return {
      "admin-dashboard": "Dashboard",
      "admin-users": "Quản lý người dùng",
      "admin-deposits": "Quản lý nạp tiền",
      "admin-developers": "Duyệt developer",
    }[activeMenu as AdminMenu];
  }

  if (role === "developer") {
    return {
      developer: "Khu vực nhà phát triển",
      "api-docs": "Tài liệu API",
      stats: "Thống kê",
      "webhook-log": "Webhook log",
    }[activeMenu as DeveloperMenu];
  }

  return {
    dashboard: "Dashboard",
    deposit: "Nạp tiền",
    wallet: "Ví",
    transactions: "Lịch sử giao dịch",
    developer: "Nhà phát triển",
  }[activeMenu as CustomerMenu];
}

function computeSubtitle(activeMenu: ActiveMenu, role: AppRole): string {
  if (role === "admin") {
    return "Khu vực quản trị hệ thống. Chỉ tài khoản ADMIN mới truy cập được.";
  }

  if (role === "developer") {
    if (activeMenu === "api-docs") {
      return "Tài liệu OpenAPI và hướng dẫn tích hợp Payments API";
    }
    if (activeMenu === "stats") {
      return "Doanh thu, giao dịch và tỷ lệ thành công 30 ngày gần nhất theo project.";
    }
    if (activeMenu === "webhook-log") {
      return "Lịch sử các lần VexPay gọi webhook URL của project.";
    }
    return "Quản lý project, API key và webhook cho tích hợp thanh toán.";
  }

  if (activeMenu === "deposit") return "Chọn phương thức và số tiền để tạo giao dịch nạp.";
  if (activeMenu === "transactions") {
    return "Theo dõi tiền vào/ra ví: nạp tiền, thanh toán dịch vụ và thu từ khách.";
  }
  if (activeMenu === "developer") {
    return "Xem tình trạng yêu cầu trở thành nhà phát triển.";
  }
  return "Trang mô phỏng giao diện. Chức năng sẽ được triển khai sau.";
}

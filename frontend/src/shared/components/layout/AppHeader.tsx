import { LogOut, Search, Wallet } from "lucide-react";

import type { UserInfo } from "../../types";
import { type AppRole } from "../../lib/roles";

import { BalanceBadgeSkeleton } from "../ui/skeletons";

import ThemeToggle from "../ui/ThemeToggle";

import RoleSwitcher from "./RoleSwitcher";



interface AppHeaderProps {

  user: UserInfo;

  balanceLabel: string;

  balanceLoading?: boolean;

  balanceError?: string | null;

  activeRole: AppRole;

  availableRoles: AppRole[];

  canSwitchRole: boolean;

  useRoleDropdown: boolean;

  onRoleToggle: () => void;

  onRoleSelect: (role: AppRole) => void;

  onSignOut: () => void;

}



export default function AppHeader({

  user,

  balanceLabel,

  balanceLoading,

  balanceError,

  activeRole,

  availableRoles,

  canSwitchRole,

  useRoleDropdown,

  onRoleToggle,

  onRoleSelect,

  onSignOut,

}: AppHeaderProps) {
  return (

    <header className="surface-header sticky top-0 z-20">

      <div className="flex items-center gap-3 px-4 py-3 sm:px-6">

        <div className="flex items-center gap-3">

          <img src="/logo.png" alt="VexPay" className="h-10 w-10 object-contain" />

          <div className="leading-tight">

            <p className="font-display text-sm font-bold text-ink">VexPay</p>

            <p className="text-[10px] text-muted">Three Hutech</p>

          </div>

        </div>



        <div className="ml-auto flex items-center gap-2">

          <ThemeToggle />



          <div className="relative hidden lg:block">

            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />

            <input

              type="search"

              placeholder="Tìm kiếm giao dịch..."

              className="h-9 w-56 rounded-xl border border-hairline bg-fill-subtle pl-10 pr-4 text-sm text-ink placeholder:text-muted-soft focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"

            />

          </div>



          <div className="hidden items-center gap-2 rounded-xl border border-hairline bg-fill-subtle px-3 py-1.5 text-xs sm:flex">

            <Wallet className="h-3.5 w-3.5 text-primary" />

            <span className="text-muted">Số dư</span>

            {balanceError ? (

              <span className="max-w-36 truncate font-semibold text-rose-500" title={balanceError}>

                Lỗi

              </span>

            ) : balanceLoading ? (

              <BalanceBadgeSkeleton />

            ) : (

              <span className="min-w-[7.5rem] font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">

                {balanceLabel}

              </span>

            )}

          </div>



          <RoleSwitcher

            user={user}

            activeRole={activeRole}

            availableRoles={availableRoles}

            canSwitchRole={canSwitchRole}

            useRoleDropdown={useRoleDropdown}

            onToggle={onRoleToggle}

            onSelect={onRoleSelect}

          />

          <button

            type="button"

            onClick={onSignOut}

            className="inline-flex items-center gap-1.5 rounded-xl border border-hairline bg-fill-subtle px-3 py-2 text-xs font-semibold text-muted transition-all hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-500"

          >

            <LogOut className="h-3.5 w-3.5" />

            <span className="hidden sm:inline">Đăng xuất</span>

          </button>

        </div>

      </div>

    </header>

  );

}



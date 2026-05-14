import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { getInitials } from "../../lib/format";
import { APP_ROLE_LABEL, APP_ROLE_TITLE, type AppRole } from "../../lib/roles";
import type { UserInfo } from "../../types";
import clsx from "../../lib/clsx";

interface Props {
  user: UserInfo;
  activeRole: AppRole;
  availableRoles: AppRole[];
  canSwitchRole: boolean;
  useRoleDropdown: boolean;
  onToggle: () => void;
  onSelect: (role: AppRole) => void;
}

export default function RoleSwitcher({
  user,
  activeRole,
  availableRoles,
  canSwitchRole,
  useRoleDropdown,
  onToggle,
  onSelect,
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const initials = getInitials(user.fullName);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const handleClick = () => {
    if (!canSwitchRole) return;
    if (useRoleDropdown) {
      setOpen((value) => !value);
      return;
    }
    onToggle();
  };

  const otherRole = availableRoles.find((role) => role !== activeRole);
  const title = !canSwitchRole
    ? undefined
    : useRoleDropdown
      ? "Chọn vai trò"
      : otherRole
        ? `Chuyển sang ${APP_ROLE_TITLE[otherRole]}`
        : undefined;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={handleClick}
        title={title}
        disabled={!canSwitchRole}
        className={clsx(
          "flex items-center gap-2 rounded-xl border border-hairline bg-fill-subtle px-2 py-1.5 text-left transition-all",
          canSwitchRole && "hover:border-primary/30 hover:bg-fill-hover",
          !canSwitchRole && "cursor-default",
        )}
      >
        <div className="leading-tight">
          <p className="text-xs font-semibold text-ink">{user.fullName}</p>
          <p className="text-[10px] text-primary">{APP_ROLE_LABEL[activeRole]}</p>
        </div>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary text-xs font-bold text-on-primary">
          {initials}
        </span>
        {canSwitchRole && useRoleDropdown ? (
          <ChevronDown
            className={clsx("h-4 w-4 text-muted transition-transform", open && "rotate-180")}
          />
        ) : null}
      </button>

      {open && useRoleDropdown ? (
        <div className="role-switcher-menu absolute right-0 top-[calc(100%+0.35rem)] z-30 min-w-[12rem] rounded-xl p-1">
          <p className="role-switcher-menu__label px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide">
            Chuyển vai trò
          </p>
          {availableRoles.map((role) => {
            const isActive = role === activeRole;
            return (
              <button
                key={role}
                type="button"
                onClick={() => {
                  onSelect(role);
                  setOpen(false);
                }}
                className={clsx(
                  "role-switcher-option flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
                  isActive && "role-switcher-option--active",
                )}
              >
                <span>
                  <span className="role-switcher-option__title block font-medium">
                    {APP_ROLE_TITLE[role]}
                  </span>
                  <span className="role-switcher-option__badge text-[10px] uppercase tracking-wide">
                    {APP_ROLE_LABEL[role]}
                  </span>
                </span>
                {isActive ? <Check className="h-4 w-4 shrink-0 text-primary" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

import { Check, Code2, ShoppingCart, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { AdminUserItemResponse } from "../types";

interface Props {
  user: AdminUserItemResponse | null;
  selectedRoles: string[];
  isSaving: boolean;
  onToggleRole: (role: string) => void;
  onCancel: () => void;
  onSave: () => void;
}

const ROLE_OPTIONS: { key: string; label: string; desc: string; icon: LucideIcon }[] = [
  { key: "CUSTOMER", label: "CUSTOMER", desc: "Người dùng cuối cơ bản", icon: UserRound },
  { key: "DEVELOPER", label: "DEVELOPER", desc: "Truy cập API và công cụ lập trình", icon: Code2 },
  { key: "SHOP_OWNER", label: "SHOP_OWNER", desc: "Quản lý cửa hàng và sản phẩm", icon: ShoppingCart },
];

export default function UserRolesModal({
  user,
  selectedRoles,
  isSaving,
  onToggleRole,
  onCancel,
  onSave,
}: Props) {
  if (!user) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-3 backdrop-blur-sm sm:p-4">
      <div className="glass w-full max-w-[560px] overflow-hidden rounded-2xl shadow-elevated">
        <div className="px-5 pt-5 pb-3 sm:px-6 sm:pt-6">
          <h3 className="font-display text-lg font-bold text-ink">
            Nâng quyền: <span className="text-primary">{user.username}</span>
          </h3>
          <p className="mt-1 text-xs text-muted">Chọn role cần gán cho tài khoản.</p>
        </div>

        <div className="space-y-2.5 px-5 pb-6 sm:px-6">
          {ROLE_OPTIONS.map((role) => {
            const checked = selectedRoles.includes(role.key);
            const Icon = role.icon;
            return (
              <button
                key={role.key}
                type="button"
                onClick={() => onToggleRole(role.key)}
                className={`flex w-full items-center rounded-xl border px-3 py-3 text-left transition-all sm:px-3.5 ${
                  checked
                    ? "border-primary/50 bg-primary/10 ring-1 ring-primary/30"
                    : "border-hairline bg-fill-subtle hover:border-primary/30 hover:bg-fill-subtle"
                }`}
              >
                <span
                  className={`mr-3 flex h-8 w-8 items-center justify-center rounded-lg ${
                    checked ? "bg-gradient-primary text-on-primary" : "bg-fill-muted text-muted"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-semibold text-ink">{role.label}</span>
                  <span className="text-[11px] text-muted">{role.desc}</span>
                </span>
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded-full bg-primary transition-opacity ${
                    checked ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <Check className="h-3 w-3 text-on-primary" />
                </span>
              </button>
            );
          })}

          <div className="mt-8 flex items-center justify-end gap-3 border-t border-hairline pt-4">
            <button
              className="rounded-xl border border-hairline px-6 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-fill-subtle hover:text-ink"
              onClick={onCancel}
            >
              Hủy
            </button>
            <button
              disabled={isSaving}
              className="rounded-xl bg-gradient-primary px-6 py-2.5 text-sm font-semibold text-on-primary shadow-soft transition-all hover:-translate-y-0.5 disabled:opacity-70"
              onClick={onSave}
            >
              {isSaving ? "Đang lưu..." : "Lưu quyền"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

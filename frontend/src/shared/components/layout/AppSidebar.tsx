import type { LucideIcon } from "lucide-react";
import clsx from "../../lib/clsx";

export interface SidebarItem<TKey extends string> {
  key: TKey;
  label: string;
  icon: LucideIcon;
}

interface AppSidebarProps<TKey extends string> {
  items: SidebarItem<TKey>[];
  active: TKey;
  onSelect: (key: TKey) => void;
  footer?: React.ReactNode;
  title?: string;
}

export default function AppSidebar<TKey extends string>({
  items,
  active,
  onSelect,
  footer,
  title = "Menu",
}: AppSidebarProps<TKey>) {
  return (
    <aside className="surface-sidebar sticky top-[65px] hidden h-[calc(100vh-65px)] w-64 shrink-0 lg:flex lg:flex-col">
      <div className="px-4 py-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
          {title}
        </p>
        <nav className="mt-4 flex flex-col gap-1">
          {items.map((item) => (
            <SidebarButton
              key={item.key}
              icon={item.icon}
              label={item.label}
              active={active === item.key}
              onClick={() => onSelect(item.key)}
            />
          ))}
        </nav>
      </div>
      {footer ? <div className="mt-auto px-4 pb-6">{footer}</div> : null}
    </aside>
  );
}

function SidebarButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all duration-200",
        active
          ? "bg-gradient-subtle text-ink shadow-inner ring-1 ring-primary/30"
          : "text-muted hover:bg-fill-subtle hover:text-ink",
      )}
    >
      {active ? (
        <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-gradient-primary shadow-soft" />
      ) : null}
      <Icon
        className={clsx(
          "h-[18px] w-[18px] transition-colors",
          active ? "text-primary" : "text-muted group-hover:text-primary",
        )}
        strokeWidth={1.9}
      />
      <span className={active ? "font-semibold text-ink" : "text-muted"}>{label}</span>
    </button>
  );
}

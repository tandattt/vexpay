import { Banknote, QrCode } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import clsx from "../../../shared/lib/clsx";
import type { DepositMethod } from "../types";

interface Props {
  value: DepositMethod;
  onChange: (value: DepositMethod) => void;
}

export default function DepositMethodPicker({ value, onChange }: Props) {
  return (
    <section className="glass rounded-2xl p-6">
      <h3 className="mb-4 flex items-center gap-2 font-display text-base font-semibold text-ink">
        <Banknote className="h-5 w-5 text-primary" />
        Chọn phương thức thanh toán
      </h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <MethodCard
          icon={QrCode}
          title="Thanh toán QR Code"
          subtitle="Xử lý ngay lập tức"
          active={value === "qr"}
          onClick={() => onChange("qr")}
        />
        <MethodCard
          icon={Banknote}
          title="Chuyển khoản ngân hàng"
          subtitle="Xử lý trong 5-15 phút"
          active={value === "bank"}
          onClick={() => onChange("bank")}
        />
      </div>
    </section>
  );
}

function MethodCard({
  icon: Icon,
  title,
  subtitle,
  active,
  onClick,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "relative flex items-center gap-3 rounded-xl border p-4 text-left transition-all duration-200",
        active
          ? "border-primary/50 bg-gradient-subtle shadow-soft ring-1 ring-primary/30"
          : "border-hairline bg-fill-subtle hover:border-primary/30 hover:bg-fill-subtle",
      )}
    >
      <span
        className={clsx(
          "flex h-12 w-12 items-center justify-center rounded-xl",
          active
            ? "bg-gradient-primary text-on-primary shadow-soft"
            : "bg-fill-subtle text-muted",
        )}
      >
        <Icon className="h-6 w-6" />
      </span>
      <span className="flex-1">
        <span className="block text-sm font-semibold text-ink">{title}</span>
        <span className="block text-xs text-muted">{subtitle}</span>
      </span>
      {active ? (
        <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-primary shadow-soft" />
      ) : null}
    </button>
  );
}

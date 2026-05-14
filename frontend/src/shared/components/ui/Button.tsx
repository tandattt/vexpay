import { LoaderCircle } from "lucide-react";
import clsx from "../../lib/clsx";

type Variant = "primary" | "gradient" | "ghost" | "outline" | "danger" | "subtle";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const VARIANT: Record<Variant, string> = {
  primary:
    "bg-primary text-on-primary hover:bg-accent shadow-soft hover:shadow-elevated",
  gradient:
    "bg-gradient-primary text-on-primary shadow-soft hover:shadow-elevated hover:-translate-y-px",
  ghost: "text-muted hover:text-ink hover:bg-fill-subtle",
  outline:
    "border border-hairline-strong bg-transparent text-ink hover:border-primary/40 hover:text-primary hover:bg-fill-subtle",
  danger:
    "border border-rose-500/30 bg-rose-500/10 text-rose-600 hover:bg-rose-500/15 dark:text-rose-400",
  subtle: "bg-fill-subtle text-ink hover:bg-fill-muted border border-hairline",
};

const SIZE: Record<Size, string> = {
  sm: "h-9 px-3 text-xs rounded-lg",
  md: "h-10 px-4 text-sm rounded-xl",
  lg: "h-12 px-5 text-base rounded-xl",
};

export default function Button({
  variant = "primary",
  size = "md",
  loading,
  leftIcon,
  rightIcon,
  className,
  children,
  disabled,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      disabled={loading || disabled}
      className={clsx(
        "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:translate-y-0",
        VARIANT[variant],
        SIZE[size],
        className,
      )}
    >
      {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : leftIcon}
      {children}
      {!loading ? rightIcon : null}
    </button>
  );
}

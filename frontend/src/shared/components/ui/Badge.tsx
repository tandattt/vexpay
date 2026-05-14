import clsx from "../../lib/clsx";

type Tone = "primary" | "success" | "warning" | "danger" | "neutral" | "info";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

const TONE: Record<Tone, string> = {
  primary: "bg-primary/15 text-primary border border-primary/25",
  success: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25",
  warning: "bg-amber-400/15 text-amber-600 dark:text-amber-400 border border-amber-400/25",
  danger: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25",
  neutral: "bg-fill-muted text-muted border border-hairline",
  info: "bg-secondary/15 text-secondary border border-secondary/25",
};

export default function Badge({ tone = "primary", className, children, ...rest }: BadgeProps) {
  return (
    <span
      {...rest}
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
        TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

import clsx from "../../lib/clsx";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

interface Tone {
  badge: string;
  dot: string;
}

const DEFAULT: Tone = {
  badge: "bg-primary/15 text-primary border border-primary/25",
  dot: "bg-primary shadow-[0_0_6px_rgba(0,212,255,0.6)]",
};

function tone(status: string): Tone {
  const normalized = status.toLowerCase();
  if (normalized.includes("complete") || normalized.includes("approved")) {
    return {
      badge: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25",
      dot: "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]",
    };
  }
  if (normalized.includes("cancel")) {
    return {
      badge: "bg-amber-400/15 text-amber-600 dark:text-amber-400 border border-amber-400/25",
      dot: "bg-amber-400",
    };
  }
  if (normalized.includes("expire")) {
    return {
      badge: "bg-fill-muted text-muted border border-hairline",
      dot: "bg-muted",
    };
  }
  if (normalized.includes("revok") || normalized.includes("thu hồi")) {
    return {
      badge: "bg-amber-400/15 text-amber-600 dark:text-amber-400 border border-amber-400/25",
      dot: "bg-amber-400",
    };
  }
  if (normalized.includes("fail") || normalized.includes("reject")) {
    return {
      badge: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25",
      dot: "bg-rose-400 shadow-[0_0_6px_rgba(248,113,113,0.6)]",
    };
  }
  if (normalized.includes("pending")) {
    return {
      badge: "bg-fill-muted text-muted border border-hairline",
      dot: "bg-muted animate-pulse",
    };
  }
  return DEFAULT;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const t = tone(status);
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        t.badge,
        className,
      )}
    >
      <span className={clsx("mr-2 h-1.5 w-1.5 rounded-full", t.dot)} />
      {status}
    </span>
  );
}

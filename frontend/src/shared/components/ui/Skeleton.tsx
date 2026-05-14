import clsx from "../../lib/clsx";

type SkeletonRounded = "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "full";

const ROUNDED: Record<SkeletonRounded, string> = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
  full: "rounded-full",
};

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  rounded?: SkeletonRounded;
}

export default function Skeleton({ className, rounded = "md", ...rest }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={clsx("skeleton-shimmer", ROUNDED[rounded], className)}
      {...rest}
    />
  );
}

import clsx from "../../lib/clsx";

interface CardProps extends React.HTMLAttributes<HTMLElement> {
  as?: "section" | "div" | "article";
  padded?: boolean;
  glow?: boolean;
}

export default function Card({
  as: Tag = "section",
  padded = true,
  glow = false,
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <Tag
      {...rest}
      className={clsx(
        "glass rounded-2xl",
        glow && "shadow-soft",
        padded && "p-6",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

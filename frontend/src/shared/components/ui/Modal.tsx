import { useEffect, useLayoutEffect, useState } from "react";
import { X } from "lucide-react";
import clsx from "../../lib/clsx";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: "sm" | "md" | "lg";
  closeOnBackdrop?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

const SIZE = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

export default function Modal({
  open,
  onClose,
  title,
  description,
  size = "sm",
  closeOnBackdrop = true,
  children,
  footer,
  className,
}: ModalProps) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const id = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(id);
    }
    setVisible(false);
    const timeout = setTimeout(() => setMounted(false), 180);
    return () => clearTimeout(timeout);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useLayoutEffect(() => {
    if (!mounted) return;
    const { body, documentElement } = document;
    const scrollbarWidth = window.innerWidth - documentElement.clientWidth;
    const previousOverflow = body.style.overflow;
    const previousPaddingRight = body.style.paddingRight;
    body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }
    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPaddingRight;
    };
  }, [mounted]);

  if (!mounted) return null;

  return (
    <div
      className={clsx(
        "fixed inset-0 z-50 flex items-center justify-center bg-overlay px-4 backdrop-blur-sm",
        "transition-opacity duration-150 ease-out",
        visible ? "opacity-100" : "opacity-0",
      )}
      onClick={closeOnBackdrop ? onClose : undefined}
    >
      <div
        className={clsx(
          "glass relative flex w-full max-h-[min(90dvh,720px)] flex-col overflow-hidden rounded-2xl p-6 shadow-elevated",
          "transition-all duration-150 ease-out",
          visible ? "scale-100 opacity-100" : "scale-95 opacity-0",
          SIZE[size],
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-lg p-1.5 text-muted transition-colors hover:bg-fill-hover hover:text-ink"
          aria-label="Đóng"
        >
          <X className="h-4 w-4" />
        </button>

        {title ? (
          <h5 className="shrink-0 pr-8 font-display text-base font-semibold text-ink">{title}</h5>
        ) : null}
        {description ? <p className="mt-1 shrink-0 text-sm text-muted">{description}</p> : null}
        <div
          className={clsx(
            "min-h-0 flex-1 overflow-y-auto overscroll-contain",
            title || description ? "mt-5" : undefined,
          )}
        >
          {children}
        </div>
        {footer ? (
          <div className="mt-5 flex shrink-0 justify-end gap-2 border-t border-hairline pt-4">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}

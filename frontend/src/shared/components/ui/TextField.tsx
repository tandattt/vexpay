import { forwardRef } from "react";
import clsx from "../../lib/clsx";

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  leftIcon?: React.ReactNode;
  rightSlot?: React.ReactNode;
  error?: string | null;
  helper?: React.ReactNode;
  wrapperClassName?: string;
}

const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, leftIcon, rightSlot, error, helper, className, wrapperClassName, id, ...rest },
  ref,
) {
  const inputId = id ?? rest.name;
  return (
    <div className={wrapperClassName}>
      {label ? (
        <label htmlFor={inputId} className="block text-xs font-semibold text-muted">
          {label}
        </label>
      ) : null}
      <div
        className={clsx(
          "mt-1.5 flex items-center gap-2 rounded-xl border border-hairline bg-fill-subtle px-3 transition-all duration-200",
          "focus-within:border-primary/50 focus-within:bg-fill-muted focus-within:ring-2 focus-within:ring-primary/15",
          error && "border-rose-500/50 focus-within:border-rose-400 focus-within:shadow-[0_0_0_3px_rgba(248,113,113,0.1)]",
        )}
      >
        {leftIcon ? <span className="text-muted">{leftIcon}</span> : null}
        <input
          ref={ref}
          id={inputId}
          {...rest}
          className={clsx(
            "h-11 w-full appearance-none bg-transparent text-sm text-ink outline-none placeholder:text-muted-soft",
            className,
          )}
        />
        {rightSlot}
      </div>
      {error ? (
        <p className="mt-1 text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p>
      ) : helper ? (
        <p className="mt-1 text-xs text-muted">{helper}</p>
      ) : null}
    </div>
  );
});

export default TextField;

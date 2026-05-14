import clsx from "../../lib/clsx";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
  id?: string;
}

export default function Switch({ checked, onChange, disabled, label, description, id }: SwitchProps) {
  const switchId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex items-start justify-between gap-3">
      {label || description ? (
        <div className="min-w-0 flex-1">
          {label ? (
            <label htmlFor={switchId} className="block text-sm font-semibold text-ink">
              {label}
            </label>
          ) : null}
          {description ? <p className="mt-0.5 text-xs text-muted">{description}</p> : null}
        </div>
      ) : null}
      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={clsx(
          "relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full border transition-colors duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
          disabled && "cursor-not-allowed opacity-50",
          checked ? "border-primary/40 bg-primary" : "border-hairline bg-fill-muted",
        )}
      >
        <span
          className={clsx(
            "inline-block h-4 w-4 transform rounded-full bg-card shadow-sm transition-transform duration-200",
            checked ? "translate-x-5" : "translate-x-1",
          )}
        />
      </button>
    </div>
  );
}

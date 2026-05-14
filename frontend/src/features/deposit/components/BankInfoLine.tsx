import type { DepositQrConfigResponse } from "../types";

interface Props {
  config: DepositQrConfigResponse;
  size?: "sm" | "md";
}

export default function BankInfoLine({ config, size = "md" }: Props) {
  if (size === "sm") {
    return (
      <div className="mt-1 text-center">
        <div className="flex items-center justify-center gap-1.5 text-xs text-muted">
          {config.bankIconUrl ? (
            <img
              src={config.bankIconUrl}
              alt={config.bankShortName || config.bankName}
              className="h-5 w-5 rounded-full object-cover"
            />
          ) : null}
          <span>{config.bankName}</span>
        </div>
        <p className="mt-1 text-[11px] font-semibold text-primary">{config.accountNumber}</p>
        <p className="text-[10px] text-muted">{config.accountName?.toUpperCase() || ""}</p>
      </div>
    );
  }

  return (
    <div className="mt-4 p-1 text-center">
      <div className="flex items-center justify-center gap-2 text-sm font-medium text-muted">
        {config.bankIconUrl ? (
          <img
            src={config.bankIconUrl}
            alt={config.bankShortName || config.bankName}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : null}
        <span>{config.bankName}</span>
      </div>
      <p className="mt-2 text-xs font-semibold text-primary">{config.accountNumber}</p>
      <p className="mt-1 text-[11px] text-muted">{config.accountName?.toUpperCase() || ""}</p>
    </div>
  );
}

import { CheckCircle2, Copy, Loader2 } from "lucide-react";
import QrFrame from "../../deposit/components/QrFrame";
import type { CheckoutSession } from "../types";

interface Props {
  session: CheckoutSession;
  loading: boolean;
  copied: string | null;
  onCopy: (value: string, key: string) => void;
}

export default function BankTransferPanel({
  session,
  loading,
  copied,
  onCopy,
}: Props) {
  return (
    <div className="checkout-bank-panel mt-6">
      <h3 className="checkout-bank-title text-center font-display text-lg font-semibold">
        Quét QR để thanh toán
      </h3>
      <p className="checkout-bank-subtitle mx-auto mt-2 max-w-md text-center text-sm">
        Sử dụng ứng dụng ngân hàng/ví điện tử hỗ trợ VietQR để quét mã QR và thanh toán nhanh chóng.
      </p>

      <div className="mt-6 flex justify-center">
        {loading || !session.qrImageUrl ? (
          <div className="flex h-64 w-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <QrFrame src={session.qrImageUrl} alt="QR thanh toán" size="md" />
        )}
      </div>

      {!loading && session.qrImageUrl ? (
        <>
          <div className="checkout-bank-divider my-6" />

          {session.bankName ? (
            <div className="checkout-bank-bankrow flex items-center gap-2 px-1 py-3">
              {session.bankIconUrl ? (
                <img
                  src={session.bankIconUrl}
                  alt={session.bankName}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <span className="checkout-bank-bankdot flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold">
                  {(session.bankName[0] ?? "B").toUpperCase()}
                </span>
              )}
              <span className="text-sm font-medium">{session.bankName}</span>
            </div>
          ) : null}

          <div className="checkout-bank-fields overflow-hidden rounded-xl">
            {session.bankAccountNumber ? (
              <BankField
                label="Số tài khoản"
                value={session.bankAccountNumber}
                copied={copied === "acc"}
                onCopy={() => onCopy(session.bankAccountNumber!, "acc")}
              />
            ) : null}
            <BankField
              label="Nội dung chuyển khoản"
              value={session.transferCode}
              copied={copied === "code"}
              onCopy={() => onCopy(session.transferCode, "code")}
            />
          </div>

        </>
      ) : null}
    </div>
  );
}

function BankField({
  label,
  value,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="checkout-bank-field flex items-center justify-between gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="checkout-bank-field__label text-xs">{label}</p>
        <p className="checkout-bank-field__value mt-0.5 truncate font-mono text-sm font-semibold">
          {value}
        </p>
      </div>
      <button
        type="button"
        onClick={onCopy}
        className="checkout-icon-btn inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
        aria-label={`Sao chép ${label}`}
      >
        {copied ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}

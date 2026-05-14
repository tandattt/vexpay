import { useState } from "react";
import { CheckCircle2, Wallet } from "lucide-react";
import LoginForm from "../../auth/components/LoginForm";
import type { LoginResponse } from "../../auth/types";
import { useBalance } from "../../wallet";
import { Button, Spinner, ThemeToggle } from "../../../shared/components/ui";
import { formatCurrency, formatDateTime } from "../../../shared/lib/format";
import BankTransferPanel from "../components/BankTransferPanel";
import CheckoutCancelButton from "../components/CheckoutCancelButton";
import { useCheckout } from "../hooks/useCheckout";

interface Props {
  paymentId: string;
  token: string | null;
  userName: string | null;
  onLogin: (response: LoginResponse) => void;
}

const STATUS_LABEL: Record<string, string> = {
  AwaitingTransfer: "Đang chờ thanh toán",
  Paid: "Đã thanh toán",
  Failed: "Thất bại",
  Expired: "Hết hạn",
  Cancelled: "Đã huỷ",
  "0": "Đang chờ thanh toán",
  "1": "Đã thanh toán",
  "2": "Thất bại",
  "3": "Hết hạn",
  "4": "Đã huỷ",
};

export default function CheckoutPage({ paymentId, token, userName, onLogin }: Props) {
  const checkout = useCheckout({ paymentId, token });
  const balance = useBalance(token);
  const [copied, setCopied] = useState<string | null>(null);

  const copyText = async (value: string, key: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(key);
    window.setTimeout(() => setCopied(null), 1500);
  };

  if (checkout.loading && !checkout.session) {
    return (
      <div className="checkout-shell flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    );
  }

  if (checkout.error && !checkout.session) {
    return (
      <div className="checkout-shell flex min-h-screen items-center justify-center p-6">
        <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{checkout.error}</p>
      </div>
    );
  }

  const session = checkout.session;
  if (!session) return null;

  const statusKey = String(session.status);
  const statusLabel = STATUS_LABEL[statusKey] ?? statusKey;
  const balanceEnough = balance.balance !== null && balance.balance >= session.amount;

  return (
    <div className="checkout-shell relative min-h-screen px-4 py-8 sm:px-6">
      <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>

      <div className="mx-auto max-w-5xl pt-8">
        <div className="mb-6 text-center">
          <img src="/logo.png" alt="VexPay" className="mx-auto h-12 w-12 object-contain" />
          <h1 className="mt-3 font-display text-xl font-bold">{session.projectName}</h1>
          <p className="mt-1 text-sm checkout-row-label">Thanh toán qua VexPay</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,340px)_1fr]">
          <aside className="checkout-glass rounded-2xl p-5">
            <h2 className="text-sm font-semibold">Thông tin đơn hàng</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <Row label="Mã đơn" value={session.merchantRef ?? session.transferCode} mono />
              {session.description ? <Row label="Mô tả" value={session.description} /> : null}
              <Row label="Trạng thái" value={statusLabel} />
              <Row label="Thời gian" value={formatDateTime(session.createdAt)} />
            </dl>
            <p className="checkout-amount mt-5 font-display text-2xl font-bold">
              {formatCurrency(session.amount)}
            </p>
          </aside>

          <section className="checkout-glass rounded-2xl p-5 sm:p-6">
            {checkout.isTerminal ? (
              <TerminalState statusLabel={statusLabel} paid={statusKey === "Paid" || statusKey === "1"} />
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  <ModeTab
                    active={checkout.payMode === "bank"}
                    label="Chuyển khoản / QR"
                    onClick={() => checkout.setPayMode("bank")}
                  />
                  <ModeTab
                    active={checkout.payMode === "wallet"}
                    label="Ví VexPay"
                    onClick={() => checkout.setPayMode("wallet")}
                  />
                </div>

                {checkout.payMode === "wallet" ? (
                  <div className="mt-6 space-y-4">
                    {!token ? (
                      <div className="checkout-inset rounded-xl p-4">
                        <p className="text-sm font-medium">Đăng nhập để thanh toán bằng số dư</p>
                        <p className="mt-1 text-xs checkout-row-label">
                          Nếu chưa có tài khoản, đăng ký trên VexPay rồi quay lại trang này.
                        </p>
                        <LoginForm onSuccess={onLogin} />
                      </div>
                    ) : (
                      <>
                        <p className="text-sm checkout-row-label">
                          Xin chào <span className="font-semibold checkout-row-value">{userName}</span>
                        </p>
                        <div className="checkout-inset rounded-xl p-4">
                          <div className="flex items-center gap-2 checkout-row-label">
                            <Wallet className="h-4 w-4 text-primary" />
                            <span className="text-xs font-semibold uppercase tracking-wide">Số dư khả dụng</span>
                          </div>
                          <p className="checkout-amount mt-2 font-display text-xl font-bold">
                            {balance.balance === null ? "—" : formatCurrency(balance.balance)}
                          </p>
                        </div>
                        {checkout.walletError ? (
                          <p className="text-sm font-medium text-rose-600 dark:text-rose-400">
                            {checkout.walletError}
                          </p>
                        ) : null}
                        {!balanceEnough ? (
                          <p className="text-sm text-amber-700 dark:text-amber-300">
                            Số dư không đủ. Nạp thêm ví hoặc chọn tab chuyển khoản / QR.
                          </p>
                        ) : null}
                        <Button
                          variant="gradient"
                          size="md"
                          className="w-full sm:w-auto"
                          loading={checkout.walletPaying}
                          disabled={!balanceEnough}
                          onClick={() => void checkout.payWithWallet()}
                        >
                          Thanh toán {formatCurrency(session.amount)}
                        </Button>
                      </>
                    )}
                  </div>
                ) : (
                  <BankTransferPanel
                    session={session}
                    loading={checkout.bankLoading}
                    copied={copied}
                    onCopy={(value, key) => void copyText(value, key)}
                  />
                )}

                {checkout.error ? (
                  <p className="mt-4 text-center text-sm font-medium text-rose-600 dark:text-rose-400">
                    {checkout.error}
                  </p>
                ) : null}

                <CheckoutCancelButton
                  loading={checkout.cancelling}
                  onClick={() => void checkout.cancelPayment()}
                />
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="checkout-row-label text-xs">{label}</dt>
      <dd className={`checkout-row-value mt-0.5 font-medium ${mono ? "font-mono text-sm" : ""}`}>{value}</dd>
    </div>
  );
}

function ModeTab({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`checkout-mode-tab rounded-full px-4 py-2 text-sm font-semibold ${
        active ? "checkout-mode-tab--active" : ""
      }`}
    >
      {label}
    </button>
  );
}

function TerminalState({ statusLabel, paid }: { statusLabel: string; paid: boolean }) {
  return (
    <div className="flex min-h-[16rem] flex-col items-center justify-center text-center">
      <CheckCircle2
        className={`h-12 w-12 ${paid ? "text-emerald-600 dark:text-emerald-400" : "text-muted"}`}
      />
      <p className="mt-4 font-display text-lg font-semibold">{statusLabel}</p>
      <p className="mt-2 text-sm checkout-row-label">
        {paid ? "Bạn có thể quay lại website merchant." : "Giao dịch đã kết thúc."}
      </p>
    </div>
  );
}

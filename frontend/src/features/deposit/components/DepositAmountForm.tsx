import { ArrowRight, Info, LoaderCircle, XCircle } from "lucide-react";
import clsx from "../../../shared/lib/clsx";
import { formatCountdown, formatCurrency, formatDigitInput, parseDigitInput } from "../../../shared/lib/format";
import BankInfoLine from "./BankInfoLine";
import DepositStatusBadge from "./DepositStatusBadge";
import QrFrame from "./QrFrame";
import type {
  DepositQrConfigResponse,
  NormalizedDepositStatus,
} from "../types";

const QUICK_AMOUNTS = [10_000, 20_000, 500_000, 1_000_000, 10_000_000];

interface Props {
  amount: number;
  setAmount: (value: number) => void;
  customAmount: string;
  setCustomAmount: (value: string) => void;

  qrImageUrl: string | null;
  depositCode: string | null;
  depositStatus: NormalizedDepositStatus | null;
  depositRemainingSeconds: number | null;
  depositError: string | null;
  depositQrConfig: DepositQrConfigResponse | null;

  isCreatingDeposit: boolean;
  isCancellingDeposit: boolean;
  onCreate: () => void;
  onCancel: () => void;
}

export default function DepositAmountForm({
  amount,
  setAmount,
  customAmount,
  setCustomAmount,
  qrImageUrl,
  depositCode,
  depositStatus,
  depositRemainingSeconds,
  depositError,
  depositQrConfig,
  isCreatingDeposit,
  isCancellingDeposit,
  onCreate,
  onCancel,
}: Props) {
  return (
    <section className="glass rounded-2xl p-6 sm:p-7">
      <h3 className="font-display text-base font-semibold text-ink">Số tiền nạp</h3>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        {QUICK_AMOUNTS.map((value) => {
          const isActive = customAmount.trim().length === 0 && amount === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => {
                setAmount(value);
                setCustomAmount("");
              }}
              className={clsx(
                "rounded-xl border py-3 text-sm font-semibold transition-all duration-200",
                isActive
                  ? "border-primary/50 bg-primary/15 text-primary shadow-soft"
                  : "border-hairline bg-fill-subtle text-ink hover:border-primary/30 hover:bg-fill-subtle",
              )}
            >
              {formatCurrency(value, "")}
            </button>
          );
        })}
      </div>

      <div className="mt-6 space-y-2">
        <label className="block text-xs font-semibold text-muted" htmlFor="custom-amount">
          Hoặc nhập số tiền khác
        </label>
        <div className="relative">
          <input
            id="custom-amount"
            type="text"
            inputMode="numeric"
            value={formatDigitInput(customAmount)}
            onChange={(e) => setCustomAmount(parseDigitInput(e.target.value))}
            placeholder="VND"
            className="h-14 w-full rounded-xl border border-primary/40 bg-fill-subtle px-4 pr-12 text-right text-lg font-semibold text-ink outline-none placeholder:text-muted-soft focus:border-primary focus:bg-fill-muted focus:ring-2 focus:ring-primary/20"
          />
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-lg font-bold text-primary">
            ₫
          </span>
        </div>
        <p className="flex items-center gap-1 text-xs text-primary/80">
          <Info className="h-3.5 w-3.5" />
          Tối thiểu 10.000đ
        </p>
      </div>

      <button
        type="button"
        onClick={onCreate}
        disabled={isCreatingDeposit}
        className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-gradient-primary text-base font-semibold text-on-primary shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elevated active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:translate-y-0"
      >
        {isCreatingDeposit ? "Đang tạo mã QR..." : "Tiếp tục nạp tiền"}
        {isCreatingDeposit ? (
          <LoaderCircle className="h-5 w-5 animate-spin" />
        ) : (
          <ArrowRight className="h-5 w-5" />
        )}
      </button>

      {depositError ? (
        <p className="mt-3 text-sm font-medium text-rose-600 dark:text-rose-400">{depositError}</p>
      ) : null}

      {qrImageUrl && depositCode ? (
        <div className="mt-6 rounded-2xl border border-hairline bg-fill-subtle p-5">
          <p className="text-sm font-semibold text-ink">
            Mã nạp: <span className="text-primary">{depositCode}</span>
          </p>
          <p className="mt-1 text-xs text-muted">
            Giữ nguyên nội dung chuyển khoản khi thanh toán.
          </p>
          {depositStatus === "Pending" ? (
            <p className="mt-1 text-xs font-semibold text-primary">
              Thời gian còn lại: {formatCountdown(depositRemainingSeconds)}
            </p>
          ) : null}

          <div className="mt-4 flex justify-center">
            <QrFrame src={qrImageUrl} alt="Mã QR nạp tiền" size="md" />
          </div>

          {depositQrConfig ? <BankInfoLine config={depositQrConfig} /> : null}

          {depositStatus ? (
            depositStatus === "Pending" ? (
              <div className="mt-4 flex items-stretch gap-3">
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={isCancellingDeposit}
                  className="flex basis-1/3 items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm font-semibold text-rose-600 dark:text-rose-400 transition-colors hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <XCircle className="h-4 w-4" />
                  {isCancellingDeposit ? "Đang hủy..." : "Hủy giao dịch"}
                </button>
                <div className="flex basis-2/3 items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-sm font-semibold text-primary">
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Đang chờ thanh toán
                </div>
              </div>
            ) : (
              <DepositStatusBadge status={depositStatus} />
            )
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

import type { PlatformGlobalConfig } from "../types";
import { formatWebhookRetryPolicy } from "../lib/platformGlobal";

interface Props {
  global?: PlatformGlobalConfig;
}

export default function DocsWebhookSection({ global }: Props) {
  const retry = formatWebhookRetryPolicy(global);

  return (
    <section className="space-y-5">
      <div>
        <h2 className="font-display text-xl font-semibold text-ink">Webhook</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Cấu hình webhook URL trong project để nhận thông báo khi payment đổi trạng thái.
          VexPay gửi POST tới URL của bạn với payload JSON (snake_case).
        </p>
      </div>

      <div className="docs-panel rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-ink">Giao hàng &amp; thử lại</h3>
        <ul className="mt-3 space-y-2 text-sm text-muted">
          <li>
            Server merchant phải trả <strong className="text-ink">HTTP 200–299</strong> thì VexPay coi là giao thành công cho một lần gửi.
          </li>
          <li>
            Trong cấu hình project, tắt <strong className="text-ink">Thử lại khi webhook lỗi</strong>: chỉ gửi <strong className="text-ink">một lần</strong> (lỗi được ghi log, không retry).
          </li>
          <li>{retry.docsRetryLine}</li>
        </ul>
      </div>

      <div className="docs-panel rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-ink">Sự kiện</h3>
        <ul className="mt-3 space-y-2 text-sm text-muted">
          <li><code className="rounded bg-fill-subtle px-1.5 py-0.5 font-mono text-xs text-ink">payment_paid</code> — khách đã thanh toán thành công</li>
          <li><code className="rounded bg-fill-subtle px-1.5 py-0.5 font-mono text-xs text-ink">payment_failed</code> — chuyển sai số tiền hoặc không khớp yêu cầu</li>
          <li><code className="rounded bg-fill-subtle px-1.5 py-0.5 font-mono text-xs text-ink">payment_expired</code> — hết thời gian chờ thanh toán</li>
          <li><code className="rounded bg-fill-subtle px-1.5 py-0.5 font-mono text-xs text-ink">payment_cancelled</code> — merchant hủy payment (POST /v1/payments/&#123;id&#125;/cancel)</li>
        </ul>
      </div>

      <div className="docs-panel-muted rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-ink">Payload mẫu</h3>
        <pre className="docs-code-block mt-3 overflow-x-auto rounded-xl p-4 text-xs">
{`{
  "event": "payment_paid",
  "created_at": "2026-05-14T01:00:00Z",
  "data": {
    "id": "pi_abc123",
    "project_id": "proj_xyz",
    "merchant_ref": "ORDER-2026-001",
    "amount": 50000,
    "currency": "VND",
    "status": "Paid",
    "method": "BankTransfer",
    "transfer_code": "VP123456",
    "description": "Thanh toán đơn hàng #001",
    "paid_at": "2026-05-14T01:00:05Z"
  }
}`}
        </pre>
      </div>

      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
        <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300">Bảo mật webhook</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Nếu bật webhook secret trong project, VexPay gửi kèm header{" "}
          <code className="rounded bg-fill-subtle px-1 font-mono text-xs text-ink">api-key</code>{" "}
          với giá trị secret bạn cấu hình. Xác minh header này trước khi xử lý payload.
        </p>
      </div>
    </section>
  );
}

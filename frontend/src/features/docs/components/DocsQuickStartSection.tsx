import { API_BASE_URL } from "../../../shared/config/api";

const STEPS = [
  {
    title: "Đăng ký developer & tạo project",
    body: "Gửi yêu cầu developer trong dashboard, sau khi được duyệt tạo project và cấu hình webhook URL (tùy chọn).",
  },
  {
    title: "Phát hành API key",
    body: "Trong project, tạo API key (live/test). Lưu key ngay khi hiển thị — hệ thống chỉ lưu hash.",
  },
  {
    title: "Tạo payment intent",
    body: "Gọi POST /v1/payments với amount và merchant_ref. Nhận transfer_code + qr_image_url để hiển thị cho khách.",
  },
  {
    title: "Theo dõi trạng thái",
    body: "Poll GET /v1/payments/{id} hoặc nhận webhook payment_paid khi khách chuyển khoản thành công.",
  },
  {
    title: "Hủy giao dịch (tùy chọn)",
    body: "Khi method = BankTransfer (0), merchant tự UI nút hủy và gọi POST /v1/payments/{id}/cancel. Nhận payment status = Cancelled và webhook payment_cancelled.",
  },
];

export default function DocsQuickStartSection() {
  return (
    <section className="space-y-5">
      <div>
        <h2 className="font-display text-xl font-semibold text-ink">Bắt đầu nhanh</h2>
        <p className="mt-2 text-sm text-muted">Luồng tích hợp cơ bản cho thanh toán chuyển khoản ngân hàng.</p>
      </div>

      <ol className="space-y-4">
        {STEPS.map((step, index) => (
          <li key={step.title} className="docs-panel flex gap-4 rounded-2xl p-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/12 text-sm font-bold text-primary">
              {index + 1}
            </span>
            <div>
              <h3 className="font-medium text-ink">{step.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="docs-panel-muted rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-ink">Request mẫu</h3>
        <pre className="docs-code-block mt-3 overflow-x-auto rounded-xl p-4 text-xs">
{`POST ${API_BASE_URL}/v1/payments
X-API-Key: vx_live_your_api_key
Content-Type: application/json

{
  "amount": 50000,
  "merchantRef": "ORDER-2026-001",
  "description": "Thanh toán đơn hàng #001",
  "expiresInSeconds": 900
}`}
        </pre>
      </div>
    </section>
  );
}

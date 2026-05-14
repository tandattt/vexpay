import { BadgePercent, ChevronRight, Headphones, HelpCircle } from "lucide-react";

export default function DepositSidebar() {
  return (
    <div className="col-span-12 space-y-5 lg:col-span-4">
      <section className="glass rounded-2xl p-6">
        <div className="mb-5 flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-primary" />
          <h3 className="font-display text-base font-semibold text-ink">Hướng dẫn nạp tiền</h3>
        </div>
        <ol className="space-y-4">
          <Step
            index={1}
            title="Chọn số tiền"
            detail="Chọn một trong các mức nạp nhanh hoặc nhập số tiền cụ thể bạn muốn nạp vào tài khoản."
          />
          <Step
            index={2}
            title="Quét mã QR"
            detail="Sử dụng ứng dụng Ngân hàng hoặc Ví điện tử của bạn để quét mã QR được hiển thị ở bước tiếp theo."
          />
          <Step
            index={3}
            title="Xác nhận giao dịch"
            detail="Sau khi thanh toán thành công trên ứng dụng ngân hàng, hệ thống sẽ tự động cập nhật số dư cho bạn."
          />
        </ol>
      </section>

      <section className="glass relative overflow-hidden rounded-2xl p-6">
        <div className="relative z-10">
          <h4 className="font-display text-base font-semibold text-gradient">Nạp tiền nhận ưu đãi</h4>
          <p className="mt-2 text-sm text-muted">
            Hoàn tiền 1% cho mỗi giao dịch nạp tiền qua QR Code đầu tiên trong tháng.
          </p>
          <button className="mt-4 rounded-xl bg-gradient-primary px-4 py-2 text-sm font-semibold text-on-primary shadow-soft transition-all hover:-translate-y-0.5">
            Tìm hiểu thêm
          </button>
        </div>
        <BadgePercent className="pointer-events-none absolute -bottom-6 -right-6 h-36 w-36 text-primary/10" />
      </section>

      <section className="glass flex items-center justify-between rounded-2xl p-4 transition-all hover:border-primary/30">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <Headphones className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-ink">Cần hỗ trợ?</p>
            <p className="text-xs text-muted">Liên hệ chúng tôi 24/7</p>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-primary" />
      </section>
    </div>
  );
}

function Step({ index, title, detail }: { index: number; title: string; detail: string }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-primary text-xs font-bold text-on-primary shadow-soft">
        {index}
      </span>
      <div>
        <p className="text-sm font-semibold text-ink">{title}</p>
        <p className="mt-0.5 text-xs text-muted">{detail}</p>
      </div>
    </li>
  );
}

import { Shield } from "lucide-react";
import LoginForm from "../components/LoginForm";
import type { LoginResponse } from "../types";
import ThemeToggle from "../../../shared/components/ui/ThemeToggle";

interface LoginPageProps {
  onSuccess: (response: LoginResponse) => void;
}

export default function LoginPage({ onSuccess }: LoginPageProps) {
  return (
    <div className="bg-mesh relative flex min-h-screen items-center justify-center px-4 py-10">
      <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>

      <div className="glass relative z-10 grid w-full max-w-5xl overflow-hidden rounded-2xl shadow-elevated lg:grid-cols-2">
        <BrandPanel />
        <div className="flex flex-col justify-center px-6 py-10 sm:px-10">
          <div className="mx-auto w-full max-w-sm">
            <div className="mb-6 flex items-center gap-2 lg:hidden">
              <img src="/logo.png" alt="VexPay" className="h-10 w-10" />
              <span className="font-display text-lg font-bold text-ink">VexPay</span>
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              Đăng nhập
            </p>
            <h2 className="mt-2 font-display text-2xl font-bold text-ink sm:text-3xl">
              Chào mừng trở lại
            </h2>
            <p className="mt-2 text-sm text-muted">
              Nhập thông tin tài khoản VexPay để tiếp tục.
            </p>

            <LoginForm onSuccess={onSuccess} />

            <p className="mt-6 text-center text-xs text-muted">
              Chưa có tài khoản?{" "}
              <button className="font-semibold text-primary hover:text-accent">
                Liên hệ quản trị viên
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function BrandPanel() {
  return (
    <div className="relative hidden flex-col justify-between overflow-hidden p-10 lg:flex">
      <div className="absolute inset-0 bg-brand-panel" />
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-40" />
      <div className="relative z-10 flex items-center gap-3">
        <img src="/logo.png" alt="VexPay" className="h-14 w-14 object-contain" />
        <div>
          <p className="font-display text-xl font-bold text-ink">VexPay</p>
          <p className="text-xs text-muted">Corporate payment platform</p>
        </div>
      </div>

      <div className="relative z-10 space-y-5">
        <h1 className="font-display text-3xl font-bold leading-tight text-ink">
          Nhận thanh toán, quản lý ví và kết nối dịch vụ{" "}
          <span className="text-gradient">dễ dàng hơn.</span>
        </h1>
        <p className="text-sm text-muted">
          VexPay giúp người dùng quản lý ví, nhà phát triển tích hợp thanh toán vào dự án,
          và chủ shop nhận thông báo giao dịch tức thì.
        </p>
        <ul className="space-y-3 text-sm text-muted">
          <li className="flex items-center gap-3 rounded-xl border border-hairline bg-fill-subtle px-4 py-3">
            <Shield className="h-4 w-4 shrink-0 text-primary" />
            Đăng nhập an toàn, phiên làm việc được tự động duy trì
          </li>
          <li className="flex items-center gap-3 rounded-xl border border-hairline bg-fill-subtle px-4 py-3">
            <Shield className="h-4 w-4 shrink-0 text-secondary" />
            Dành cho người dùng ví, developer và cửa hàng
          </li>
        </ul>
      </div>

      <p className="relative z-10 text-xs text-muted-soft">© 2026 VexPay · Three Hutech</p>
    </div>
  );
}

import { FormEvent, useState } from "react";
import { Eye, EyeOff, Lock, Shield, User } from "lucide-react";
import { login } from "../api/auth";
import { HttpError } from "../api/client";
import type { LoginResponse } from "../types";

interface Props {
  onSuccess: (response: LoginResponse) => void;
}

export default function LoginPage({ onSuccess }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (loading) return;

    setError(null);
    setLoading(true);
    try {
      const response = await login({ username: username.trim(), password });
      onSuccess(response);
    } catch (err) {
      const message =
        err instanceof HttpError
          ? err.message
          : "Đăng nhập thất bại. Vui lòng thử lại.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-canvas px-4 py-10">
      {/* Ambient gradient orbs */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-80 w-80 rounded-full bg-primary/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-secondary/25 blur-3xl" />

      <div className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-3xl border border-hairline bg-card shadow-card lg:grid-cols-2">
        {/* Left: brand panel */}
        <div className="relative hidden flex-col justify-between bg-gradient-to-br from-primary to-secondary p-10 text-white lg:flex">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="VexPay"
              className="h-16 w-16 object-contain"
            />
            <div>
              <p className="text-lg font-bold">VexPay</p>
              <p className="text-xs text-white/70">Corporate payment platform</p>
            </div>
          </div>

          <div className="space-y-5">
            <h1 className="text-3xl font-bold leading-tight">
              Nhận thanh toán, quản lý ví và kết nối dịch vụ cho cửa hàng dễ dàng hơn.
            </h1>
            <p className="text-sm text-white/80">
              VexPay giúp người dùng quản lý ví, nhà phát triển tích hợp thanh toán vào dự án,
              và chủ shop nhận thông báo giao dịch tức thì.
            </p>
            <ul className="space-y-2 text-sm text-white/85">
              <li className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Đăng nhập an toàn, phiên làm việc được tự động duy trì
              </li>
              <li className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Dành cho người dùng ví, developer và cửa hàng
              </li>
            </ul>
          </div>

          <p className="text-xs text-white/60">© 2026 VexPay. Three Hutech.</p>
        </div>

        {/* Right: form */}
        <div className="flex flex-col justify-center px-6 py-10 sm:px-10">
          <div className="mx-auto w-full max-w-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              Đăng nhập
            </p>
            <h2 className="mt-2 text-2xl font-bold text-ink sm:text-[28px]">
              Chào mừng trở lại
            </h2>
            <p className="mt-2 text-sm text-muted">
              Nhập thông tin tài khoản VexPay để tiếp tục.
            </p>

            <form onSubmit={handleSubmit} className="mt-7 space-y-4" noValidate>
              <div>
                <label
                  htmlFor="username"
                  className="text-xs font-semibold text-ink"
                >
                  Tên đăng nhập
                </label>
                <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-hairline bg-canvas/60 px-3 transition-colors focus-within:border-primary focus-within:bg-card focus-within:ring-4 focus-within:ring-primary/10">
                  <User className="h-4 w-4 text-muted" />
                  <input
                    id="username"
                    type="text"
                    autoComplete="username"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="h-11 w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted"
                    placeholder="admin"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="text-xs font-semibold text-ink"
                  >
                    Mật khẩu
                  </label>
                  <button
                    type="button"
                    className="text-[11px] font-semibold text-primary hover:underline"
                  >
                    Quên mật khẩu?
                  </button>
                </div>
                <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-hairline bg-canvas/60 px-3 transition-colors focus-within:border-primary focus-within:bg-card focus-within:ring-4 focus-within:ring-primary/10">
                  <Lock className="h-4 w-4 text-muted" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="rounded-md p-1 text-muted hover:text-ink"
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {error ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-primary to-secondary text-sm font-semibold text-white shadow-soft transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {loading ? "Đang đăng nhập..." : "Đăng nhập"}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-muted">
              Chưa có tài khoản?{" "}
              <button className="font-semibold text-primary hover:underline">
                Liên hệ quản trị viên
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

import { FormEvent, useState } from "react";
import { Eye, EyeOff, Lock, User } from "lucide-react";
import { HttpError } from "../../../shared/api";
import { Button, TextField } from "../../../shared/components/ui";
import { login } from "../api";
import type { LoginResponse } from "../types";

interface LoginFormProps {
  onSuccess: (response: LoginResponse) => void;
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
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
        err instanceof HttpError ? err.message : "Đăng nhập thất bại. Vui lòng thử lại.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-7 space-y-4" noValidate>
      <TextField
        label="Tên đăng nhập"
        id="username"
        type="text"
        autoComplete="username"
        required
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="admin"
        leftIcon={<User className="h-4 w-4" />}
      />

      <TextField
        label="Mật khẩu"
        id="password"
        type={showPassword ? "text" : "password"}
        autoComplete="current-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
        leftIcon={<Lock className="h-4 w-4" />}
        rightSlot={
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="rounded-md p-1 text-muted hover:text-ink"
            aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        }
      />

      {error ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400">
          {error}
        </div>
      ) : null}

      <Button
        type="submit"
        variant="gradient"
        size="md"
        loading={loading}
        className="mt-2 w-full"
      >
        {loading ? "Đang đăng nhập..." : "Đăng nhập"}
      </Button>
    </form>
  );
}

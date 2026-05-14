const currencyFormatter = new Intl.NumberFormat("vi-VN");

export function formatCurrency(value: number, suffix = "đ") {
  return `${currencyFormatter.format(value)}${suffix}`;
}

export function formatDateTime(value: string | number | Date) {
  return new Date(value).toLocaleString("vi-VN");
}

export function formatDate(value: string | number | Date) {
  return new Date(value).toLocaleDateString("vi-VN");
}

export function formatCountdown(seconds: number | null) {
  if (seconds === null) return null;
  const safe = Math.max(seconds, 0);
  const minutes = Math.floor(safe / 60);
  const remainder = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

/** Chỉ giữ chữ số — dùng làm state nội bộ cho ô nhập tiền. */
export function parseDigitInput(value: string): string {
  return value.replace(/\D/g, "");
}

/** Hiển thị nhóm 3 chữ số bằng dấu chấm (VD: 1000000 → 1.000.000). */
export function formatDigitInput(value: string): string {
  const digits = parseDigitInput(value);
  if (!digits) return "";
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function getInitials(name: string, fallback = "U") {
  return (
    name
      .split(" ")
      .map((part) => part.charAt(0))
      .slice(0, 2)
      .join("")
      .toUpperCase() || fallback
  );
}

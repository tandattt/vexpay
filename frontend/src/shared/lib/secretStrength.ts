export type SecretStrengthLevel = 0 | 1 | 2 | 3 | 4;

export interface SecretStrengthResult {
  level: SecretStrengthLevel;
  label: string;
  percent: number;
  barClass: string;
  textClass: string;
}

const LEVELS: Omit<SecretStrengthResult, "level" | "percent">[] = [
  {
    label: "Rất yếu",
    barClass: "bg-rose-500",
    textClass: "text-rose-600 dark:text-rose-400",
  },
  {
    label: "Yếu",
    barClass: "bg-rose-400",
    textClass: "text-rose-600 dark:text-rose-400",
  },
  {
    label: "Trung bình",
    barClass: "bg-amber-500",
    textClass: "text-amber-700 dark:text-amber-300",
  },
  {
    label: "Mạnh",
    barClass: "bg-emerald-500",
    textClass: "text-emerald-600 dark:text-emerald-400",
  },
  {
    label: "Rất mạnh",
    barClass: "bg-emerald-400",
    textClass: "text-emerald-600 dark:text-emerald-400",
  },
];

export function scoreSecretStrength(value: string): SecretStrengthResult | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  let points = 0;
  if (trimmed.length >= 8) points += 1;
  if (trimmed.length >= 12) points += 1;
  if (trimmed.length >= 20) points += 1;
  if (/[a-z]/.test(trimmed) && /[A-Z]/.test(trimmed)) points += 1;
  if (/\d/.test(trimmed)) points += 1;
  if (/[^a-zA-Z0-9]/.test(trimmed)) points += 1;

  const level = Math.min(4, Math.max(0, Math.floor(points / 1.4))) as SecretStrengthLevel;
  const meta = LEVELS[level];

  return {
    level,
    label: meta.label,
    percent: 20 + level * 20,
    barClass: meta.barClass,
    textClass: meta.textClass,
  };
}

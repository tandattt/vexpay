import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../theme";

interface ThemeToggleProps {
  className?: string;
}

export default function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
      aria-label={isDark ? "Bật light mode" : "Bật dark mode"}
      className={
        className ??
        "inline-flex h-9 w-9 items-center justify-center rounded-xl border border-hairline bg-fill-subtle text-muted transition-colors hover:border-primary/30 hover:text-primary"
      }
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

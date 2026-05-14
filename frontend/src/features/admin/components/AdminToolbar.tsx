import { RefreshCw, Search } from "lucide-react";

interface Props {
  title: string;
  query: string;
  onQueryChange: (value: string) => void;
  placeholder: string;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export default function AdminToolbar({
  title,
  query,
  onQueryChange,
  placeholder,
  onRefresh,
  isRefreshing,
}: Props) {
  return (
    <div className="flex flex-col gap-4 border-b border-hairline px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-full min-w-0 items-center rounded-xl border border-hairline bg-fill-subtle px-4 sm:w-72">
          <Search className="mr-2 h-4 w-4 text-muted" />
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            className="min-w-0 flex-1 border-none bg-transparent text-sm text-ink outline-none placeholder:text-muted-soft focus:ring-0"
            placeholder={placeholder}
            type="search"
          />
        </div>
        <button
          type="button"
          disabled={isRefreshing}
          onClick={onRefresh}
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-gradient-primary px-4 text-sm font-semibold text-on-primary shadow-soft transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          {isRefreshing ? "Đang tải" : "Làm mới"}
        </button>
      </div>
    </div>
  );
}

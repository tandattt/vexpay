import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  label?: React.ReactNode;
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageSizeChange?: (size: number) => void;
}

export default function Pagination({
  page,
  totalPages,
  onChange,
  label,
  pageSize,
  pageSizeOptions,
  onPageSizeChange,
}: PaginationProps) {
  const showPageSize = pageSize !== undefined && pageSizeOptions && onPageSizeChange;
  return (
    <div className="mt-8 flex flex-col items-center justify-between gap-4 sm:flex-row">
      <div className="flex items-center gap-3 text-sm text-muted">
        {label}
        {showPageSize ? (
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange!(Number(e.target.value))}
            className="pagination-select rounded-lg px-2 py-1 text-sm font-medium outline-none focus:border-primary/50"
          >
            {pageSizeOptions!.map((size) => (
              <option key={size} value={size}>
                {size} / page
              </option>
            ))}
          </select>
        ) : null}
      </div>
      <div className="pagination-bar inline-flex items-center rounded-xl p-1">
        <button
          type="button"
          disabled={page <= 1}
          className="pagination-btn inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink transition-colors hover:bg-fill-muted disabled:cursor-not-allowed disabled:text-muted-soft"
          onClick={() => onChange(1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          disabled={page <= 1}
          className="pagination-btn rounded-lg px-4 py-2 text-sm font-semibold text-muted transition-colors hover:bg-fill-muted hover:text-ink disabled:cursor-not-allowed disabled:text-muted-soft"
          onClick={() => onChange(page - 1)}
        >
          Trước
        </button>
        <div className="flex items-center px-4 py-2 text-sm">
          <span className="font-bold text-primary">{totalPages === 0 ? 0 : page}</span>
          <span className="mx-1 text-muted-soft">/</span>
          <span className="font-medium text-muted">{totalPages}</span>
        </div>
        <button
          type="button"
          disabled={page >= totalPages}
          className="pagination-btn rounded-lg px-4 py-2 text-sm font-semibold text-muted transition-colors hover:bg-fill-muted hover:text-ink disabled:cursor-not-allowed disabled:text-muted-soft"
          onClick={() => onChange(page + 1)}
        >
          Sau
        </button>
        <button
          type="button"
          disabled={page >= totalPages}
          className="pagination-btn inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink transition-colors hover:bg-fill-muted disabled:cursor-not-allowed disabled:text-muted-soft"
          onClick={() => onChange(totalPages)}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

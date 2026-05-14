import clsx from "../../lib/clsx";
import DataTable from "./Table";
import Skeleton from "./Skeleton";

/** Matches typical formatted VND balance width in header */
export function BalanceBadgeSkeleton() {
  return (
    <span className="inline-flex min-h-4 min-w-[7.5rem] items-center">
      <Skeleton className="h-4 w-full max-w-[7.5rem]" rounded="md" />
    </span>
  );
}

export function AdminSummaryCardsSkeleton() {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="glass min-h-[8.75rem] rounded-2xl p-5">
          <Skeleton className="mb-4 h-10 w-10 shrink-0 rounded-xl border border-hairline" rounded="xl" />
          <Skeleton className="mb-1 h-2.5 w-20" rounded="full" />
          <Skeleton className="h-8 w-28" rounded="md" />
        </div>
      ))}
    </section>
  );
}

interface AdminTableSkeletonProps {
  title: string;
  headers: string[];
  rowCount?: number;
  depositsUserColumn?: boolean;
}

export function AdminTableSkeleton({
  title,
  headers,
  rowCount = 10,
  depositsUserColumn = false,
}: AdminTableSkeletonProps) {
  return (
    <div className="space-y-8">
      <section className="glass overflow-hidden rounded-2xl">
        <div className="flex flex-col gap-4 border-b border-hairline px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
          <div className="flex w-full items-center gap-3 sm:w-auto">
            <Skeleton className="h-10 w-full sm:w-72" rounded="xl" />
            <Skeleton className="h-10 w-[7.25rem] shrink-0" rounded="xl" />
          </div>
        </div>
        <TableBodySkeleton
          headers={headers}
          rowCount={rowCount}
          depositsUserColumn={depositsUserColumn}
        />
      </section>
      <AdminPaginationSkeleton />
    </div>
  );
}

export function AdminPaginationSkeleton() {
  return (
    <div className="mt-8 flex flex-col items-center justify-between gap-4 sm:flex-row">
      <div className="flex items-center gap-3">
        <Skeleton className="h-4 w-40" rounded="md" />
        <Skeleton className="h-8 w-24" rounded="lg" />
      </div>
      <Skeleton className="h-11 w-64" rounded="xl" />
    </div>
  );
}

interface TableBodySkeletonProps {
  headers: string[];
  rowCount?: number;
  cellClassName?: string;
  depositsUserColumn?: boolean;
}

export function TableBodySkeleton({
  headers,
  rowCount = 10,
  cellClassName = "px-6 py-4",
  depositsUserColumn = false,
}: TableBodySkeletonProps) {
  return (
    <DataTable headers={headers}>
      {Array.from({ length: rowCount }).map((_, rowIndex) => (
        <tr key={rowIndex} className="h-[4.5rem]">
          {headers.map((header, colIndex) => (
            <td key={`${header}-${colIndex}`} className={cellClassName}>
              {depositsUserColumn && colIndex === 1 ? (
                <div className="flex items-center">
                  <Skeleton className="mr-3 h-8 w-8 shrink-0" rounded="lg" />
                  <Skeleton className="h-4 w-24" rounded="md" />
                </div>
              ) : colIndex === headers.length - 1 ? (
                <Skeleton className="ml-auto h-8 w-20" rounded="lg" />
              ) : colIndex === 2 && headers.includes("Amount") ? (
                <Skeleton className="h-4 w-20" rounded="md" />
              ) : colIndex === 3 && headers.includes("Status") ? (
                <Skeleton className="mx-auto h-6 w-20" rounded="full" />
              ) : (
                <Skeleton
                  className={clsx("h-4", colIndex === 0 ? "w-28" : "w-24")}
                  rounded="md"
                />
              )}
            </td>
          ))}
        </tr>
      ))}
    </DataTable>
  );
}

export function DepositHistoryTableSkeleton({ rowCount = 5 }: { rowCount?: number }) {
  return (
    <>
      {Array.from({ length: rowCount }).map((_, i) => (
        <tr key={i} className="h-[3.25rem]">
          <td className="px-4 py-3">
            <Skeleton className="h-4 w-28" rounded="md" />
          </td>
          <td className="px-4 py-3">
            <Skeleton className="h-4 w-24" rounded="md" />
          </td>
          <td className="px-4 py-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-20" rounded="full" />
              <Skeleton className="h-4 w-10" rounded="md" />
            </div>
          </td>
          <td className="px-4 py-3">
            <Skeleton className="h-4 w-16" rounded="md" />
          </td>
          <td className="px-4 py-3 text-right">
            <Skeleton className="ml-auto h-4 w-4" rounded="md" />
          </td>
        </tr>
      ))}
    </>
  );
}

export function ProjectCardSkeleton() {
  return (
    <div className="min-h-[6.75rem] rounded-xl border border-hairline bg-fill-subtle px-4 py-3">
      <div className="flex items-start justify-between gap-2">
        <Skeleton className="h-4 w-[55%] max-w-[9rem]" rounded="md" />
        <div className="flex shrink-0 gap-1">
          <Skeleton className="h-5 w-14" rounded="full" />
        </div>
      </div>
      <Skeleton className="mt-1 h-3 w-[70%] max-w-[11rem]" rounded="md" />
      <div className="mt-4 flex min-h-[1rem] items-center justify-between">
        <Skeleton className="h-3 w-20" rounded="md" />
        <Skeleton className="invisible h-3 w-16" rounded="md" aria-hidden />
      </div>
    </div>
  );
}

export function ProjectListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <ProjectCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function DeveloperRequestSkeleton() {
  return (
    <div className="mt-5 min-h-[2.5rem]">
      <Skeleton className="h-10 w-full max-w-xs" rounded="xl" />
    </div>
  );
}

export function ProjectStatCardSkeleton({ withHint = false }: { withHint?: boolean }) {
  return (
    <div className="min-h-[5.5rem] rounded-xl border border-hairline bg-fill-subtle p-3">
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4 shrink-0" rounded="md" />
        <Skeleton className="h-3 w-24" rounded="full" />
      </div>
      <Skeleton className="mt-2 h-7 w-28" rounded="md" />
      {withHint ? (
        <Skeleton className="mt-0.5 h-3 w-32" rounded="full" />
      ) : (
        <span className="mt-0.5 block h-3" aria-hidden />
      )}
    </div>
  );
}

export function ProjectStatsCardsSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <ProjectStatCardSkeleton />
      <ProjectStatCardSkeleton withHint />
      <ProjectStatCardSkeleton />
      <ProjectStatCardSkeleton withHint />
    </div>
  );
}

export function ProjectPaymentRowSkeleton() {
  return (
    <li className="dev-payment-row flex min-h-[3.75rem] flex-col gap-1 rounded-lg px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-4 w-28" rounded="md" />
          <Skeleton className="h-5 w-16" rounded="full" />
        </div>
        <Skeleton className="mt-0.5 h-3 w-44" rounded="md" />
      </div>
      <Skeleton className="h-4 w-24 shrink-0" rounded="md" />
    </li>
  );
}

export function ProjectPaymentsListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <ul className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <ProjectPaymentRowSkeleton key={i} />
      ))}
    </ul>
  );
}

export function ApiKeyRowSkeleton() {
  return (
    <li className="flex min-h-[5.5rem] min-w-0 flex-col gap-2 rounded-xl border border-hairline bg-fill-subtle p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-4 w-32" rounded="md" />
          <Skeleton className="h-5 w-14" rounded="full" />
        </div>
        <Skeleton className="mt-1 h-3 w-44" rounded="md" />
        <Skeleton className="mt-1 h-3 w-56" rounded="md" />
      </div>
      <Skeleton className="h-9 w-24 shrink-0" rounded="lg" />
    </li>
  );
}

export function ApiKeysListSkeleton({ count = 2 }: { count?: number }) {
  return (
    <ul className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <ApiKeyRowSkeleton key={i} />
      ))}
    </ul>
  );
}

export function QrFrameSkeleton({ size = "sm" }: { size?: "sm" | "md" }) {
  const dim = size === "sm" ? "h-48 w-48" : "h-64 w-64";
  return (
    <div className={clsx("qr-scan-frame", dim)}>
      <span className="qr-scan-corner tl" />
      <span className="qr-scan-corner tr" />
      <span className="qr-scan-corner bl" />
      <span className="qr-scan-corner br" />
      <Skeleton className="h-full w-full rounded-xl" rounded="xl" />
    </div>
  );
}


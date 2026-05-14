import clsx from "../../lib/clsx";

interface DataTableProps {
  headers: (string | { label: string; align?: "left" | "center" | "right" })[];
  children: React.ReactNode;
  className?: string;
}

export default function DataTable({ headers, children, className }: DataTableProps) {
  return (
    <div className={clsx("overflow-x-auto", className)}>
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-hairline bg-fill-subtle text-[11px] font-semibold uppercase tracking-wider text-muted">
            {headers.map((header, index) => {
              const label = typeof header === "string" ? header : header.label;
              const align =
                typeof header === "string"
                  ? index === headers.length - 1
                    ? "right"
                    : "left"
                  : (header.align ?? "left");
              return (
                <th
                  key={`${label}-${index}`}
                  className={clsx(
                    "px-6 py-4",
                    align === "center" && "text-center",
                    align === "right" && "text-right",
                  )}
                >
                  {label}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-hairline">{children}</tbody>
      </table>
    </div>
  );
}

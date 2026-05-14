import { Pagination } from "../../../shared/components/ui";
import type { AdminPageSize } from "../types";

interface Props {
  label: string;
  page: number;
  totalPages: number;
  pageSize: AdminPageSize;
  pageSizeOptions: AdminPageSize[];
  onChange: (page: number) => void;
  onPageSizeChange: (size: AdminPageSize) => void;
}

export default function AdminPaginationBar({
  label,
  page,
  totalPages,
  pageSize,
  pageSizeOptions,
  onChange,
  onPageSizeChange,
}: Props) {
  return (
    <Pagination
      label={label}
      page={page}
      totalPages={totalPages}
      pageSize={pageSize}
      pageSizeOptions={pageSizeOptions as unknown as number[]}
      onPageSizeChange={(value) => onPageSizeChange(value as AdminPageSize)}
      onChange={onChange}
    />
  );
}

import type { SchemaFieldRow } from "../lib/openapi";
import EnumValueList from "./EnumValueList";

interface Props {
  fields: SchemaFieldRow[];
}

export default function SchemaFieldsTable({ fields }: Props) {
  return (
    <div className="docs-table-shell overflow-hidden rounded-xl">
      <table className="docs-table w-full text-left text-sm">
        <thead className="text-xs uppercase tracking-wide">
          <tr>
            <th className="px-3 py-2 font-medium">Trường</th>
            <th className="px-3 py-2 font-medium">Kiểu</th>
            <th className="px-3 py-2 font-medium">Bắt buộc</th>
            <th className="px-3 py-2 font-medium">Mô tả</th>
          </tr>
        </thead>
        <tbody>
          {fields.map((field) => (
            <FieldRows key={field.name} field={field} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FieldRows({ field }: { field: SchemaFieldRow }) {
  return (
    <>
      <tr>
        <td className="px-3 py-2 font-mono text-xs">{field.name}</td>
        <td className="docs-cell-muted px-3 py-2 align-top">
          {field.enumEntries ? <span className="font-mono text-xs text-primary">enum</span> : field.type}
        </td>
        <td className="docs-cell-muted px-3 py-2">{field.required ? "Có" : "Không"}</td>
        <td className="docs-cell-muted px-3 py-2 align-top">{field.description ?? "—"}</td>
      </tr>
      {field.enumEntries ? (
        <tr className="border-t border-hairline">
          <td colSpan={4} className="px-3 py-3">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">Giá trị enum</p>
            <EnumValueList entries={field.enumEntries} />
          </td>
        </tr>
      ) : null}
    </>
  );
}

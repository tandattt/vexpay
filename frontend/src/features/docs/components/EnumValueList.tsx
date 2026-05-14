import type { EnumEntry } from "../lib/openapi";

interface Props {
  entries: EnumEntry[];
}

export default function EnumValueList({ entries }: Props) {
  return (
    <ul className="mt-2 space-y-1.5">
      {entries.map((entry) => (
        <li
          key={`${entry.value}-${entry.name}`}
          className="rounded-lg border border-hairline bg-fill-subtle px-2.5 py-1.5 text-xs"
        >
          <span className="font-mono font-semibold text-primary">{entry.value}</span>
          <span className="text-muted"> = </span>
          <span className="font-mono text-ink">{entry.name}</span>
          {entry.description ? (
            <span className="mt-0.5 block text-muted">{entry.description}</span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

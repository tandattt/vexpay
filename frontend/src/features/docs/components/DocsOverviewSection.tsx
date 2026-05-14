import { API_BASE_URL } from "../../../shared/config/api";
import { OPENAPI_SPEC_URL } from "../api";
import { overviewToMarkdown } from "../lib/toMarkdown";
import type { OpenApiDocument, ParsedEndpoint } from "../types";
import CopyForAiButton from "./CopyForAiButton";

interface Props {
  doc: OpenApiDocument;
  endpoints: ParsedEndpoint[];
}

export default function DocsOverviewSection({ doc, endpoints }: Props) {
  return (
    <section className="space-y-5">
      <div className="flex justify-end">
        <CopyForAiButton getMarkdown={() => overviewToMarkdown(doc, endpoints)} />
      </div>

      <div className="docs-hero rounded-2xl p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">OpenAPI {doc.openapi}</p>
        <h2 className="mt-2 font-display text-2xl font-semibold text-ink">{doc.info.title}</h2>
        <p className="mt-1 text-sm text-muted">Phiên bản {doc.info.version}</p>
        {doc.info.description ? (
          <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted">{doc.info.description}</p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <InfoCard title="Base URL" value={API_BASE_URL} />
        <InfoCard title="OpenAPI spec" value={OPENAPI_SPEC_URL} />
      </div>
    </section>
  );
}

function InfoCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="docs-kv rounded-xl p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{title}</p>
      <p className="mt-2 break-all font-mono text-xs text-ink">{value}</p>
    </div>
  );
}

import type { OpenApiDocument, OpenApiResponse } from "../types";
import {
  flattenSchemaProperties,
  formatSchemaType,
  isBinaryMediaType,
  mediaTypeExample,
  responseStatusTone,
} from "../lib/openapi";
import SchemaFieldsTable from "./SchemaFieldsTable";

interface Props {
  doc: OpenApiDocument;
  responses: Record<string, OpenApiResponse>;
}

export default function ResponseSection({ doc, responses }: Props) {
  const entries = Object.entries(responses).sort(([a], [b]) => Number(a) - Number(b));

  return (
    <section>
      <h4 className="text-sm font-semibold text-ink">Phản hồi</h4>
      <div className="mt-3 space-y-4">
        {entries.map(([status, response]) => (
          <ResponseCard key={status} doc={doc} status={status} response={response} />
        ))}
      </div>
    </section>
  );
}

function ResponseCard({
  doc,
  status,
  response,
}: {
  doc: OpenApiDocument;
  status: string;
  response: OpenApiResponse;
}) {
  const contentEntries = Object.entries(response.content ?? {});
  const isNoContent = status === "204" || contentEntries.length === 0;

  return (
    <article className="docs-panel-muted overflow-hidden rounded-xl">
      <header className="flex flex-wrap items-start gap-3 border-b border-hairline px-4 py-3">
        <span
          className={`rounded-lg border px-2.5 py-1 font-mono text-xs font-bold ${responseStatusTone(status)}`}
        >
          {status}
        </span>
        <p className="min-w-0 flex-1 text-sm text-muted">{response.description || "—"}</p>
      </header>

      <div className="space-y-4 p-4">
        {isNoContent ? (
          <p className="text-sm text-muted">Không có response body.</p>
        ) : (
          contentEntries.map(([mediaType, media]) => {
            const binary = isBinaryMediaType(mediaType, media.schema);
            const fields = binary ? [] : flattenSchemaProperties(doc, media.schema);
            const example = binary ? undefined : mediaTypeExample(doc, media);

            return (
              <div key={mediaType} className="space-y-3">
                <p className="font-mono text-xs text-primary">Content-Type: {mediaType}</p>

                {binary ? (
                  <p className="text-sm text-muted">
                    Response body là dữ liệu nhị phân ({formatSchemaType(doc, media.schema)}).
                    Lưu trực tiếp thành file (ví dụ{" "}
                    <code className="font-mono text-xs text-ink">payment-qr.png</code>).
                  </p>
                ) : null}

                {fields.length > 0 ? (
                  <SchemaFieldsTable fields={fields} />
                ) : !binary ? (
                  <p className="text-sm text-muted">
                    Schema: <span className="font-mono text-xs text-ink">{formatSchemaType(doc, media.schema)}</span>
                  </p>
                ) : null}

                {example !== undefined ? (
                  <pre className="docs-code-block overflow-x-auto rounded-lg p-3 text-xs">
                    <code>{JSON.stringify(example, null, 2)}</code>
                  </pre>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </article>
  );
}

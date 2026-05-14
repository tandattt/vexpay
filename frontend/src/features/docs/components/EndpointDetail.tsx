import type { OpenApiDocument, OpenApiParameter } from "../types";
import { flattenSchemaProperties, methodTone, requestBodyExample } from "../lib/openapi";
import { endpointToMarkdown } from "../lib/toMarkdown";
import CopyForAiButton from "./CopyForAiButton";
import SchemaFieldsTable from "./SchemaFieldsTable";
import ResponseSection from "./ResponseSection";
import CodeSamplePanel from "./CodeSamplePanel";
import type { ParsedEndpoint } from "../types";

interface Props {
  doc: OpenApiDocument;
  endpoint: ParsedEndpoint;
}

export default function EndpointDetail({ doc, endpoint }: Props) {
  const bodySchema = endpoint.requestBody?.content?.["application/json"]?.schema;
  const bodyFields = flattenSchemaProperties(doc, bodySchema);
  const bodyExample = requestBodyExample(doc, endpoint);

  return (
    <article id={`endpoint-${endpoint.id}`} className="docs-panel scroll-mt-24 rounded-2xl">
      <header className="border-b border-hairline px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <span className={`rounded-lg border px-2.5 py-1 font-mono text-xs font-bold ${methodTone(endpoint.method)}`}>
                {endpoint.method}
              </span>
              <code className="font-mono text-sm text-ink">{endpoint.path}</code>
            </div>
            <h3 className="mt-3 font-display text-lg font-semibold text-ink">{endpoint.summary}</h3>
            {endpoint.description ? (
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted">{endpoint.description}</p>
            ) : null}
          </div>
          <CopyForAiButton
            className="shrink-0"
            getMarkdown={() => endpointToMarkdown(doc, endpoint)}
          />
        </div>
      </header>

      <div className="space-y-6 p-5">
        {endpoint.parameters.length > 0 ? (
          <section>
            <h4 className="text-sm font-semibold text-ink">Tham số</h4>
            <div className="docs-table-shell mt-3 overflow-hidden rounded-xl">
              <table className="docs-table w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wide">
                  <tr>
                    <th className="px-3 py-2 font-medium">Tên</th>
                    <th className="px-3 py-2 font-medium">Vị trí</th>
                    <th className="px-3 py-2 font-medium">Bắt buộc</th>
                    <th className="px-3 py-2 font-medium">Mô tả</th>
                  </tr>
                </thead>
                <tbody>
                  {endpoint.parameters.map((param) => (
                    <ParamRow key={`${param.in}-${param.name}`} param={param} />
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {bodyFields.length > 0 ? (
          <section>
            <h4 className="text-sm font-semibold text-ink">Request body</h4>
            <div className="mt-3">
              <SchemaFieldsTable fields={bodyFields} />
            </div>
            {bodyExample !== undefined ? (
              <pre className="docs-code-block mt-3 overflow-x-auto rounded-xl p-4 text-xs">
                <code>{JSON.stringify(bodyExample, null, 2)}</code>
              </pre>
            ) : null}
          </section>
        ) : null}

        <ResponseSection doc={doc} responses={endpoint.responses} />

        <section>
          <h4 className="mb-3 text-sm font-semibold text-ink">Ví dụ gọi API</h4>
          <CodeSamplePanel doc={doc} endpoint={endpoint} />
        </section>
      </div>
    </article>
  );
}

function ParamRow({ param }: { param: OpenApiParameter }) {
  const type = param.schema?.type ?? "string";
  return (
    <tr>
      <td className="px-3 py-2 font-mono text-xs">{param.name}</td>
      <td className="docs-cell-muted px-3 py-2">{param.in}</td>
      <td className="docs-cell-muted px-3 py-2">{param.required ? "Có" : "Không"}</td>
      <td className="docs-cell-muted px-3 py-2">{param.description ?? type}</td>
    </tr>
  );
}

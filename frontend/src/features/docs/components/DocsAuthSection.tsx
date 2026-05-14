import type { OpenApiDocument } from "../types";

interface Props {
  doc: OpenApiDocument;
}

export default function DocsAuthSection({ doc }: Props) {
  const schemes = doc.components?.securitySchemes ?? {};

  return (
    <section className="space-y-5">
      <div>
        <h2 className="font-display text-xl font-semibold text-ink">Xác thực</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Public API yêu cầu API key dự án. Tạo key trong khu vực Developer → chọn project → API Keys.
        </p>
      </div>

      {Object.entries(schemes).map(([name, scheme]) => (
        <article key={name} className="docs-panel rounded-2xl p-5">
          <h3 className="font-mono text-sm font-semibold text-ink">{name}</h3>
          {scheme.description ? <p className="mt-2 text-sm text-muted">{scheme.description}</p> : null}
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">Loại</dt>
              <dd className="mt-1 text-ink">{scheme.type}</dd>
            </div>
            {scheme.name ? (
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted">Header</dt>
                <dd className="mt-1 font-mono text-ink">{scheme.name}</dd>
              </div>
            ) : null}
          </dl>
        </article>
      ))}

      <div className="docs-panel-muted rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-ink">Ví dụ header</h3>
        <pre className="docs-code-block mt-3 overflow-x-auto rounded-xl p-4 text-xs">
{`X-API-Key: vx_live_xxxxxxxxxxxxxxxx

# hoặc
Authorization: Bearer vx_live_xxxxxxxxxxxxxxxx`}
        </pre>
      </div>
    </section>
  );
}

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Spinner, Button } from "../../../shared/components/ui";
import { useOpenApiSpec } from "../hooks/useOpenApiSpec";
import DocsAuthSection from "../components/DocsAuthSection";
import DocsNav from "../components/DocsNav";
import DocsOverviewSection from "../components/DocsOverviewSection";
import DocsQuickStartSection from "../components/DocsQuickStartSection";
import DocsWebhookSection from "../components/DocsWebhookSection";
import EndpointDetail from "../components/EndpointDetail";
import type { DocsSectionId } from "../types";

interface Props {
  enabled?: boolean;
}

export default function ApiDocsPage({ enabled = true }: Props) {
  const { doc, endpoints, loading, error, reload } = useOpenApiSpec(enabled);
  const [active, setActive] = useState<DocsSectionId>("overview");

  useEffect(() => {
    if (!active.startsWith("endpoint:")) return;
    const id = active.replace("endpoint:", "");
    const el = document.getElementById(`endpoint-${id}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [active]);

  if (!enabled) return null;

  if (loading && !doc) {
    return (
      <div className="docs-panel flex min-h-[320px] items-center justify-center rounded-2xl">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-6">
        <p className="text-sm font-medium text-rose-700 dark:text-rose-300">
          {error ?? "Không tải được tài liệu API."}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-4"
          leftIcon={<RefreshCw className="h-4 w-4" />}
          onClick={() => void reload()}
        >
          Thử lại
        </Button>
      </div>
    );
  }

  const selectedEndpoint =
    active.startsWith("endpoint:")
      ? endpoints.find((item) => item.id === active.replace("endpoint:", ""))
      : undefined;

  return (
    <div className="-mx-2 flex flex-col gap-6 lg:flex-row lg:items-start xl:-mx-4">
      <aside className="lg:sticky lg:top-4 lg:w-[280px] lg:shrink-0">
        <div className="docs-panel rounded-2xl p-3">
          <DocsNav active={active} endpoints={endpoints} onSelect={setActive} />
        </div>
      </aside>

      <div className="min-w-0 flex-1 space-y-8">
        {active === "overview" ? <DocsOverviewSection doc={doc} endpoints={endpoints} /> : null}
        {active === "authentication" ? <DocsAuthSection doc={doc} /> : null}
        {active === "quickstart" ? <DocsQuickStartSection /> : null}
        {active === "webhooks" ? <DocsWebhookSection global={doc["x-vexpay-global"]} /> : null}

        {active.startsWith("endpoint:") && selectedEndpoint ? (
          <EndpointDetail doc={doc} endpoint={selectedEndpoint} />
        ) : null}

        {active === "overview" ? (
          <section className="space-y-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-xl font-semibold text-ink">Tất cả endpoints</h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
                onClick={() => void reload()}
              >
                Đồng bộ spec
              </Button>
            </div>
            {endpoints.map((endpoint) => (
              <EndpointDetail key={endpoint.id} doc={doc} endpoint={endpoint} />
            ))}
          </section>
        ) : null}
      </div>
    </div>
  );
}

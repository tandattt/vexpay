import { BookOpen, KeyRound, Rocket, Webhook } from "lucide-react";
import type { DocsSectionId, ParsedEndpoint } from "../types";
import { methodTone } from "../lib/openapi";

interface Props {
  active: DocsSectionId;
  endpoints: ParsedEndpoint[];
  onSelect: (section: DocsSectionId) => void;
}

const STATIC_SECTIONS: { id: DocsSectionId; label: string; icon: typeof BookOpen }[] = [
  { id: "overview", label: "Tổng quan", icon: BookOpen },
  { id: "authentication", label: "Xác thực", icon: KeyRound },
  { id: "quickstart", label: "Bắt đầu nhanh", icon: Rocket },
  { id: "webhooks", label: "Webhook", icon: Webhook },
];

export default function DocsNav({ active, endpoints, onSelect }: Props) {
  return (
    <nav className="space-y-6">
      <div>
        <p className="px-2 text-[11px] font-semibold uppercase tracking-wider text-muted">Hướng dẫn</p>
        <ul className="mt-2 space-y-1">
          {STATIC_SECTIONS.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onSelect(item.id)}
                  className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                    isActive
                      ? "bg-primary/12 font-medium text-primary"
                      : "text-muted hover:bg-fill-hover hover:text-ink"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div>
        <p className="px-2 text-[11px] font-semibold uppercase tracking-wider text-muted">Endpoints</p>
        <ul className="mt-2 space-y-1">
          {endpoints.map((endpoint) => {
            const sectionId: DocsSectionId = `endpoint:${endpoint.id}`;
            const isActive = active === sectionId;
            return (
              <li key={endpoint.id}>
                <button
                  type="button"
                  onClick={() => onSelect(sectionId)}
                  className={`flex w-full items-start gap-2 rounded-xl px-3 py-2 text-left transition-colors ${
                    isActive ? "bg-primary/12" : "hover:bg-fill-hover"
                  }`}
                >
                  <span className={`mt-0.5 rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold ${methodTone(endpoint.method)}`}>
                    {endpoint.method}
                  </span>
                  <span className={`font-mono text-xs leading-snug ${isActive ? "text-primary" : "text-muted"}`}>
                    {endpoint.path}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}

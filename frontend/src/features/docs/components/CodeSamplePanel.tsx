import { useState } from "react";
import { Check, Copy } from "lucide-react";
import type { CodeSampleLang, OpenApiDocument, ParsedEndpoint } from "../types";
import { CODE_SAMPLE_LANGS, buildCodeSample } from "../lib/codeSamples";

interface Props {
  doc: OpenApiDocument;
  endpoint: ParsedEndpoint;
}

export default function CodeSamplePanel({ doc, endpoint }: Props) {
  const [lang, setLang] = useState<CodeSampleLang>("curl");
  const [copied, setCopied] = useState(false);
  const code = buildCodeSample(lang, doc, endpoint);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="docs-panel-muted overflow-hidden rounded-xl">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline px-3 py-2">
        <div className="flex flex-wrap gap-1">
          {CODE_SAMPLE_LANGS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setLang(item.id)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                lang === item.id
                  ? "bg-primary/12 text-primary"
                  : "text-muted hover:bg-fill-hover hover:text-ink"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => void handleCopy()}
          className="inline-flex items-center gap-1 rounded-lg border border-hairline px-2 py-1 text-xs text-muted transition-colors hover:bg-fill-hover hover:text-ink"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Đã copy" : "Copy"}
        </button>
      </div>
      <pre className="docs-code-block overflow-x-auto p-4 text-xs leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

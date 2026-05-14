import { API_BASE_URL } from "../../../shared/config/api";
import type { CodeSampleLang, OpenApiDocument, ParsedEndpoint } from "../types";
import { requestBodyExample } from "./openapi";

const PLACEHOLDER_KEY = "vx_live_your_api_key";

function buildUrl(baseUrl: string, path: string, endpoint: ParsedEndpoint): string {
  let url = `${baseUrl.replace(/\/$/, "")}${path}`;
  for (const param of endpoint.parameters) {
    if (param.in === "path") {
      url = url.replace(`{${param.name}}`, param.schema?.example?.toString() ?? `:${param.name}`);
    }
  }
  const query = endpoint.parameters
    .filter((p) => p.in === "query")
    .map((p) => {
      const value = p.schema?.example ?? (p.name === "page" ? 1 : p.name === "pageSize" ? 20 : "");
      return `${encodeURIComponent(p.name)}=${encodeURIComponent(String(value))}`;
    });
  if (query.length) url += `?${query.join("&")}`;
  return url;
}

function bodyJson(doc: OpenApiDocument, endpoint: ParsedEndpoint): string | null {
  const example = requestBodyExample(doc, endpoint);
  if (example === undefined) return null;
  return JSON.stringify(example, null, 2);
}

export function buildCodeSample(
  lang: CodeSampleLang,
  doc: OpenApiDocument,
  endpoint: ParsedEndpoint,
  apiKey = PLACEHOLDER_KEY,
): string {
  const url = buildUrl(API_BASE_URL, endpoint.path, endpoint);
  const body = bodyJson(doc, endpoint);
  const hasBody = body !== null && endpoint.method !== "GET";

  switch (lang) {
    case "curl": {
      const lines = [
        `curl -X ${endpoint.method} "${url}" \\`,
        `  -H "X-API-Key: ${apiKey}" \\`,
        `  -H "Accept: application/json"`,
      ];
      if (hasBody) {
        lines.push(`  -H "Content-Type: application/json" \\`);
        lines.push(`  -d '${body!.replace(/'/g, "'\\''")}'`);
      } else {
        lines[lines.length - 1] = lines[lines.length - 1]!.replace(/ \\$/, "");
      }
      return lines.join("\n");
    }
    case "javascript": {
      const opts: string[] = [`    method: "${endpoint.method}",`, `    headers: {`, `      "X-API-Key": "${apiKey}",`, `      Accept: "application/json",`];
      if (hasBody) opts.push(`      "Content-Type": "application/json",`);
      opts.push(`    },`);
      if (hasBody) opts.push(`    body: JSON.stringify(${body}),`);
      return `const response = await fetch("${url}", {\n${opts.join("\n")}\n});\n\nconst data = await response.json();\nconsole.log(data);`;
    }
    case "python": {
      const headers = [`    "X-API-Key": "${apiKey}",`, `    "Accept": "application/json",`];
      if (hasBody) headers.push(`    "Content-Type": "application/json",`);
      const parts = [
        "import requests",
        "",
        `url = "${url}"`,
        "headers = {",
        ...headers,
        "}",
      ];
      if (hasBody) {
        parts.push(`payload = ${body}`);
        parts.push(`response = requests.${endpoint.method.toLowerCase()}(url, headers=headers, json=payload)`);
      } else {
        parts.push(`response = requests.${endpoint.method.toLowerCase()}(url, headers=headers)`);
      }
      parts.push("print(response.status_code, response.json())");
      return parts.join("\n");
    }
    default:
      return "";
  }
}

export const CODE_SAMPLE_LANGS: { id: CodeSampleLang; label: string }[] = [
  { id: "curl", label: "cURL" },
  { id: "javascript", label: "JavaScript" },
  { id: "python", label: "Python" },
];

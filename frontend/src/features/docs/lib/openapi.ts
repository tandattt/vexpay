import type {
  OpenApiDocument,
  OpenApiMediaType,
  OpenApiSchema,
  ParsedEndpoint,
} from "../types";

const HTTP_METHODS = ["get", "post", "put", "patch", "delete"] as const;

export function parseEndpoints(doc: OpenApiDocument): ParsedEndpoint[] {
  const endpoints: ParsedEndpoint[] = [];

  for (const [path, item] of Object.entries(doc.paths ?? {})) {
    for (const method of HTTP_METHODS) {
      const operation = item[method];
      if (!operation) continue;

      const id = operation.operationId ?? `${method}-${path}`;
      endpoints.push({
        id,
        method: method.toUpperCase(),
        path,
        summary: operation.summary ?? `${method.toUpperCase()} ${path}`,
        description: operation.description,
        tags: operation.tags ?? ["Other"],
        parameters: operation.parameters ?? [],
        requestBody: operation.requestBody,
        responses: operation.responses ?? {},
      });
    }
  }

  return endpoints.sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method));
}

export function resolveRef(doc: OpenApiDocument, schema?: OpenApiSchema): OpenApiSchema | undefined {
  if (!schema) return undefined;

  if (schema.allOf?.length) {
    const merged: OpenApiSchema = { ...schema };
    delete merged.allOf;
    for (const part of schema.allOf) {
      const resolved = resolveRef(doc, part);
      if (!resolved) continue;
      Object.assign(merged, resolved, {
        properties: { ...merged.properties, ...resolved.properties },
        required: [...new Set([...(merged.required ?? []), ...(resolved.required ?? [])])],
        enum: resolved.enum ?? merged.enum,
        description: merged.description ?? resolved.description,
        "x-enum-varnames": resolved["x-enum-varnames"] ?? merged["x-enum-varnames"],
        "x-enum-descriptions": resolved["x-enum-descriptions"] ?? merged["x-enum-descriptions"],
      });
    }
    return merged;
  }

  if (!schema.$ref) return schema;
  const name = schema.$ref.split("/").pop();
  if (!name) return schema;
  return doc.components?.schemas?.[name] ?? schema;
}

export interface EnumEntry {
  value: string;
  name: string;
  description?: string;
}

const ENUM_LINE_RE = /^-?\d+\s*=\s*[A-Za-z0-9_]+/;

/** Giữ phần mô tả không phải dòng enum (khi enum hiển thị riêng). */
export function fieldDescriptionWithoutEnum(
  description: string | undefined,
  entries?: EnumEntry[],
): string | undefined {
  if (!description || !entries?.length) return description;

  const remaining = description
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !ENUM_LINE_RE.test(line));

  return remaining.length ? remaining.join("\n") : undefined;
}

export function enumEntries(schema?: OpenApiSchema): EnumEntry[] | undefined {
  if (!schema?.enum?.length) return undefined;

  const names = schema["x-enum-varnames"];
  const descriptions = schema["x-enum-descriptions"];
  if (names?.length) {
    return schema.enum.map((value, index) => ({
      value: String(value),
      name: names[index] ?? String(value),
      description: descriptions?.[index],
    }));
  }

  if (schema.description?.includes("=")) {
    const parsed = schema.description
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line): EnumEntry | null => {
        const match = line.match(/^(-?\d+)\s*=\s*([A-Za-z0-9_]+)(?:\s*[—–-]\s*(.+))?$/);
        if (!match) return null;
        const entry: EnumEntry = {
          value: match[1],
          name: match[2],
        };
        const description = match[3]?.trim();
        if (description) entry.description = description;
        return entry;
      })
      .filter((entry): entry is EnumEntry => entry !== null);

    if (parsed.length) return parsed;
  }

  return schema.enum.map((value) => ({
    value: String(value),
    name: String(value),
  }));
}

export function formatEnumTypeLabel(schema?: OpenApiSchema): string {
  const entries = enumEntries(schema);
  if (!entries?.length) return "enum";
  return entries.map((entry) => `${entry.value} = ${entry.name}`).join(" | ");
}

export interface SchemaFieldRow {
  name: string;
  type: string;
  required: boolean;
  description?: string;
  enumEntries?: EnumEntry[];
}

function formatScalarType(doc: OpenApiDocument, schema?: OpenApiSchema): string {
  const resolved = resolveRef(doc, schema);
  if (!resolved) return "unknown";
  if (resolved.enum?.length) return formatEnumTypeLabel(resolved);
  if (resolved.$ref) return resolved.$ref.split("/").pop() ?? "object";
  if (resolved.type === "array" && resolved.items) {
    return `array<${formatScalarType(doc, resolved.items)}>`;
  }
  if (resolved.format) return `${resolved.type ?? "object"} (${resolved.format})`;
  return resolved.type ?? "object";
}

export function schemaExample(doc: OpenApiDocument, schema?: OpenApiSchema): unknown {
  const resolved = resolveRef(doc, schema);
  if (!resolved) return undefined;
  if (resolved.example !== undefined) return resolved.example;

  if (resolved.type === "object" && resolved.properties) {
    const result: Record<string, unknown> = {};
    for (const [key, prop] of Object.entries(resolved.properties)) {
      const value = schemaExample(doc, prop);
      if (value !== undefined) result[key] = value;
    }
    return result;
  }

  if (resolved.type === "array" && resolved.items) {
    const item = schemaExample(doc, resolved.items);
    return item === undefined ? [] : [item];
  }

  if (resolved.enum?.length) return resolved.enum[0];
  if (resolved.type === "integer" || resolved.type === "number") return resolved.minimum ?? 0;
  if (resolved.type === "boolean") return false;
  if (resolved.format === "date-time") return "2026-05-14T08:00:00Z";
  return resolved.type === "string" ? "" : undefined;
}

export function requestBodyExample(doc: OpenApiDocument, endpoint: ParsedEndpoint): unknown | undefined {
  const json = endpoint.requestBody?.content?.["application/json"];
  if (!json) return undefined;
  if (json.example !== undefined) return json.example;
  return schemaExample(doc, json.schema);
}

export function flattenSchemaProperties(
  doc: OpenApiDocument,
  schema?: OpenApiSchema,
): SchemaFieldRow[] {
  const resolved = resolveRef(doc, schema);
  if (!resolved?.properties) return [];

  const required = new Set(resolved.required ?? []);
  return Object.entries(resolved.properties).map(([name, prop]) => {
    const resolvedProp = resolveRef(doc, prop);
    const entries = enumEntries(resolvedProp);
    return {
      name,
      type: formatScalarType(doc, prop),
      required: required.has(name),
      description: fieldDescriptionWithoutEnum(resolvedProp?.description, entries),
      enumEntries: entries,
    };
  });
}

export function mediaTypeExample(doc: OpenApiDocument, media?: OpenApiMediaType): unknown | undefined {
  if (!media) return undefined;
  if (media.example !== undefined) return media.example;
  return schemaExample(doc, media.schema);
}

export function isBinaryMediaType(mediaType: string, schema?: OpenApiSchema): boolean {
  return (
    mediaType.startsWith("image/") ||
    mediaType === "application/octet-stream" ||
    schema?.format === "binary" ||
    schema?.type === "string" && schema.format === "byte"
  );
}

export function formatSchemaType(doc: OpenApiDocument, schema?: OpenApiSchema): string {
  return formatScalarType(doc, schema);
}

export function responseStatusTone(status: string): string {
  const code = Number(status);
  if (code >= 200 && code < 300) {
    return "text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/25";
  }
  if (code >= 400 && code < 500) {
    return "text-amber-700 dark:text-amber-300 bg-amber-500/10 border-amber-500/25";
  }
  if (code >= 500) {
    return "text-rose-700 dark:text-rose-300 bg-rose-500/10 border-rose-500/25";
  }
  return "text-muted bg-fill-subtle border-hairline";
}

export function methodTone(method: string): string {
  switch (method.toUpperCase()) {
    case "GET":
      return "text-sky-700 dark:text-sky-300 bg-sky-500/10 border-sky-500/25";
    case "POST":
      return "text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/25";
    case "PUT":
    case "PATCH":
      return "text-amber-700 dark:text-amber-300 bg-amber-500/10 border-amber-500/25";
    case "DELETE":
      return "text-rose-700 dark:text-rose-300 bg-rose-500/10 border-rose-500/25";
    default:
      return "text-muted bg-fill-subtle border-hairline";
  }
}

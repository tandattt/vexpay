import { API_BASE_URL } from "../../../shared/config/api";
import { OPENAPI_SPEC_URL } from "../api";
import type { OpenApiDocument, OpenApiParameter, OpenApiResponse, ParsedEndpoint } from "../types";
import { buildCodeSample } from "./codeSamples";
import {
  flattenSchemaProperties,
  isBinaryMediaType,
  mediaTypeExample,
  requestBodyExample,
  type SchemaFieldRow,
} from "./openapi";

function mdTable(headers: string[], rows: string[][]): string {
  if (!rows.length) return "";
  const line = (cells: string[]) => `| ${cells.join(" | ")} |`;
  return [line(headers), line(headers.map(() => "---")), ...rows.map((row) => line(row))].join("\n");
}

function mdSchemaFields(fields: SchemaFieldRow[]): string {
  if (!fields.length) return "";
  const rows = fields.flatMap((field) => {
    const base = [
      `\`${field.name}\``,
      field.enumEntries ? "enum" : field.type,
      field.required ? "Có" : "Không",
      field.description ?? "—",
    ];
    const result: string[][] = [base];
    if (field.enumEntries?.length) {
      for (const entry of field.enumEntries) {
        result.push([
          "",
          `\`${entry.value}\` = ${entry.name}`,
          "",
          entry.description ?? "—",
        ]);
      }
    }
    return result;
  });
  return mdTable(["Trường", "Kiểu", "Bắt buộc", "Mô tả"], rows);
}

function mdParameters(parameters: OpenApiParameter[]): string {
  if (!parameters.length) return "";
  const rows = parameters.map((param) => [
    `\`${param.name}\``,
    param.in,
    param.required ? "Có" : "Không",
    param.description ?? param.schema?.type ?? "string",
  ]);
  return mdTable(["Tên", "Vị trí", "Bắt buộc", "Mô tả"], rows);
}

function mdResponses(doc: OpenApiDocument, responses: Record<string, OpenApiResponse>): string {
  const entries = Object.entries(responses).sort(([a], [b]) => Number(a) - Number(b));
  if (!entries.length) return "";

  return entries
    .map(([status, response]) => {
      const lines = [`### ${status}`, "", response.description || "—", ""];
      const contentEntries = Object.entries(response.content ?? []);

      if (status === "204" || !contentEntries.length) {
        lines.push("_Không có response body._", "");
        return lines.join("\n");
      }

      for (const [mediaType, media] of contentEntries) {
        lines.push(`**Content-Type:** \`${mediaType}\``, "");
        if (isBinaryMediaType(mediaType, media.schema)) {
          lines.push("_Binary response — lưu body thành file._", "");
          continue;
        }

        const fields = flattenSchemaProperties(doc, media.schema);
        if (fields.length) {
          lines.push(mdSchemaFields(fields), "");
        }

        const example = mediaTypeExample(doc, media);
        if (example !== undefined) {
          lines.push("```json", JSON.stringify(example, null, 2), "```", "");
        }
      }

      return lines.join("\n");
    })
    .join("\n");
}

export function endpointToMarkdown(doc: OpenApiDocument, endpoint: ParsedEndpoint): string {
  const bodySchema = endpoint.requestBody?.content?.["application/json"]?.schema;
  const bodyFields = flattenSchemaProperties(doc, bodySchema);
  const bodyExample = requestBodyExample(doc, endpoint);
  const curl = buildCodeSample("curl", doc, endpoint);

  const lines = [
    `## ${endpoint.method} ${endpoint.path}`,
    "",
    endpoint.summary,
    "",
  ];

  if (endpoint.description) {
    lines.push(endpoint.description, "");
  }

  if (endpoint.parameters.length) {
    lines.push("### Tham số", "", mdParameters(endpoint.parameters), "");
  }

  if (bodyFields.length) {
    lines.push("### Request body", "", mdSchemaFields(bodyFields), "");
    if (bodyExample !== undefined) {
      lines.push("```json", JSON.stringify(bodyExample, null, 2), "```", "");
    }
  }

  lines.push("### Phản hồi", "", mdResponses(doc, endpoint.responses), "");
  lines.push("### Ví dụ cURL", "", "```bash", curl, "```", "");

  return lines.join("\n");
}

export function overviewToMarkdown(doc: OpenApiDocument, endpoints: ParsedEndpoint[]): string {
  const lines = [
    `# ${doc.info.title}`,
    "",
    `**OpenAPI:** ${doc.openapi} · **Phiên bản:** ${doc.info.version}`,
    "",
  ];

  if (doc.info.description) {
    lines.push(doc.info.description, "");
  }

  lines.push(
    `**Base URL:** \`${API_BASE_URL}\``,
    `**OpenAPI spec:** \`${OPENAPI_SPEC_URL}\``,
    "",
    "## Xác thực",
    "",
    "Gửi API key dự án qua header `X-API-Key` hoặc `Authorization: Bearer <key>`.",
    "",
    "# Endpoints",
    "",
  );

  for (const endpoint of endpoints) {
    lines.push(endpointToMarkdown(doc, endpoint), "---", "");
  }

  return lines.join("\n").replace(/\n---\n$/, "");
}

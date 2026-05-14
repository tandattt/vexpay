export interface OpenApiInfo {
  title: string;
  version: string;
  description?: string;
}

export interface OpenApiServer {
  url: string;
  description?: string;
}

export interface OpenApiSchema {
  type?: string;
  format?: string;
  description?: string;
  example?: unknown;
  enum?: (string | number)[];
  properties?: Record<string, OpenApiSchema>;
  items?: OpenApiSchema;
  required?: string[];
  $ref?: string;
  nullable?: boolean;
  allOf?: OpenApiSchema[];
  minimum?: number;
  maximum?: number;
  /** Swashbuckle enum extension — tên member C# */
  "x-enum-varnames"?: string[];
  /** Swashbuckle enum extension — mô tả từng giá trị */
  "x-enum-descriptions"?: string[];
}

export interface OpenApiParameter {
  name: string;
  in: "query" | "path" | "header" | "cookie";
  required?: boolean;
  description?: string;
  schema?: OpenApiSchema;
}

export interface OpenApiMediaType {
  schema?: OpenApiSchema;
  example?: unknown;
}

export interface OpenApiRequestBody {
  required?: boolean;
  description?: string;
  content?: Record<string, OpenApiMediaType>;
}

export interface OpenApiResponse {
  description: string;
  content?: Record<string, OpenApiMediaType>;
}

export interface OpenApiOperation {
  tags?: string[];
  summary?: string;
  description?: string;
  operationId?: string;
  parameters?: OpenApiParameter[];
  requestBody?: OpenApiRequestBody;
  responses?: Record<string, OpenApiResponse>;
  security?: Record<string, string[]>[];
}

export interface OpenApiPathItem {
  get?: OpenApiOperation;
  post?: OpenApiOperation;
  put?: OpenApiOperation;
  patch?: OpenApiOperation;
  delete?: OpenApiOperation;
}

export interface OpenApiSecurityScheme {
  type: string;
  description?: string;
  name?: string;
  in?: string;
  scheme?: string;
}

export interface OpenApiDocument {
  openapi: string;
  info: OpenApiInfo;
  servers?: OpenApiServer[];
  paths: Record<string, OpenApiPathItem>;
  tags?: { name: string; description?: string }[];
  components?: {
    securitySchemes?: Record<string, OpenApiSecurityScheme>;
    schemas?: Record<string, OpenApiSchema>;
  };
  "x-vexpay-global"?: PlatformGlobalConfig;
}

export interface PlatformGlobalConfig {
  qr_image_expiration_minutes?: number;
  webhook_max_attempts?: number;
  webhook_retry_delay_seconds?: number[];
}

export interface ParsedEndpoint {
  id: string;
  method: string;
  path: string;
  summary: string;
  description?: string;
  tags: string[];
  parameters: OpenApiParameter[];
  requestBody?: OpenApiRequestBody;
  responses: Record<string, OpenApiResponse>;
}

export type DocsSectionId =
  | "overview"
  | "authentication"
  | "quickstart"
  | "webhooks"
  | `endpoint:${string}`;

export type CodeSampleLang = "curl" | "javascript" | "python";

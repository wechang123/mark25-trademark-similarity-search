// Swagger 관련 타입 정의

import { z } from 'zod';

export interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
    contact?: {
      name?: string;
      email?: string;
    };
    // Extension fields for build-time metadata
    'x-build-time'?: string;
    'x-stats'?: any;
    'x-environment'?: string;
  };
  servers: Array<{
    url: string;
    description?: string;
  }>;
  tags?: Array<{
    name: string;
    description?: string;
  }>;
  paths: Record<string, PathItem>;
  components?: {
    schemas?: Record<string, any>;
    securitySchemes?: Record<string, any>;
  };
}

export interface PathItem {
  get?: Operation;
  post?: Operation;
  put?: Operation;
  delete?: Operation;
  patch?: Operation;
}

export interface Operation {
  tags?: string[];
  summary?: string;
  description?: string;
  operationId?: string;
  parameters?: Parameter[];
  requestBody?: RequestBody;
  responses: Record<string, Response>;
  security?: Array<Record<string, string[]>>;
}

export interface Parameter {
  name: string;
  in: 'query' | 'header' | 'path' | 'cookie';
  description?: string;
  required?: boolean;
  schema?: any;
}

export interface RequestBody {
  description?: string;
  required?: boolean;
  content: Record<string, MediaType>;
}

export interface Response {
  description: string;
  content?: Record<string, MediaType>;
  headers?: Record<string, any>;
}

export interface MediaType {
  schema?: any;
  example?: any;
  examples?: Record<string, any>;
}

export interface ApiDocConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  tags?: string[];
  summary?: string;
  description?: string;
  requestSchema?: z.ZodType<any>;
  responseSchema?: z.ZodType<any>;
  errorCodes?: number[];
  security?: boolean;
}

export interface SchemaDefinition {
  name: string;
  schema: z.ZodType<any>;
  description?: string;
  example?: any;
}
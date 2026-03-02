/**
 * API Documentation Decorators
 * 
 * Provides decorators for easy API documentation that automatically
 * registers endpoints with the OpenAPI registry.
 */

import { z } from 'zod';
import { apiRegistry } from '../registry/api-registry';
import { zodToOpenApiSchema } from '../schemas/common.schema';
import { PathItem, Operation } from '../types/swagger.types';

/**
 * API endpoint documentation options
 */
export interface ApiEndpointOptions {
  path: string;
  method: 'get' | 'post' | 'put' | 'patch' | 'delete';
  summary: string;
  description?: string;
  tags?: string[];
  requestSchema?: z.ZodSchema<any>;
  responseSchema?: z.ZodSchema<any>;
  errorResponseSchema?: z.ZodSchema<any>;
  queryParamsSchema?: z.ZodSchema<any>;
  errorResponses?: Record<number, string>;
  requiresAuth?: boolean;
  deprecated?: boolean;
  operationId?: string;
}

/**
 * Stores API documentation metadata for later registration
 */
const apiMetadataStorage = new Map<string, ApiEndpointOptions>();

/**
 * Class decorator for API controllers
 */
export function ApiController(basePath: string, options?: {
  tags?: string[];
  description?: string;
}) {
  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    // Store controller metadata
    Reflect.defineMetadata('apiController', {
      basePath,
      tags: options?.tags || [],
      description: options?.description
    }, constructor);

    return constructor;
  };
}

/**
 * Method decorator for API endpoints
 */
export function ApiEndpoint(options: Omit<ApiEndpointOptions, 'path'> & { path?: string }) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const controllerMetadata = Reflect.getMetadata('apiController', target.constructor);
    const basePath = controllerMetadata?.basePath || '';
    const controllerTags = controllerMetadata?.tags || [];
    
    const fullPath = basePath + (options.path || `/${propertyKey}`);
    const tags = [...controllerTags, ...(options.tags || [])];
    
    const endpointMetadata: ApiEndpointOptions = {
      ...options,
      path: fullPath,
      tags,
      operationId: options.operationId || `${options.method}_${propertyKey}`
    };

    // Store metadata for later registration
    apiMetadataStorage.set(`${target.constructor.name}.${propertyKey}`, endpointMetadata);
    
    return descriptor;
  };
}

/**
 * Parameter decorators
 */
export function ApiBody(schema: z.ZodSchema<any>, description?: string) {
  return function (target: any, propertyKey: string, parameterIndex: number) {
    const existingMetadata = apiMetadataStorage.get(`${target.constructor.name}.${propertyKey}`) || {} as ApiEndpointOptions;
    existingMetadata.requestSchema = schema;
    apiMetadataStorage.set(`${target.constructor.name}.${propertyKey}`, existingMetadata);
  };
}

export function ApiResponseSchema(schema: z.ZodSchema<any>, description?: string) {
  return function (target: any, propertyKey: string, parameterIndex: number) {
    const existingMetadata = apiMetadataStorage.get(`${target.constructor.name}.${propertyKey}`) || {} as ApiEndpointOptions;
    existingMetadata.responseSchema = schema;
    apiMetadataStorage.set(`${target.constructor.name}.${propertyKey}`, existingMetadata);
  };
}

/**
 * Quick decorator functions for common HTTP methods
 */
export const ApiGet = (path: string, summary: string, options?: Partial<ApiEndpointOptions>) => 
  ApiEndpoint({ ...options, path, method: 'get', summary });

export const ApiPost = (path: string, summary: string, options?: Partial<ApiEndpointOptions>) => 
  ApiEndpoint({ ...options, path, method: 'post', summary });

export const ApiPut = (path: string, summary: string, options?: Partial<ApiEndpointOptions>) => 
  ApiEndpoint({ ...options, path, method: 'put', summary });

export const ApiPatch = (path: string, summary: string, options?: Partial<ApiEndpointOptions>) => 
  ApiEndpoint({ ...options, path, method: 'patch', summary });

export const ApiDelete = (path: string, summary: string, options?: Partial<ApiEndpointOptions>) => 
  ApiEndpoint({ ...options, path, method: 'delete', summary });

/**
 * Register all decorated APIs with the OpenAPI registry
 */
export function registerDecoratedApis() {
  console.log('Registering', apiMetadataStorage.size, 'decorated APIs...');
  
  for (const [key, metadata] of apiMetadataStorage.entries()) {
    console.log('Registering decorated API:', metadata.path, metadata.method);
    
    try {
      // Use the correct registerPath signature with config object
      apiRegistry.registerPath({
        method: metadata.method.toUpperCase() as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
        path: metadata.path,
        tags: metadata.tags,
        summary: metadata.summary,
        description: metadata.description,
        operationId: metadata.operationId,
        security: metadata.requiresAuth !== false,
        requestBody: metadata.requestSchema ? {
          description: metadata.description,
          required: true,
          schema: metadata.requestSchema
        } : undefined,
        responses: {
          '200': {
            description: 'Success',
            schema: metadata.responseSchema
          },
          ...Object.entries(metadata.errorResponses || {}).reduce((acc, [code, description]) => {
            acc[code] = { description };
            return acc;
          }, {} as Record<string, any>)
        }
      });
      
      console.log('Decorated API registered successfully:', metadata.path);
    } catch (error) {
      console.error('Failed to register decorated API:', metadata.path, error);
    }
  }
}

/**
 * Utility function to create API documentation without decorators
 * Useful for functional approach or existing route handlers
 */
export function createApiDoc(options: ApiEndpointOptions): void {
  console.log('createApiDoc called with:', options.path, options.method);
  
  try {
    // Use the existing registerPath method with the correct signature
    apiRegistry.registerPath({
      method: options.method.toUpperCase() as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
      path: options.path,
      tags: options.tags,
      summary: options.summary,
      description: options.description,
      operationId: options.operationId,
      security: options.requiresAuth !== false,
      requestBody: options.requestSchema ? {
        description: options.description,
        required: true,
        schema: options.requestSchema
      } : undefined,
      responses: {
        '200': {
          description: 'Success',
          schema: options.responseSchema
        },
        ...Object.entries(options.errorResponses || {}).reduce((acc, [code, description]) => {
          acc[code] = { description };
          return acc;
        }, {} as Record<string, any>)
      }
    });

    // 검증용 엔드포인트 등록
    apiRegistry.registerEndpoint(options);
    
    console.log('API registered successfully via createApiDoc:', options.path);
    
    // Debug: 현재 등록된 모든 경로 출력
    const currentPaths = apiRegistry.getPaths();
    console.log('Current registered paths:', Object.keys(currentPaths));
    
  } catch (error) {
    console.error('Failed to register API via createApiDoc:', options.path, error);
  }
}

/**
 * Export metadata storage for debugging purposes
 */
export { apiMetadataStorage };
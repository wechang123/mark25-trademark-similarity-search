/**
 * Validation Middleware for API Routes
 * 
 * Provides request/response validation middleware that integrates
 * with Swagger documentation and Zod schemas.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createApiDoc } from '../decorators/api-decorators';

export interface ValidationOptions<
  TBody = unknown,
  TQuery = unknown,
  TParams = unknown,
  TResponse = unknown
> {
  body?: z.ZodSchema<TBody>;
  query?: z.ZodSchema<TQuery>;
  params?: z.ZodSchema<TParams>;
  response?: z.ZodSchema<TResponse>;
}

export interface ApiValidationOptions<
  TBody = unknown,
  TQuery = unknown,
  TParams = unknown,
  TResponse = unknown
> extends ValidationOptions<TBody, TQuery, TParams, TResponse> {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  summary: string;
  description?: string;
  tags?: string[];
  requiresAuth?: boolean;
  errorResponses?: Record<number, string>;
}

// Simplified interface for new pattern
export interface SimpleValidationOptions<
  TBody = unknown,
  TQuery = unknown,
  TParams = unknown,
  TResponse = unknown
> {
  bodySchema?: z.ZodSchema<TBody>;
  querySchema?: z.ZodSchema<TQuery>;
  paramsSchema?: z.ZodSchema<TParams>;
  responseSchema?: z.ZodSchema<TResponse>;
  handler: (context: {
    request: NextRequest;
    validatedBody?: TBody;
    validatedQuery?: TQuery;
    validatedParams?: TParams;
  }) => Promise<NextResponse<TResponse>>;
}

// Function overloads
export function createValidatedApiRoute<
  TBody = unknown,
  TQuery = unknown,
  TParams = unknown,
  TResponse = unknown
>(
  options: ApiValidationOptions<TBody, TQuery, TParams, TResponse>,
  handler: (
    request: NextRequest,
    context: {
      params?: TParams;
      validatedBody?: TBody;
      validatedQuery?: TQuery;
      validatedParams?: TParams;
    }
  ) => Promise<NextResponse<TResponse>>
): (request: NextRequest, context: { params: Promise<Record<string, string>> }) => Promise<NextResponse>;

export function createValidatedApiRoute<
  TBody = unknown,
  TQuery = unknown,
  TParams = unknown,
  TResponse = unknown
>(
  options: SimpleValidationOptions<TBody, TQuery, TParams, TResponse>
): (request: NextRequest, context: { params: Promise<Record<string, string>> }) => Promise<NextResponse>;

export function createValidatedApiRoute<
  TBody = unknown,
  TQuery = unknown,
  TParams = unknown,
  TResponse = unknown
>(
  options: ApiValidationOptions<TBody, TQuery, TParams, TResponse> | SimpleValidationOptions<TBody, TQuery, TParams, TResponse>,
  handler?: (
    request: NextRequest,
    context: {
      params?: TParams;
      validatedBody?: TBody;
      validatedQuery?: TQuery;
      validatedParams?: TParams;
    }
  ) => Promise<NextResponse<TResponse>>
) {
  // Detect which pattern we're using
  const isSimplePattern = 'handler' in options && !handler;
  
  if (isSimplePattern) {
    const simpleOptions = options as SimpleValidationOptions<TBody, TQuery, TParams, TResponse>;

    // Return the validated handler for simple pattern
    return async (request: NextRequest, context: { params: Promise<Record<string, string>> }) => {
      try {
        const validatedData: {
          request: NextRequest;
          validatedBody?: TBody;
          validatedQuery?: TQuery;
          validatedParams?: TParams;
        } = { request };

        // Validate request body
        if (simpleOptions.bodySchema && request.method && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
          try {
            const body = await request.json();
            validatedData.validatedBody = simpleOptions.bodySchema.parse(body);
          } catch (error) {
            const result = {
              success: false,
              error: 'Invalid request body',
              details: error instanceof z.ZodError 
                ? error.errors.map(e => ({
                    path: e.path.join('.'),
                    message: e.message
                  }))
                : 'Request body parsing failed'
            };
            return NextResponse.json(result, { status: 400 });
          }
        }

        // Validate query parameters
        if (simpleOptions.querySchema) {
          try {
            const url = new URL(request.url);
            const queryParams = Object.fromEntries(url.searchParams.entries());
            validatedData.validatedQuery = simpleOptions.querySchema.parse(queryParams);
          } catch (error) {
            const result = {
              success: false,
              error: 'Invalid query parameters',
              details: error instanceof z.ZodError 
                ? error.errors.map(e => ({
                    path: e.path.join('.'),
                    message: e.message
                  }))
                : 'Query parameter validation failed'
            };
            return NextResponse.json(result, { status: 400 });
          }
        }

        // Validate route parameters
        if (simpleOptions.paramsSchema) {
          try {
            const resolvedParams = await context.params;
            validatedData.validatedParams = simpleOptions.paramsSchema.parse(resolvedParams);
          } catch (error) {
            const result = {
              success: false,
              error: 'Invalid route parameters',
              details: error instanceof z.ZodError 
                ? error.errors.map(e => ({
                    path: e.path.join('.'),
                    message: e.message
                  }))
                : 'Route parameter validation failed'
            };
            return NextResponse.json(result, { status: 400 });
          }
        }

        // Call the handler
        const result = await simpleOptions.handler(validatedData);
        
        // Return the result as JSON
        return NextResponse.json(result);

      } catch (error) {
        console.error('API route error:', error);
        const result = {
          success: false,
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'An unexpected error occurred'
        };
        return NextResponse.json(result, { status: 500 });
      }
    };
  } else {
    // Original pattern with full options
    const fullOptions = options as ApiValidationOptions<TBody, TQuery, TParams, TResponse>;
    const actualHandler = handler!;

    // Register API documentation
    createApiDoc({
      path: fullOptions.path,
      method: fullOptions.method.toLowerCase() as 'get' | 'post' | 'put' | 'patch' | 'delete',
      summary: fullOptions.summary,
      description: fullOptions.description,
      tags: fullOptions.tags,
      requestSchema: fullOptions.body,
      responseSchema: fullOptions.response,
      errorResponses: {
        400: 'Bad Request - Validation Error',
        500: 'Internal Server Error',
        ...fullOptions.errorResponses
      },
      requiresAuth: fullOptions.requiresAuth
    });

    // Return the validated handler
    return async (request: NextRequest, context: { params: Promise<Record<string, string>> }) => {
      try {
        const validatedData: {
          validatedBody?: TBody;
          validatedQuery?: TQuery;
          validatedParams?: TParams;
        } = {};

        // Validate request body
        if (fullOptions.body && ['POST', 'PUT', 'PATCH'].includes(fullOptions.method)) {
          try {
            const body = await request.json();
            validatedData.validatedBody = fullOptions.body.parse(body);
          } catch (error) {
            return NextResponse.json(
              {
                success: false,
                error: 'Invalid request body',
                details: error instanceof z.ZodError 
                  ? error.errors.map(e => ({
                      path: e.path.join('.'),
                      message: e.message
                    }))
                  : 'Request body parsing failed'
              },
              { status: 400 }
            );
          }
        }

        // Validate query parameters
        if (fullOptions.query) {
          try {
            const url = new URL(request.url);
            const queryParams = Object.fromEntries(url.searchParams.entries());
            validatedData.validatedQuery = fullOptions.query.parse(queryParams);
          } catch (error) {
            return NextResponse.json(
              {
                success: false,
                error: 'Invalid query parameters',
                details: error instanceof z.ZodError 
                  ? error.errors.map(e => ({
                      path: e.path.join('.'),
                      message: e.message
                    }))
                  : 'Query parameter validation failed'
              },
              { status: 400 }
            );
          }
        }

        // Validate route parameters
        if (fullOptions.params) {
          try {
            const resolvedParams = await context.params;
            validatedData.validatedParams = fullOptions.params.parse(resolvedParams);
          } catch (error) {
            return NextResponse.json(
              {
                success: false,
                error: 'Invalid route parameters',
                details: error instanceof z.ZodError 
                  ? error.errors.map(e => ({
                      path: e.path.join('.'),
                      message: e.message
                    }))
                  : 'Route parameter validation failed'
              },
              { status: 400 }
            );
          }
        }

        // Call the actual handler
        if (!handler) {
          throw new Error('Handler function is required for full validation pattern');
        }

        const resolvedParams = await context.params;
        const response = await handler(request, {
          params: resolvedParams as TParams,
          ...validatedData
        });

        // Validate response if schema is provided (development only)
        if (fullOptions.response && process.env.NODE_ENV === 'development') {
          try {
            const responseClone = response.clone();
            const responseBody = await responseClone.json();
            fullOptions.response.parse(responseBody);
          } catch (error) {
            console.warn('Response validation failed:', error);
            // Don't fail the request in production for response validation
          }
        }

        return response;

      } catch (error) {
        console.error('API route error:', error);
        return NextResponse.json(
          {
            success: false,
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'An unexpected error occurred'
          },
          { status: 500 }
        );
      }
    };
  }
}

/**
 * Simplified validation middleware for basic cases
 */
export function withValidation(options: ValidationOptions) {
  return function<T extends (...args: any[]) => any>(target: T): T {
    return (async (request: NextRequest, context?: any) => {
      const validatedData: any = {};

      // Validate request body
      if (options.body && request.method && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
        try {
          const body = await request.json();
          validatedData.validatedBody = options.body.parse(body);
        } catch (error) {
          return NextResponse.json(
            {
              success: false,
              error: 'Validation failed',
              details: error instanceof z.ZodError ? error.errors : 'Invalid request data'
            },
            { status: 400 }
          );
        }
      }

      // Validate query parameters
      if (options.query) {
        try {
          const url = new URL(request.url);
          const queryParams = Object.fromEntries(url.searchParams.entries());
          validatedData.validatedQuery = options.query.parse(queryParams);
        } catch (error) {
          return NextResponse.json(
            {
              success: false,
              error: 'Query validation failed',
              details: error instanceof z.ZodError ? error.errors : 'Invalid query parameters'
            },
            { status: 400 }
          );
        }
      }

      // Call original function with validated data
      return target(request, { ...context, ...validatedData });
    }) as any;
  };
}

/**
 * Authentication middleware that can be combined with validation
 */
export function requireAuth() {
  return function<T extends (...args: any[]) => any>(target: T): T {
    return (async (request: NextRequest, context?: any) => {
      const authHeader = request.headers.get('Authorization');
      const apiKey = request.headers.get('X-API-Key');
      
      if (!authHeader && !apiKey) {
        return NextResponse.json(
          {
            success: false,
            error: 'Authentication required',
            message: 'Please provide a valid Authorization header or API key'
          },
          { status: 401 }
        );
      }

      // Extract token from Authorization header
      let token: string | null = null;
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }

      // Add auth context
      const authContext = {
        token,
        apiKey,
        isAuthenticated: !!(token || apiKey)
      };

      return target(request, { ...context, auth: authContext });
    }) as any;
  };
}

/**
 * Rate limiting middleware
 */
export function withRateLimit(options: {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (request: NextRequest) => string;
}) {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return function<T extends (...args: any[]) => any>(target: T): T {
    return (async (request: NextRequest, context?: any) => {
      const key = options.keyGenerator ? 
        options.keyGenerator(request) : 
        request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous';
      
      const now = Date.now();
      const resetTime = now + options.windowMs;
      
      const userRequests = requests.get(key);
      
      if (!userRequests || now > userRequests.resetTime) {
        requests.set(key, { count: 1, resetTime });
      } else if (userRequests.count >= options.maxRequests) {
        return NextResponse.json(
          {
            success: false,
            error: 'Rate limit exceeded',
            message: `Too many requests. Try again in ${Math.ceil((userRequests.resetTime - now) / 1000)} seconds.`
          },
          { 
            status: 429,
            headers: {
              'Retry-After': Math.ceil((userRequests.resetTime - now) / 1000).toString()
            }
          }
        );
      } else {
        userRequests.count++;
      }

      return target(request, context);
    }) as any;
  };
}

/**
 * Compose multiple middleware functions
 */
export function compose<T extends (...args: any[]) => any>(...middlewares: Array<(target: T) => T>) {
  return function(target: T): T {
    return middlewares.reduce((acc, middleware) => middleware(acc), target);
  };
}

/**
 * Type-safe API response helpers
 */
export const ApiResponse = {
  success: <T = any>(data: T, status = 200) => 
    NextResponse.json({ success: true, data }, { status }),

  error: (message: string, details?: any, status = 400) => 
    NextResponse.json({ 
      success: false, 
      error: message, 
      details,
      timestamp: new Date().toISOString()
    }, { status }),

  validationError: (errors: z.ZodError) => 
    NextResponse.json({
      success: false,
      error: 'Validation failed',
      details: errors.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message,
        code: e.code
      }))
    }, { status: 400 })
};
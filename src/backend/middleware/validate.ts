/**
 * Request Validation Middleware
 * Validates request body/query/params using Zod schemas.
 */

import { NextRequest, NextResponse } from 'next/server';
import { ZodSchema, ZodError } from 'zod';
import { HTTP_STATUS } from '@/backend/constants';
import { createErrorResponse } from '@/backend/utils/response';
import type { AuthenticatedRequest } from '@/backend/types';

type ValidationSource = 'body' | 'query' | 'params';

interface ValidateOptions {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

/**
 * Extract data from request based on source.
 */
function getRequestData(req: NextRequest, source: ValidationSource): unknown {
  switch (source) {
    case 'body':
      return undefined;
    case 'query': {
      const searchParams = Object.fromEntries(req.nextUrl.searchParams.entries());
      return searchParams;
    }
    case 'params':
      return undefined;
    default:
      return undefined;
  }
}

/**
 * Validation middleware factory.
 * Usage: export const POST = validate({ body: registerSchema })((req) => { ... });
 */
export function validate(options: ValidateOptions) {
  return function (
    handler: (req: AuthenticatedRequest, parsed?: { body?: unknown; query?: unknown }) => Promise<NextResponse | Response>,
  ) {
    return async (req: NextRequest): Promise<NextResponse | Response> => {
      const requestId = `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
      const parsed: { body?: unknown; query?: unknown } = {};

      // Validate query params
      if (options.query) {
        const queryData = getRequestData(req, 'query');
        try {
          parsed.query = options.query.parse(queryData);
        } catch (error: unknown) {
          if (error instanceof ZodError) {
            return NextResponse.json(
              createErrorResponse('Invalid query parameters.', {
                statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY,
                code: 'VALIDATION_ERROR',
                details: error.flatten().fieldErrors as Record<string, string[]>,
                requestId,
              }),
              { status: HTTP_STATUS.UNPROCESSABLE_ENTITY },
            );
          }
          throw error;
        }
      }

      const authReq: AuthenticatedRequest = req as unknown as AuthenticatedRequest;
      authReq.requestId = requestId;

      return handler(authReq, parsed);
    };
  };
}

/**
 * Helper to validate request body inside a handler.
 * Usage: const body = await validateBody(req, registerSchema);
 */
export async function validateBody<T>(
  req: NextRequest,
  schema: ZodSchema<T>,
): Promise<{ data: T; error?: { statusCode: number; response: unknown } }> {
  try {
    const body = await req.json();
    const data = schema.parse(body);
    return { data };
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return {
        data: null as unknown as T,
        error: {
          statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY,
          response: {
            success: false,
            message: 'Invalid request body.',
            error: {
              code: 'VALIDATION_ERROR',
              details: error.flatten().fieldErrors as Record<string, string[]>,
            },
            timestamp: new Date().toISOString(),
          },
        },
      };
    }
    throw error;
  }
}

/**
 * Helper to validate route params inside a handler.
 * Usage: const params = await validateParams(context.params, idSchema);
 */
export function validateParams<T>(
  params: Record<string, string | string[] | undefined>,
  schema: ZodSchema<T>,
): { data: T; error?: { statusCode: number; response: unknown } } {
  try {
    const data = schema.parse(params);
    return { data };
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return {
        data: null as unknown as T,
        error: {
          statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY,
          response: {
            success: false,
            message: 'Invalid URL parameters.',
            error: {
              code: 'VALIDATION_ERROR',
              details: error.flatten().fieldErrors as Record<string, string[]>,
            },
            timestamp: new Date().toISOString(),
          },
        },
      };
    }
    throw error;
  }
}

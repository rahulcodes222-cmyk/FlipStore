/**
 * Centralized Error Handling Middleware
 * Catches errors from route handlers and returns consistent
 * API error responses with proper HTTP status codes.
 */
// eslint-disable-file @typescript-eslint/no-explicit-any

import { NextRequest, NextResponse } from 'next/server';
import { HTTP_STATUS, HttpStatusCode } from '@/backend/constants';
import { createErrorResponse } from '@/backend/utils/response';
import { isTokenExpiredError, isTokenInvalidError } from '@/backend/utils/jwt';

/**
 * Custom application error class.
 */
export class AppError extends Error {
  public statusCode: HttpStatusCode;
  public code: string;
  public details?: Record<string, string[]>;

  constructor(
    message: string,
    statusCode: HttpStatusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    code: string = 'INTERNAL_ERROR',
    details?: Record<string, string[]>,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.name = 'AppError';
  }
}

/**
 * Extract validation error details from Zod error.
 */
function extractZodErrorDetails(error: unknown): Record<string, string[]> | undefined {
  if (error && typeof error === 'object' && 'issues' in error) {
    const issues = (error as { issues: Array<{ path: string[]; message: string }> }).issues;
    const details: Record<string, string[]> = {};
    for (const issue of issues) {
      const field = issue.path.join('.') || 'general';
      if (!details[field]) details[field] = [];
      details[field].push(issue.message);
    }
    return details;
  }
  return undefined;
}

/**
 * Mongoose error codes.
 */
const MONGOOSE_ERROR_CODES: Record<string, { statusCode: HttpStatusCode; code: string }> = {
  11000: { statusCode: HTTP_STATUS.CONFLICT, code: 'DUPLICATE_KEY' },
  'ValidationError': { statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY, code: 'VALIDATION_ERROR' },
  'CastError': { statusCode: HTTP_STATUS.BAD_REQUEST, code: 'INVALID_ID' },
};

/**
 * Centralized error handler for API routes.
 * Usage: wrap route handler with errorHandler(async (req) => { ... })
 */
export function errorHandler(
  handler: (req: NextRequest) => Promise<NextResponse | Response>,
) {
  return async (req: NextRequest): Promise<NextResponse | Response> => {
    const requestId = `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

    try {
      return await handler(req);
    } catch (error: unknown) {
      // AppError - custom application errors
      if (error instanceof AppError) {
        return NextResponse.json(
          createErrorResponse(error.message, {
            statusCode: error.statusCode,
            code: error.code,
            details: error.details,
            requestId,
          }),
          { status: error.statusCode },
        );
      }

      // JWT token errors
      if (isTokenExpiredError(error)) {
        return NextResponse.json(
          createErrorResponse('Session expired. Please log in again.', {
            statusCode: HTTP_STATUS.UNAUTHORIZED,
            code: 'TOKEN_EXPIRED',
            requestId,
          }),
          { status: HTTP_STATUS.UNAUTHORIZED },
        );
      }
      if (isTokenInvalidError(error)) {
        return NextResponse.json(
          createErrorResponse('Invalid or malformed token.', {
            statusCode: HTTP_STATUS.UNAUTHORIZED,
            code: 'TOKEN_INVALID',
            requestId,
          }),
          { status: HTTP_STATUS.UNAUTHORIZED },
        );
      }

      // Mongoose duplicate key error (code 11000)
      if (error && typeof error === 'object' && 'code' in error) {
        const mongoError = error as { code?: number; name?: string; message?: string };
        if (mongoError.code === 11000) {
          const field = Object.keys((mongoError as { keyValue?: Record<string, unknown> }).keyValue || {}).join(', ');
          return NextResponse.json(
            createErrorResponse(
              `${field} already exists.`,
              {
                statusCode: HTTP_STATUS.CONFLICT,
                code: 'DUPLICATE_KEY',
                details: { [field]: ['Duplicate value'] },
                requestId,
              },
            ),
            { status: HTTP_STATUS.CONFLICT },
          );
        }
      }

      // Mongoose validation error
      if (error && typeof error === 'object' && 'name' in error) {
        const mongooseError = error as { name?: string; message?: string; errors?: unknown };
        if (mongooseError.name === 'ValidationError') {
          return NextResponse.json(
            createErrorResponse(RESPONSE_MESSAGES.VALIDATION_ERROR, {
              statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY,
              code: 'VALIDATION_ERROR',
              details: extractZodErrorDetails(mongooseError.errors) || undefined,
              requestId,
            }),
            { status: HTTP_STATUS.UNPROCESSABLE_ENTITY },
          );
        }
        if (mongooseError.name === 'CastError') {
          return NextResponse.json(
            createErrorResponse('Invalid resource ID format.', {
              statusCode: HTTP_STATUS.BAD_REQUEST,
              code: 'INVALID_ID',
              requestId,
            }),
            { status: HTTP_STATUS.BAD_REQUEST },
          );
        }
      }

      // Zod validation errors
      const zodDetails = extractZodErrorDetails(error);
      if (zodDetails) {
        return NextResponse.json(
          createErrorResponse(RESPONSE_MESSAGES.VALIDATION_ERROR, {
            statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY,
            code: 'VALIDATION_ERROR',
            details: zodDetails,
            requestId,
          }),
          { status: HTTP_STATUS.UNPROCESSABLE_ENTITY },
        );
      }

      // Unknown error - log and return generic error
      console.error(`[${requestId}] Unhandled error:`, error);

      const message =
        process.env.NODE_ENV === 'development'
          ? (error as Error)?.message ?? RESPONSE_MESSAGES.INTERNAL_SERVER_ERROR
          : RESPONSE_MESSAGES.INTERNAL_SERVER_ERROR;

      return NextResponse.json(
        createErrorResponse(message, {
          statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
          code: 'INTERNAL_ERROR',
          requestId,
        }),
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
      );
    }
  };
}

import { RESPONSE_MESSAGES } from '@/backend/constants';

export { errorHandler as withErrorHandler };

/**
 * API Response Helpers
 * Consistent response envelope for all backend API routes.
 */

import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/backend/constants';
import type { ApiResponse, PaginatedApiResponse } from '@/backend/types';
import type { HttpStatusCode } from '@/backend/constants';

/**
 * Create a success response.
 */
export function createSuccessResponse<T>(
  data: T,
  options?: {
    message?: string;
    statusCode?: HttpStatusCode;
    meta?: PaginatedApiResponse<T>['meta'];
    requestId?: string;
  },
): ApiResponse<T> {
  return {
    success: true,
    message: options?.message ?? RESPONSE_MESSAGES.SUCCESS,
    data,
    meta: options?.meta,
    timestamp: new Date().toISOString(),
    requestId: options?.requestId,
  };
}

/**
 * Create a paginated success response.
 */
export function createPaginatedResponse<T>(
  data: T[],
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  },
  options?: {
    message?: string;
    statusCode?: HttpStatusCode;
    requestId?: string;
  },
): PaginatedApiResponse<T> {
  return {
    success: true,
    message: options?.message ?? RESPONSE_MESSAGES.SUCCESS,
    data,
    meta,
    timestamp: new Date().toISOString(),
    requestId: options?.requestId,
  };
}

/**
 * Create an error response.
 */
export function createErrorResponse(
  message: string,
  options?: {
    statusCode?: HttpStatusCode;
    code?: string;
    details?: Record<string, string[]>;
    requestId?: string;
  },
): ApiResponse<null> {
  return {
    success: false,
    message,
    error: {
      code: options?.code ?? 'INTERNAL_ERROR',
      details: options?.details,
    },
    timestamp: new Date().toISOString(),
    requestId: options?.requestId,
  };
}

/**
 * Standard response message helpers
 */
export const ResponseMessages = {
  success: (msg: string = RESPONSE_MESSAGES.SUCCESS) => msg,
  created: (msg: string = RESPONSE_MESSAGES.CREATED) => msg,
  updated: (msg: string = RESPONSE_MESSAGES.UPDATED) => msg,
  deleted: (msg: string = RESPONSE_MESSAGES.DELETED) => msg,
  notFound: (resource: string = 'Resource') => `${resource} not found.`,
  unauthorized: () => RESPONSE_MESSAGES.UNAUTHORIZED,
  forbidden: () => RESPONSE_MESSAGES.FORBIDDEN,
  validationError: (msg: string = RESPONSE_MESSAGES.VALIDATION_ERROR) => msg,
  emailAlreadyExists: () => RESPONSE_MESSAGES.EMAIL_ALREADY_EXISTS,
  phoneAlreadyExists: () => RESPONSE_MESSAGES.PHONE_ALREADY_EXISTS,
  invalidCredentials: () => RESPONSE_MESSAGES.INVALID_CREDENTIALS,
  accountNotFound: () => RESPONSE_MESSAGES.ACCOUNT_NOT_FOUND,
  internalError: (msg: string = RESPONSE_MESSAGES.INTERNAL_SERVER_ERROR) => msg,
} as const;

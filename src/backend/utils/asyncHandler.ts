/**
 * Async Error Wrapper
 * Wraps async route handlers to automatically catch errors
 * and pass them to Next.js error handling middleware.
 */

import type { NextRequest, NextResponse } from 'next/server';

export type AsyncRouteHandler = (
  req: NextRequest,
) => Promise<NextResponse | Response>;

/**
 * Wraps an async route handler so that thrown errors
 * are caught and can be handled by the centralized error middleware.
 */
export function asyncHandler(handler: AsyncRouteHandler): AsyncRouteHandler {
  return async (req: NextRequest) => {
    try {
      return await handler(req);
    } catch (error: unknown) {
      // Re-throw so the error middleware in the route can catch it
      throw error;
    }
  };
}

/**
 * Generate a unique request ID for tracing.
 */
export function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Database Connection Middleware
 * Ensures MongoDB is connected before processing API requests.
 * Safe to call on every request - connection is cached.
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/backend/config/db';
import { createErrorResponse } from '@/backend/utils/response';
import { HTTP_STATUS } from '@/backend/constants';

/**
 * Middleware wrapper to ensure DB connection before handler execution.
 * Usage: export const GET = withDatabase(async (req) => { ... });
 */
export function withDatabase(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>,
) {
  return async (req: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      await connectDB();
      return handler(req, context);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Database connection unavailable.';
      console.error('[Database] Connection failed:', error);
      return NextResponse.json(
        createErrorResponse(
          process.env.NODE_ENV === 'production'
            ? 'Database connection unavailable.'
            : `Database connection unavailable: ${message}`,
          {
            statusCode: HTTP_STATUS.SERVICE_UNAVAILABLE,
            code: 'DB_CONNECTION_ERROR',
          },
        ),
        { status: HTTP_STATUS.SERVICE_UNAVAILABLE },
      );
    }
  };
}

export async function ensureDBConnection(): Promise<void> {
  await connectDB();
}

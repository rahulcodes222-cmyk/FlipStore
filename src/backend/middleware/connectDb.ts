/**
 * Database Connection Middleware
 * Ensures MongoDB is connected before processing API requests.
 * Safe to call on every request - connection is cached.
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB, runWithDbReconnect } from '@/backend/config/db';
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
      return await runWithDbReconnect(() => handler(req, context));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Database connection unavailable.';
      console.error('[Database] Connection/request failed:', error);
      const isConnMsg = /client must be connected|topology is closed|connection closed|server selection timed out|database connection/i.test(message);
      return NextResponse.json(
        createErrorResponse(
          process.env.NODE_ENV === 'production'
            ? (isConnMsg ? 'Database connection unavailable.' : 'Request failed.')
            : `${isConnMsg ? 'Database connection unavailable' : 'Request failed'}: ${message}`,
          {
            statusCode: isConnMsg ? HTTP_STATUS.SERVICE_UNAVAILABLE : HTTP_STATUS.INTERNAL_SERVER_ERROR,
            code: isConnMsg ? 'DB_CONNECTION_ERROR' : 'REQUEST_FAILED',
          },
        ),
        { status: isConnMsg ? HTTP_STATUS.SERVICE_UNAVAILABLE : HTTP_STATUS.INTERNAL_SERVER_ERROR },
      );
    }
  };
}

export async function ensureDBConnection(): Promise<void> {
  await connectDB();
}

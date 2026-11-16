/**
 * Authentication Middleware
 * Verifies JWT access token from Authorization header or cookies
 * and attaches user info to the request object.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, extractTokenFromHeader } from '@/backend/utils/jwt';
import { createErrorResponse } from '@/backend/utils/response';
import { HTTP_STATUS } from '@/backend/constants';
import type { JWTPayload, AuthenticatedRequest } from '@/backend/types';

export type { AuthenticatedRequest };

/**
 * Extract token from cookies or Authorization header.
 */
function getTokenFromRequest(req: NextRequest): string | null {
  // Try Authorization header first
  const authHeader = req.headers.get('authorization');
  const tokenFromHeader = extractTokenFromHeader(authHeader);
  if (tokenFromHeader) return tokenFromHeader;

  // Fallback to cookie
  const tokenFromCookie = req.cookies.get('access_token')?.value;
  if (tokenFromCookie) return tokenFromCookie;

  return null;
}

/**
 * Authentication middleware wrapper.
 * Usage: export const GET = withAuth(async (req) => { ... });
 */
export function withAuth(
  handler: (req: AuthenticatedRequest, context?: any) => Promise<NextResponse>,
) {
  return async (req: NextRequest, context?: any): Promise<NextResponse> => {
    const requestId = `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

    const token = getTokenFromRequest(req);

    if (!token) {
      return NextResponse.json(
        createErrorResponse('Authentication required.', {
          statusCode: HTTP_STATUS.UNAUTHORIZED,
          code: 'AUTH_REQUIRED',
          requestId,
        }),
        { status: HTTP_STATUS.UNAUTHORIZED },
      );
    }

    let payload: JWTPayload;
    try {
      payload = verifyAccessToken(token);
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'TokenExpiredError') {
        return NextResponse.json(
          createErrorResponse('Session expired. Please log in again.', {
            statusCode: HTTP_STATUS.UNAUTHORIZED,
            code: 'TOKEN_EXPIRED',
            requestId,
          }),
          { status: HTTP_STATUS.UNAUTHORIZED },
        );
      }
      return NextResponse.json(
        createErrorResponse('Invalid or malformed token.', {
          statusCode: HTTP_STATUS.UNAUTHORIZED,
          code: 'TOKEN_INVALID',
          requestId,
        }),
        { status: HTTP_STATUS.UNAUTHORIZED },
      );
    }

    const authReq = req as unknown as AuthenticatedRequest;
    authReq.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
    authReq.requestId = requestId;

    return handler(authReq, context);
  };
}

/**
 * Optional authentication - attaches user if token is valid,
 * but doesn't require it. Useful for public endpoints that
 * behave differently for logged-in users.
 */
export function withOptionalAuth(
  handler: (req: AuthenticatedRequest, context?: any) => Promise<NextResponse>,
) {
  return async (req: NextRequest, context?: any): Promise<NextResponse> => {
    const requestId = `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    const authReq = req as unknown as AuthenticatedRequest;
    authReq.requestId = requestId;

    const token = getTokenFromRequest(req);
    if (token) {
      try {
        const payload = verifyAccessToken(token);
        authReq.user = {
          id: payload.sub,
          email: payload.email,
          role: payload.role,
        };
      } catch {
        // Token invalid but we continue without user context
      }
    }

    return handler(authReq, context);
  };
}

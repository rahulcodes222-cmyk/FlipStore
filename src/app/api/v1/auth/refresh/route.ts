/**
 * POST /api/v1/auth/refresh
 * Refresh access token using refresh token from HTTP-only cookie.
 */

import { NextRequest, NextResponse } from 'next/server';
import { refreshPOST as refreshHandler } from '@/backend/controllers/authController';

export async function POST(req: NextRequest): Promise<NextResponse> {
  return (await refreshHandler(req)) as NextResponse;
}

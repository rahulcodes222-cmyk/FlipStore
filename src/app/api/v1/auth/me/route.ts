/**
 * GET /api/v1/auth/me
 * Get current authenticated user profile.
 */

import { NextRequest, NextResponse } from 'next/server';
import { meGET as meHandler } from '@/backend/controllers/authController';

export async function GET(req: NextRequest): Promise<NextResponse> {
  return (await meHandler(req)) as NextResponse;
}

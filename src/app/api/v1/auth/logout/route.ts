/**
 * POST /api/v1/auth/logout
 * User logout endpoint.
 */

import { NextRequest, NextResponse } from 'next/server';
import { logoutPOST as logoutHandler } from '@/backend/controllers/authController';

export async function POST(req: NextRequest): Promise<NextResponse> {
  return (await logoutHandler(req)) as NextResponse;
}

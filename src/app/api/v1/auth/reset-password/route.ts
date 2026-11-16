/**
 * POST /api/v1/auth/reset-password
 * Reset password with token.
 */

import { NextRequest, NextResponse } from 'next/server';
import { resetPasswordPOST as resetPasswordHandler } from '@/backend/controllers/authController';

export async function POST(req: NextRequest): Promise<NextResponse> {
  return (await resetPasswordHandler(req)) as NextResponse;
}

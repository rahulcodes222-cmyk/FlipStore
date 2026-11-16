/**
 * POST /api/v1/auth/forgot-password
 * Request password reset.
 */

import { NextRequest, NextResponse } from 'next/server';
import { forgotPasswordPOST as forgotPasswordHandler } from '@/backend/controllers/authController';

export async function POST(req: NextRequest): Promise<NextResponse> {
  return (await forgotPasswordHandler(req)) as NextResponse;
}

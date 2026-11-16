/**
 * POST /api/v1/auth/change-password
 * Change password for authenticated user.
 */

import { NextRequest, NextResponse } from 'next/server';
import { changePasswordPOST as changePasswordHandler } from '@/backend/controllers/authController';

export async function POST(req: NextRequest): Promise<NextResponse> {
  return (await changePasswordHandler(req)) as NextResponse;
}

/**
 * POST /api/v1/auth/login
 * User login endpoint.
 */

import { NextRequest, NextResponse } from 'next/server';
import { loginPOST as loginHandler } from '@/backend/controllers/authController';

export async function POST(req: NextRequest): Promise<NextResponse> {
  return (await loginHandler(req)) as NextResponse;
}

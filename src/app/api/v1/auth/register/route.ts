/**
 * POST /api/v1/auth/register
 * Customer registration endpoint.
 */

import { NextRequest, NextResponse } from 'next/server';
import { POST as registerHandler } from '@/backend/controllers/authController';

export async function POST(req: NextRequest): Promise<NextResponse> {
  return (await registerHandler(req)) as NextResponse;
}

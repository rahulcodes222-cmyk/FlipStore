import { NextRequest, NextResponse } from 'next/server';
import { googleLoginPOST } from '@/backend/controllers/authController';

export async function POST(req: NextRequest): Promise<NextResponse> {
  return (await googleLoginPOST(req)) as NextResponse;
}

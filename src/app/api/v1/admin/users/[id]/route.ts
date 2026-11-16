import { NextRequest, NextResponse } from 'next/server';
import { adminUserGET } from '@/backend/controllers/userController';

export async function GET(req: NextRequest): Promise<NextResponse> {
  return (await adminUserGET(req as any, null)) as NextResponse;
}

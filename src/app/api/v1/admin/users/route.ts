import { NextRequest, NextResponse } from 'next/server';
import { adminUsersGET } from '@/backend/controllers/userController';

export async function GET(req: NextRequest): Promise<NextResponse> {
  return (await adminUsersGET(req as any, null)) as NextResponse;
}

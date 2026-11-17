import { NextRequest, NextResponse } from 'next/server';
import { adminProductRequestChangesPOST } from '@/backend/controllers/adminProductApprovalController';

export async function POST(req: NextRequest): Promise<NextResponse> {
  return (await adminProductRequestChangesPOST(req as any, null)) as NextResponse;
}

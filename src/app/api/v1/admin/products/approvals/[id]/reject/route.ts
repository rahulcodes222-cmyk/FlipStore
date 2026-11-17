import { NextRequest, NextResponse } from 'next/server';
import { adminProductRejectPOST } from '@/backend/controllers/adminProductApprovalController';

export async function POST(req: NextRequest): Promise<NextResponse> {
  return (await adminProductRejectPOST(req as any, null)) as NextResponse;
}

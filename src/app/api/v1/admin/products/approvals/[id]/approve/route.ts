import { NextRequest, NextResponse } from 'next/server';
import { adminProductApprovePOST } from '@/backend/controllers/adminProductApprovalController';

export async function POST(req: NextRequest): Promise<NextResponse> {
  return (await adminProductApprovePOST(req as any, null)) as NextResponse;
}

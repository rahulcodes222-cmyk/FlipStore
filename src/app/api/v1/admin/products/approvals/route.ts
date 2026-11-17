import { NextRequest, NextResponse } from 'next/server';
import { adminProductApprovalsGET } from '@/backend/controllers/adminProductApprovalController';

export async function GET(req: NextRequest): Promise<NextResponse> {
  return (await adminProductApprovalsGET(req as any, null)) as NextResponse;
}

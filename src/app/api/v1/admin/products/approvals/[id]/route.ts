import { NextRequest, NextResponse } from 'next/server';
import { adminProductApprovalByIdGET } from '@/backend/controllers/adminProductApprovalController';

export async function GET(req: NextRequest): Promise<NextResponse> {
  return (await adminProductApprovalByIdGET(req as any, null)) as NextResponse;
}

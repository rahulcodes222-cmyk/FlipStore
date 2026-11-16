import { NextRequest, NextResponse } from 'next/server';
import { returnPATCH } from '@/backend/controllers/returnController';
export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  return (await returnPATCH(req as any, context)) as NextResponse;
}

import { NextRequest, NextResponse } from 'next/server';
import { orderStatusPATCH } from '@/backend/controllers/orderController';
export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  return (await orderStatusPATCH(req as any, context)) as NextResponse;
}

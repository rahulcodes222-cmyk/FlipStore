import { NextRequest, NextResponse } from 'next/server';
import { orderCancelPATCH } from '@/backend/controllers/orderController';
export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  return (await orderCancelPATCH(req as any, context)) as NextResponse;
}

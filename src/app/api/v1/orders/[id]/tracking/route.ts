import { NextRequest, NextResponse } from 'next/server';
import { orderTrackingGET } from '@/backend/controllers/orderController';
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  return (await orderTrackingGET(req as any, context)) as NextResponse;
}

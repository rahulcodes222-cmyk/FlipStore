import { NextRequest, NextResponse } from 'next/server';
import { ordersGET } from '@/backend/controllers/orderController';

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  return (await ordersGET(req as any, context)) as NextResponse;
}


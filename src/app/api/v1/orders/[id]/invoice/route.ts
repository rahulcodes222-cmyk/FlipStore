import { NextRequest, NextResponse } from 'next/server';
import { orderInvoiceGET } from '@/backend/controllers/orderController';
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  return (await orderInvoiceGET(req as any, context)) as NextResponse;
}

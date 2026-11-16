import { NextRequest, NextResponse } from 'next/server';
import { myOrdersGET, ordersPOST } from '@/backend/controllers/orderController';

export async function GET(req: NextRequest): Promise<NextResponse> {
  return (await myOrdersGET(req as any)) as NextResponse;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  return (await ordersPOST(req)) as NextResponse;
}


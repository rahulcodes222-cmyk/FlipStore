import { NextRequest, NextResponse } from 'next/server';
import { checkoutCouponValidatePOST } from '@/backend/controllers/orderController';

export async function POST(req: NextRequest): Promise<NextResponse> {
  return (await checkoutCouponValidatePOST(req as any)) as NextResponse;
}

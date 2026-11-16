/**
 * POST /api/v1/checkout/summary
 * Calculate checkout summary from cart items.
 * Returns pricing breakdown without creating an order.
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkoutSummaryPOST } from '@/backend/controllers/orderController';

export async function POST(req: NextRequest): Promise<NextResponse> {
  return (await checkoutSummaryPOST(req)) as NextResponse;
}

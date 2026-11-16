/**
 * POST /api/v1/wishlist/move-to-cart - Move item from wishlist to cart
 */

import { NextRequest, NextResponse } from 'next/server';
import { wishlistMoveToCartPOST } from '@/backend/controllers/wishlistController';

export async function POST(req: NextRequest): Promise<NextResponse> {
  return (await wishlistMoveToCartPOST(req)) as NextResponse;
}

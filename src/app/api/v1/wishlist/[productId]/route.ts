/**
 * DELETE /api/v1/wishlist/:productId - Remove item from wishlist
 */

import { NextRequest, NextResponse } from 'next/server';
import { wishlistItemDelete } from '@/backend/controllers/wishlistController';

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  return (await wishlistItemDelete(req)) as NextResponse;
}

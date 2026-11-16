/**
 * GET /api/v1/wishlist - Get wishlist
 * POST /api/v1/wishlist - Add item to wishlist
 */

import { NextRequest, NextResponse } from 'next/server';
import { wishlistGET, wishlistPOST } from '@/backend/controllers/wishlistController';

export async function GET(req: NextRequest): Promise<NextResponse> {
  return (await wishlistGET(req)) as NextResponse;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  return (await wishlistPOST(req)) as NextResponse;
}

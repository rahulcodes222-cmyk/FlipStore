/**
 * GET /api/v1/cart - Get current user's cart
 * DELETE /api/v1/cart - Clear cart
 */

import { NextRequest, NextResponse } from 'next/server';
import { cartGET, cartDELETE } from '@/backend/controllers/cartController';

export async function GET(req: NextRequest): Promise<NextResponse> {
  return (await cartGET(req)) as NextResponse;
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  return (await cartDELETE(req)) as NextResponse;
}

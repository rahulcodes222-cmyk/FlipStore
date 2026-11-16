/**
 * POST /api/v1/cart/items - Add item to cart
 * PATCH /api/v1/cart/items/:id - Update item quantity
 * DELETE /api/v1/cart/items/:id - Delete item from cart
 */

import { NextRequest, NextResponse } from 'next/server';
import { cartItemsPOST, cartItemPatch, cartItemDelete } from '@/backend/controllers/cartController';

export async function POST(req: NextRequest): Promise<NextResponse> {
  return (await cartItemsPOST(req)) as NextResponse;
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  return (await cartItemPatch(req)) as NextResponse;
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  return (await cartItemDelete(req)) as NextResponse;
}

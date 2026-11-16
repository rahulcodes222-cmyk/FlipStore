/**
 * PATCH /api/v1/users/addresses/:id - Edit an address
 * DELETE /api/v1/users/addresses/:id - Delete an address
 */

import { NextRequest, NextResponse } from 'next/server';
import { addressPatch, addressDelete } from '@/backend/controllers/userController';

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  return (await addressPatch(req)) as NextResponse;
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  return (await addressDelete(req)) as NextResponse;
}

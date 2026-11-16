/**
 * PATCH /api/v1/users/addresses/:id/default - Set default address
 */

import { NextRequest, NextResponse } from 'next/server';
import { addressDefaultPatch } from '@/backend/controllers/userController';

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  return (await addressDefaultPatch(req)) as NextResponse;
}

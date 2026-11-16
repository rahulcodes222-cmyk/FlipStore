/**
 * POST /api/v1/auth/register/vendor
 * Vendor registration endpoint (Part 11 compatible).
 */

import { NextRequest, NextResponse } from 'next/server';
import { vendorRegisterPOST as vendorRegisterHandler } from '@/backend/controllers/vendorController';

export async function POST(req: NextRequest): Promise<NextResponse> {
  return (await vendorRegisterHandler(req)) as NextResponse;
}

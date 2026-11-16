import { NextRequest, NextResponse } from 'next/server';
import { adminVendorStatusPATCH } from '@/backend/controllers/vendorController';

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  return (await adminVendorStatusPATCH(req as any, null)) as NextResponse;
}

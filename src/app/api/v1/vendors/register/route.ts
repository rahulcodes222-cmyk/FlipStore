import { NextRequest, NextResponse } from 'next/server';
import { vendorRegisterPOST } from '@/backend/controllers/vendorController';

export async function POST(req: NextRequest): Promise<NextResponse> {
  return (await vendorRegisterPOST(req)) as NextResponse;
}

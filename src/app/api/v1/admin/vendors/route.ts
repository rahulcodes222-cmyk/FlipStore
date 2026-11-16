import { NextRequest, NextResponse } from 'next/server';
import { adminVendorsGET } from '@/backend/controllers/vendorController';

export async function GET(req: NextRequest): Promise<NextResponse> {
  return (await adminVendorsGET(req as any, null)) as NextResponse;
}

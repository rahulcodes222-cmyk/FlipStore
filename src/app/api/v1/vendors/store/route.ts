import { NextRequest, NextResponse } from 'next/server';
import { vendorStoreGET, vendorStorePATCH } from '@/backend/controllers/vendorController';

export async function GET(req: NextRequest): Promise<NextResponse> {
  return (await vendorStoreGET(req as any, null)) as NextResponse;
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  return (await vendorStorePATCH(req as any, null)) as NextResponse;
}

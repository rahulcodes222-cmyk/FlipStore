import { NextRequest, NextResponse } from 'next/server';
import { vendorApplicationGET, vendorApplicationPATCH } from '@/backend/controllers/vendorController';

export async function GET(req: NextRequest): Promise<NextResponse> {
  return (await vendorApplicationGET(req as any, null)) as NextResponse;
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  return (await vendorApplicationPATCH(req as any, null)) as NextResponse;
}

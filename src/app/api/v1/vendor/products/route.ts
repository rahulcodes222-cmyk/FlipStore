import { NextRequest, NextResponse } from 'next/server';
import { vendorProductsGET, vendorProductsPOST } from '@/backend/controllers/vendorCommerceController';
export async function GET(req: NextRequest): Promise<NextResponse> { return (await vendorProductsGET(req as any)) as NextResponse; }
export async function POST(req: NextRequest): Promise<NextResponse> { return (await vendorProductsPOST(req as any)) as NextResponse; }

import { NextRequest, NextResponse } from 'next/server';
import { vendorOrdersGET } from '@/backend/controllers/vendorCommerceController';
export async function GET(req: NextRequest): Promise<NextResponse> { return (await vendorOrdersGET(req as any)) as NextResponse; }

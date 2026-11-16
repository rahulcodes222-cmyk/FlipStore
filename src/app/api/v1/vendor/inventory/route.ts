import { NextRequest, NextResponse } from 'next/server';
import { vendorInventoryGET } from '@/backend/controllers/vendorCommerceController';
export async function GET(req: NextRequest): Promise<NextResponse> { return (await vendorInventoryGET(req as any)) as NextResponse; }

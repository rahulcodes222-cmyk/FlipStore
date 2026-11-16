import { NextRequest, NextResponse } from 'next/server';
import { vendorInventoryHistoryGET } from '@/backend/controllers/vendorCommerceController';
export async function GET(req: NextRequest): Promise<NextResponse> { return (await vendorInventoryHistoryGET(req as any)) as NextResponse; }

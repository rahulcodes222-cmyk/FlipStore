import { NextRequest, NextResponse } from 'next/server';
import { vendorReturnsGET } from '@/backend/controllers/vendorCommerceController';
export async function GET(req: NextRequest): Promise<NextResponse> { return (await vendorReturnsGET(req as any)) as NextResponse; }

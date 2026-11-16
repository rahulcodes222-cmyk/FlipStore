import { NextRequest, NextResponse } from 'next/server';
import { vendorCustomersGET } from '@/backend/controllers/vendorCommerceController';
export async function GET(req: NextRequest): Promise<NextResponse> { return (await vendorCustomersGET(req as any)) as NextResponse; }

import { NextRequest, NextResponse } from 'next/server';
import { vendorOrderByIdGET } from '@/backend/controllers/vendorCommerceController';
export async function GET(req: NextRequest, ctx: any): Promise<NextResponse> { return (await vendorOrderByIdGET(req as any, ctx)) as NextResponse; }

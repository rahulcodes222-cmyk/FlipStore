import { NextRequest, NextResponse } from 'next/server';
import { vendorOrderStatusPATCH } from '@/backend/controllers/vendorCommerceController';
export async function PATCH(req: NextRequest, ctx: any): Promise<NextResponse> { return (await vendorOrderStatusPATCH(req as any, ctx)) as NextResponse; }

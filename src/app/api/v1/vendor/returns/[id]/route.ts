import { NextRequest, NextResponse } from 'next/server';
import { vendorReturnPATCH } from '@/backend/controllers/vendorCommerceController';
export async function PATCH(req: NextRequest, ctx: any): Promise<NextResponse> { return (await vendorReturnPATCH(req as any, ctx)) as NextResponse; }

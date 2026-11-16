import { NextRequest, NextResponse } from 'next/server';
import { vendorProductSubmitPATCH } from '@/backend/controllers/vendorCommerceController';
export async function PATCH(req: NextRequest, ctx: any): Promise<NextResponse> { return (await vendorProductSubmitPATCH(req as any, ctx)) as NextResponse; }
export async function POST(req: NextRequest, ctx: any): Promise<NextResponse> { return (await vendorProductSubmitPATCH(req as any, ctx)) as NextResponse; }

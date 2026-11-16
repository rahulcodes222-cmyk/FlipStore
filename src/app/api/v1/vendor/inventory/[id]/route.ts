import { NextRequest, NextResponse } from 'next/server';
import { vendorInventoryPATCH } from '@/backend/controllers/vendorCommerceController';
export async function PATCH(req: NextRequest, ctx: any): Promise<NextResponse> { return (await vendorInventoryPATCH(req as any, ctx)) as NextResponse; }
export async function POST(req: NextRequest, ctx: any): Promise<NextResponse> { return (await vendorInventoryPATCH(req as any, ctx)) as NextResponse; }

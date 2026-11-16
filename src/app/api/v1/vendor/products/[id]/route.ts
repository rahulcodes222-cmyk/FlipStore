import { NextRequest, NextResponse } from 'next/server';
import { vendorProductByIdGET, vendorProductByIdPATCH, vendorProductByIdDELETE } from '@/backend/controllers/vendorCommerceController';
export async function GET(req: NextRequest, ctx: any): Promise<NextResponse> { return (await vendorProductByIdGET(req as any, ctx)) as NextResponse; }
export async function PATCH(req: NextRequest, ctx: any): Promise<NextResponse> { return (await vendorProductByIdPATCH(req as any, ctx)) as NextResponse; }
export async function DELETE(req: NextRequest, ctx: any): Promise<NextResponse> { return (await vendorProductByIdDELETE(req as any, ctx)) as NextResponse; }

import { NextRequest, NextResponse } from 'next/server';
import { adminPayoutByIdPATCH } from '@/backend/controllers/vendorFinanceController';
export async function PATCH(req: NextRequest): Promise<NextResponse> { return (await adminPayoutByIdPATCH(req as any)) as NextResponse; }
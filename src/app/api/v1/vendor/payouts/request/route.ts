import { NextRequest, NextResponse } from 'next/server';
import { vendorPayoutRequestPOST } from '@/backend/controllers/vendorFinanceController';
export async function POST(req: NextRequest): Promise<NextResponse> { return (await vendorPayoutRequestPOST(req as any)) as NextResponse; }

import { NextRequest, NextResponse } from 'next/server';
import { vendorPayoutsGET } from '@/backend/controllers/vendorFinanceController';
export async function GET(req: NextRequest): Promise<NextResponse> { return (await vendorPayoutsGET(req as any)) as NextResponse; }

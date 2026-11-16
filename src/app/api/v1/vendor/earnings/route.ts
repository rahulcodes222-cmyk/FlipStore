import { NextRequest, NextResponse } from 'next/server';
import { vendorEarningsGET } from '@/backend/controllers/vendorFinanceController';
export async function GET(req: NextRequest): Promise<NextResponse> { return (await vendorEarningsGET(req as any)) as NextResponse; }

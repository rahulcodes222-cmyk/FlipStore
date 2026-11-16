import { NextRequest, NextResponse } from 'next/server';
import { vendorTransactionsGET } from '@/backend/controllers/vendorFinanceController';
export async function GET(req: NextRequest): Promise<NextResponse> { return (await vendorTransactionsGET(req as any)) as NextResponse; }

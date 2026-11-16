import { NextRequest, NextResponse } from 'next/server';
import { vendorCommissionsGET } from '@/backend/controllers/vendorFinanceController';
export async function GET(req: NextRequest): Promise<NextResponse> { return (await vendorCommissionsGET(req as any)) as NextResponse; }

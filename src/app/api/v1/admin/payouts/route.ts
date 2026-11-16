import { NextRequest, NextResponse } from 'next/server';
import { adminPayoutsGET } from '@/backend/controllers/vendorFinanceController';
export async function GET(req: NextRequest): Promise<NextResponse> { return (await adminPayoutsGET(req as any)) as NextResponse; }

import { NextRequest, NextResponse } from 'next/server';
import { myOrdersGET } from '@/backend/controllers/orderController';
export async function GET(req: NextRequest): Promise<NextResponse> { return (await myOrdersGET(req as any)) as NextResponse; }

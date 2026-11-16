import { NextRequest, NextResponse } from 'next/server';
import { myReturnsGET } from '@/backend/controllers/returnController';
export async function GET(req: NextRequest): Promise<NextResponse> { return (await myReturnsGET(req as any)) as NextResponse; }

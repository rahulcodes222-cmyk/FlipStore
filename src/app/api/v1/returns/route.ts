import { NextRequest, NextResponse } from 'next/server';
import { myReturnsGET, returnsPOST } from '@/backend/controllers/returnController';
export async function GET(req: NextRequest): Promise<NextResponse> { return (await myReturnsGET(req as any)) as NextResponse; }
export async function POST(req: NextRequest): Promise<NextResponse> { return (await returnsPOST(req as any)) as NextResponse; }

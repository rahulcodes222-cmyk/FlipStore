import { NextRequest, NextResponse } from 'next/server';
import { notificationReadPATCH } from '@/backend/controllers/notificationController';
export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }): Promise<NextResponse> { return (await notificationReadPATCH(req as any, context)) as NextResponse; }

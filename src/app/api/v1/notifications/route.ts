import { NextRequest, NextResponse } from 'next/server';
import { notificationsGET } from '@/backend/controllers/notificationController';
export async function GET(req: NextRequest): Promise<NextResponse> { return (await notificationsGET(req as any)) as NextResponse; }

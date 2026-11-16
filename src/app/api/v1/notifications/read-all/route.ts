import { NextRequest, NextResponse } from 'next/server';
import { notificationsMarkAllReadPATCH } from '@/backend/controllers/notificationController';
export async function PATCH(req: NextRequest): Promise<NextResponse> { return (await notificationsMarkAllReadPATCH(req as any)) as NextResponse; }

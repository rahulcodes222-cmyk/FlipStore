import { NextRequest, NextResponse } from 'next/server';
import { notificationDELETE } from '@/backend/controllers/notificationController';
export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }): Promise<NextResponse> { return (await notificationDELETE(req as any, context)) as NextResponse; }

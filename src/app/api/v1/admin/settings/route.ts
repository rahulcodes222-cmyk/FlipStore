import { NextRequest, NextResponse } from 'next/server';
import { adminDeliverySettingsGET, adminDeliverySettingsPATCH } from '@/backend/controllers/adminSettingsController';

export async function GET(req: NextRequest): Promise<NextResponse> {
  return (await adminDeliverySettingsGET(req as any, null)) as NextResponse;
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  return (await adminDeliverySettingsPATCH(req as any, null)) as NextResponse;
}

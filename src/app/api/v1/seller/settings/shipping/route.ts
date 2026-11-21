import { NextRequest, NextResponse } from 'next/server';
import { sellerShippingSettingsPATCH } from '@/backend/controllers/sellerSettingsController';

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  return (await sellerShippingSettingsPATCH(req as any)) as NextResponse;
}

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withDatabase } from '@/backend/middleware/connectDb';
import { withAuth } from '@/backend/middleware/auth';
import { withRole } from '@/backend/middleware/rbac';
import { USER_ROLES } from '@/backend/constants/roles';
import { HTTP_STATUS } from '@/backend/constants';
import { createErrorResponse, createSuccessResponse } from '@/backend/utils/response';
import { getDeliverySettings, updateDeliverySettings } from '@/backend/services/platformSettingsService';

const updateSchema = z.object({
  standardDeliveryCharge: z.number().min(0).max(100000).optional(),
  freeDeliveryAboveAmount: z.number().min(0).max(100000000).optional(),
});

export const adminDeliverySettingsGET = withDatabase(withAuth(withRole(USER_ROLES.ADMIN)(async (): Promise<NextResponse> => {
  try {
    const settings = await getDeliverySettings();
    return NextResponse.json(createSuccessResponse(settings, { message: 'Delivery settings fetched.' }), { status: HTTP_STATUS.OK });
  } catch {
    return NextResponse.json(createErrorResponse('Failed to fetch delivery settings.', { code: 'SETTINGS_FETCH_FAILED' }), { status: HTTP_STATUS.INTERNAL_SERVER_ERROR });
  }
})));

export const adminDeliverySettingsPATCH = withDatabase(withAuth(withRole(USER_ROLES.ADMIN)(async (req: any): Promise<NextResponse> => {
  try {
    const body = await (req as NextRequest).json().catch(() => ({}));
    const parsed = updateSchema.safeParse(body || {});
    if (!parsed.success) {
      return NextResponse.json(
        createErrorResponse('Invalid request body.', { statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY, code: 'VALIDATION_ERROR', details: parsed.error.flatten().fieldErrors as Record<string, string[]> }),
        { status: HTTP_STATUS.UNPROCESSABLE_ENTITY },
      );
    }
    const settings = await updateDeliverySettings(parsed.data, req.user?.id);
    return NextResponse.json(createSuccessResponse(settings, { message: 'Delivery settings updated.' }), { status: HTTP_STATUS.OK });
  } catch {
    return NextResponse.json(createErrorResponse('Failed to update delivery settings.', { code: 'SETTINGS_UPDATE_FAILED' }), { status: HTTP_STATUS.INTERNAL_SERVER_ERROR });
  }
})));

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { withDatabase } from '@/backend/middleware/connectDb';
import { withAuth } from '@/backend/middleware/auth';
import { HTTP_STATUS } from '@/backend/constants';
import { createErrorResponse, createSuccessResponse } from '@/backend/utils/response';
import { SellerStoreModel } from '@/backend/models';

const shippingSettingsSchema = z.object({
  pickupPincode: z.string().min(6, 'Pincode must be 6 digits').max(6, 'Pincode must be 6 digits').regex(/^\d{6}$/, 'Invalid pincode'),
});

async function parseBody<T>(req: NextRequest, schema: z.ZodSchema<T>): Promise<{ data: T } | { error: NextResponse }> {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return { error: NextResponse.json(createErrorResponse('Invalid request body.', { statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY, code: 'VALIDATION_ERROR', details: (parsed.error.flatten().fieldErrors as Record<string, string[]>) }), { status: HTTP_STATUS.UNPROCESSABLE_ENTITY }) };
    }
    return { data: parsed.data };
  } catch {
    return { error: NextResponse.json(createErrorResponse('Invalid JSON body.', { statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY, code: 'INVALID_JSON' }), { status: HTTP_STATUS.UNPROCESSABLE_ENTITY }) };
  }
}

export const sellerShippingSettingsPATCH = withDatabase(withAuth(async (req: any): Promise<NextResponse> => {
  if (!req.user) {
    return NextResponse.json(createErrorResponse('Authentication required.', { statusCode: HTTP_STATUS.UNAUTHORIZED, code: 'AUTH_REQUIRED' }), { status: HTTP_STATUS.UNAUTHORIZED });
  }

  const userId = req.user.id;
  const userRole = req.user.role;

  if (userRole !== 'vendor' && userRole !== 'seller' && userRole !== 'admin' && userRole !== 'super_admin') {
    return NextResponse.json(createErrorResponse('Seller access required.', { statusCode: HTTP_STATUS.FORBIDDEN, code: 'FORBIDDEN' }), { status: HTTP_STATUS.FORBIDDEN });
  }

  const parsed = await parseBody(req as NextRequest, shippingSettingsSchema);
  if ('error' in parsed) return parsed.error;

  try {
    const { pickupPincode } = parsed.data;

    const updated = await SellerStoreModel.findOneAndUpdate(
      { sellerId: userId },
      { $set: { 'address.pincode': pickupPincode } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).exec();

    return NextResponse.json(
      createSuccessResponse({ pickupPincode, address: updated?.address || null }, { message: 'Shipping origin PIN saved.' }),
      { status: HTTP_STATUS.OK },
    );
  } catch (error: any) {
    return NextResponse.json(
      createErrorResponse(error?.message || 'Failed to save shipping settings.', { statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR, code: 'SHIPPING_SETTINGS_UPDATE_FAILED' }),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}));

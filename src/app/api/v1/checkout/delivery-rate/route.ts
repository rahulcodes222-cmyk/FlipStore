import { NextRequest, NextResponse } from 'next/server';
import { getShiprocketDeliveryRate } from '@/backend/services/shiprocketService';
import { SellerStoreModel } from '@/backend/models';
import { withDatabase } from '@/backend/middleware/connectDb';
import { withAuth } from '@/backend/middleware/auth';
import { HTTP_STATUS } from '@/backend/constants';
import { createErrorResponse, createSuccessResponse } from '@/backend/utils/response';

async function parseBody(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const deliveryPincode = searchParams.get('pincode') || '';
  const weightKg = searchParams.get('weightKg') ? Number(searchParams.get('weightKg')) : 0.5;
  const cod = searchParams.get('cod') === '1';
  return { deliveryPincode, weightKg, cod };
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { deliveryPincode, weightKg, cod } = await parseBody(req);

    const cleanPincode = String(deliveryPincode || '').replace(/\D/g, '').slice(0, 6);
    if (!/^\d{6}$/.test(cleanPincode)) {
      return NextResponse.json(
        createErrorResponse('Invalid delivery pincode.', { statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY, code: 'INVALID_PINCODE' }),
        { status: HTTP_STATUS.UNPROCESSABLE_ENTITY },
      );
    }

    // Get seller's pickup pincode from SellerStore (first seller)
    let sellerPickupPincode: string | undefined;
    try {
      const sellerStore = await SellerStoreModel.findOne().select('address.pincode').lean().exec();
      sellerPickupPincode = (sellerStore as any)?.address?.pincode || undefined;
    } catch {}

    const rate = await getShiprocketDeliveryRate({
      deliveryPincode: cleanPincode,
      pickupPincode: sellerPickupPincode,
      weightKg: weightKg > 0 ? weightKg : 0.5,
      cod,
      declaredValue: 500,
    });

    if (!rate) {
      return NextResponse.json(
        createSuccessResponse({ charge: null, source: 'unavailable' }, { message: 'Shiprocket rate unavailable.' }),
        { status: HTTP_STATUS.OK },
      );
    }

    return NextResponse.json(
      createSuccessResponse({
        charge: rate.charge,
        courierName: rate.courierName,
        source: 'shiprocket',
        pickupPincode: sellerPickupPincode,
      }, { message: 'Delivery rate calculated.' }),
      { status: HTTP_STATUS.OK },
    );
  } catch (error: any) {
    return NextResponse.json(
      createErrorResponse(error?.message || 'Failed to calculate delivery rate.', { statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR, code: 'DELIVERY_RATE_FAILED' }),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}

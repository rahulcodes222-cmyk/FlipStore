import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { withDatabase } from '@/backend/middleware/connectDb';
import { withAuth } from '@/backend/middleware/auth';
import { withRole } from '@/backend/middleware/rbac';
import { USER_ROLES } from '@/backend/constants/roles';
import { HTTP_STATUS } from '@/backend/constants';
import { createErrorResponse, createSuccessResponse } from '@/backend/utils/response';
import {
  vendorRegisterSchema,
  vendorApplicationUpdateSchema,
  vendorStoreUpdateSchema,
  adminVendorStatusSchema,
} from '@/backend/validations/vendor.schema';
import {
  registerVendorApplication,
  getVendorApplicationByUserId,
  updateVendorApplication,
  getVendorStoreByUserId,
  updateVendorStore,
  listVendorsForAdmin,
  updateVendorStatusByAdmin,
} from '@/backend/services/vendorService';

async function parseBody<T>(req: NextRequest, schema: z.ZodSchema<T>): Promise<{ data: T } | { error: NextResponse }> {
  try {
    const body = await req.json();
    return { data: schema.parse(body) as T };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        error: NextResponse.json(
          createErrorResponse('Invalid request body.', {
            statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY,
            code: 'VALIDATION_ERROR',
            details: error.flatten().fieldErrors as Record<string, string[]>,
          }),
          { status: HTTP_STATUS.UNPROCESSABLE_ENTITY },
        ),
      };
    }
    return {
      error: NextResponse.json(
        createErrorResponse('Invalid request body.', {
          statusCode: HTTP_STATUS.BAD_REQUEST,
          code: 'INVALID_JSON',
        }),
        { status: HTTP_STATUS.BAD_REQUEST },
      ),
    };
  }
}

function getParamId(reqUrl: string) {
  const url = new URL(reqUrl);
  const parts = url.pathname.split('/').filter(Boolean);
  return parts[parts.length - 2];
}

export const vendorRegisterPOST = withDatabase(async (req: NextRequest): Promise<NextResponse> => {
  const parsed = await parseBody(req, vendorRegisterSchema);
  if ('error' in parsed) return parsed.error;
  try {
    const result = await registerVendorApplication(parsed.data);
    return NextResponse.json(
      createSuccessResponse(result, {
        message: 'Vendor application submitted successfully. Approval is required before dashboard access.',
        statusCode: HTTP_STATUS.CREATED,
      }),
      { status: HTTP_STATUS.CREATED },
    );
  } catch (error: any) {
    const msg = error?.message || 'Vendor registration failed.';
    const status = msg.includes('already exists') ? HTTP_STATUS.CONFLICT : msg.includes('Password') ? HTTP_STATUS.UNPROCESSABLE_ENTITY : HTTP_STATUS.BAD_REQUEST;
    const code = msg.includes('already exists') ? 'ACCOUNT_EXISTS' : msg.includes('Password') ? 'VALIDATION_ERROR' : 'VENDOR_REGISTRATION_FAILED';
    return NextResponse.json(createErrorResponse(msg, { statusCode: status, code }), { status });
  }
});

export const vendorApplicationGET = withDatabase(withAuth(async (authReq): Promise<NextResponse> => {
  if (!authReq.user) return NextResponse.json(createErrorResponse('Authentication required.', { statusCode: HTTP_STATUS.UNAUTHORIZED, code: 'AUTH_REQUIRED' }), { status: HTTP_STATUS.UNAUTHORIZED });
  if (authReq.user.role !== 'vendor' && authReq.user.role !== 'admin' && authReq.user.role !== 'super_admin') {
    return NextResponse.json(createErrorResponse('Vendor access required.', { statusCode: HTTP_STATUS.FORBIDDEN, code: 'FORBIDDEN' }), { status: HTTP_STATUS.FORBIDDEN });
  }
  try {
    const application = await getVendorApplicationByUserId(authReq.user.id);
    return NextResponse.json(createSuccessResponse(application, { message: 'Vendor application retrieved.' }));
  } catch (error: any) {
    return NextResponse.json(createErrorResponse(error?.message || 'Failed to fetch vendor application.', { statusCode: HTTP_STATUS.NOT_FOUND, code: 'NOT_FOUND' }), { status: HTTP_STATUS.NOT_FOUND });
  }
}));

export const vendorApplicationPATCH = withDatabase(withAuth(async (authReq): Promise<NextResponse> => {
  if (!authReq.user) return NextResponse.json(createErrorResponse('Authentication required.', { statusCode: HTTP_STATUS.UNAUTHORIZED, code: 'AUTH_REQUIRED' }), { status: HTTP_STATUS.UNAUTHORIZED });
  if (authReq.user.role !== 'vendor' && authReq.user.role !== 'admin' && authReq.user.role !== 'super_admin') {
    return NextResponse.json(createErrorResponse('Vendor access required.', { statusCode: HTTP_STATUS.FORBIDDEN, code: 'FORBIDDEN' }), { status: HTTP_STATUS.FORBIDDEN });
  }
  const parsed = await parseBody(authReq as unknown as NextRequest, vendorApplicationUpdateSchema);
  if ('error' in parsed) return parsed.error;
  try {
    const application = await updateVendorApplication(authReq.user.id, parsed.data);
    return NextResponse.json(createSuccessResponse(application, { message: 'Vendor application updated.' }));
  } catch (error: any) {
    const msg = error?.message || 'Failed to update vendor application.';
    const status = msg.includes('not found') ? HTTP_STATUS.NOT_FOUND : HTTP_STATUS.BAD_REQUEST;
    return NextResponse.json(createErrorResponse(msg, { statusCode: status, code: 'VENDOR_APPLICATION_UPDATE_FAILED' }), { status });
  }
}));

export const vendorStoreGET = withDatabase(withAuth(async (authReq): Promise<NextResponse> => {
  if (!authReq.user) return NextResponse.json(createErrorResponse('Authentication required.', { statusCode: HTTP_STATUS.UNAUTHORIZED, code: 'AUTH_REQUIRED' }), { status: HTTP_STATUS.UNAUTHORIZED });
  if (authReq.user.role !== 'vendor' && authReq.user.role !== 'admin' && authReq.user.role !== 'super_admin') {
    return NextResponse.json(createErrorResponse('Vendor access required.', { statusCode: HTTP_STATUS.FORBIDDEN, code: 'FORBIDDEN' }), { status: HTTP_STATUS.FORBIDDEN });
  }
  try {
    const store = await getVendorStoreByUserId(authReq.user.id);
    return NextResponse.json(createSuccessResponse(store, { message: 'Vendor store retrieved.' }));
  } catch (error: any) {
    return NextResponse.json(createErrorResponse(error?.message || 'Failed to fetch vendor store.', { statusCode: HTTP_STATUS.NOT_FOUND, code: 'NOT_FOUND' }), { status: HTTP_STATUS.NOT_FOUND });
  }
}));

export const vendorStorePATCH = withDatabase(withAuth(async (authReq): Promise<NextResponse> => {
  if (!authReq.user) return NextResponse.json(createErrorResponse('Authentication required.', { statusCode: HTTP_STATUS.UNAUTHORIZED, code: 'AUTH_REQUIRED' }), { status: HTTP_STATUS.UNAUTHORIZED });
  if (authReq.user.role !== 'vendor' && authReq.user.role !== 'admin' && authReq.user.role !== 'super_admin') {
    return NextResponse.json(createErrorResponse('Vendor access required.', { statusCode: HTTP_STATUS.FORBIDDEN, code: 'FORBIDDEN' }), { status: HTTP_STATUS.FORBIDDEN });
  }
  const parsed = await parseBody(authReq as unknown as NextRequest, vendorStoreUpdateSchema);
  if ('error' in parsed) return parsed.error;
  try {
    const store = await updateVendorStore(authReq.user.id, parsed.data);
    return NextResponse.json(createSuccessResponse(store, { message: 'Vendor store updated.' }));
  } catch (error: any) {
    const msg = error?.message || 'Failed to update vendor store.';
    const status = msg.includes('not found') ? HTTP_STATUS.NOT_FOUND : msg.includes('slug') ? HTTP_STATUS.CONFLICT : HTTP_STATUS.BAD_REQUEST;
    return NextResponse.json(createErrorResponse(msg, { statusCode: status, code: 'VENDOR_STORE_UPDATE_FAILED' }), { status });
  }
}));

export const adminVendorsGET = withDatabase(withAuth(withRole(USER_ROLES.ADMIN)(async (authReq): Promise<NextResponse> => {
  const url = new URL(authReq.url);
  const status = url.searchParams.get('status') || undefined;
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const limit = parseInt(url.searchParams.get('limit') || '20', 10);
  const search = url.searchParams.get('search') || undefined;
  try {
    const result = await listVendorsForAdmin({ status, page, limit, search });
    return NextResponse.json(createSuccessResponse(result, { message: 'Vendors retrieved.' }));
  } catch (error: any) {
    return NextResponse.json(createErrorResponse(error?.message || 'Failed to fetch vendors.', { statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR, code: 'ADMIN_VENDORS_FETCH_FAILED' }), { status: HTTP_STATUS.INTERNAL_SERVER_ERROR });
  }
})));

export const adminVendorStatusPATCH = withDatabase(withAuth(withRole(USER_ROLES.ADMIN)(async (authReq): Promise<NextResponse> => {
  const vendorId = getParamId(authReq.url);
  if (!vendorId) {
    return NextResponse.json(createErrorResponse('Vendor ID is required.', { statusCode: HTTP_STATUS.BAD_REQUEST, code: 'INVALID_VENDOR_ID' }), { status: HTTP_STATUS.BAD_REQUEST });
  }
  const parsed = await parseBody(authReq as unknown as NextRequest, adminVendorStatusSchema);
  if ('error' in parsed) return parsed.error;
  try {
    const vendor = await updateVendorStatusByAdmin(vendorId, { id: authReq.user!.id, role: authReq.user!.role }, parsed.data);
    return NextResponse.json(createSuccessResponse(vendor, { message: 'Vendor status updated.' }));
  } catch (error: any) {
    const msg = error?.message || 'Failed to update vendor status.';
    const status = msg.includes('not found') ? HTTP_STATUS.NOT_FOUND : HTTP_STATUS.BAD_REQUEST;
    return NextResponse.json(createErrorResponse(msg, { statusCode: status, code: 'ADMIN_VENDOR_STATUS_UPDATE_FAILED' }), { status });
  }
})));

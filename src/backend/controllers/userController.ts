/**
 * User Controller
 * Handles HTTP request/response for user profile and address endpoints.
 * Delegates business logic to userService.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  getUserProfile,
  updateUserProfile,
  getUserAddresses,
  addUserAddress,
  editUserAddress,
  deleteUserAddress,
  setUserDefaultAddress,
  listUsersForAdmin,
  getUserByIdForAdmin,
} from '@/backend/services/userService';
import { withDatabase } from '@/backend/middleware/connectDb';
import { withAuth } from '@/backend/middleware/auth';
import { withRole } from '@/backend/middleware/rbac';
import { USER_ROLES } from '@/backend/constants/roles';
import {
  updateProfileSchema,
  createAddressSchema,
  updateAddressSchema,
  addressIdParamSchema,
} from '@/backend/validations/user.schema';
import { createSuccessResponse, createErrorResponse } from '@/backend/utils/response';
import { HTTP_STATUS } from '@/backend/constants';

/**
 * Helper to parse and validate request body using Zod.
 */
async function validateRequestBody<T>(
  req: NextRequest,
  schema: z.ZodSchema<T>,
): Promise<{ data: T } | { error: { statusCode: number; response: unknown } }> {
  try {
    const body = await req.json();
    const data = schema.parse(body);
    return { data };
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return {
        error: {
          statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY,
          response: {
            success: false,
            message: 'Invalid request body.',
            error: {
              code: 'VALIDATION_ERROR',
              details: error.flatten().fieldErrors as Record<string, string[]>,
            },
            timestamp: new Date().toISOString(),
          },
        },
      };
    }
    throw error;
  }
}

/**
 * GET /api/v1/users/profile
 * Get current authenticated user profile.
 */
export const profileGET = withDatabase(withAuth(async (authReq) => {
  if (!authReq.user) {
    return NextResponse.json(
      createErrorResponse('Authentication required.', {
        statusCode: HTTP_STATUS.UNAUTHORIZED,
        code: 'AUTH_REQUIRED',
        requestId: authReq.requestId,
      }),
      { status: HTTP_STATUS.UNAUTHORIZED },
    );
  }

  try {
    const user = await getUserProfile(authReq.user.id);
    return NextResponse.json(
      createSuccessResponse(
        {
          id: String((user as any)._id || (user as any).id || authReq.user.id),
          name: (user as any).name,
          email: (user as any).email,
          phone: (user as any).phone,
          role: (user as any).role,
          avatar: (user as any).avatar,
          addresses: Array.isArray((user as any).addresses) ? (user as any).addresses : [],
          defaultAddressId: (user as any).defaultAddressId,
          isEmailVerified: (user as any).isEmailVerified,
          isPhoneVerified: (user as any).isPhoneVerified,
          isActive: (user as any).isActive,
          createdAt: (user as any).createdAt,
        },
        { message: 'User profile retrieved.', statusCode: HTTP_STATUS.OK },
      ),
      { status: HTTP_STATUS.OK },
    );
  } catch (error: unknown) {
    console.error('[profileGET] Failed to fetch profile:', error);
    if (error instanceof Error && error.message === 'User not found.') {
      return NextResponse.json(
        createErrorResponse(error.message, {
          statusCode: HTTP_STATUS.NOT_FOUND,
          code: 'USER_NOT_FOUND',
        }),
        { status: HTTP_STATUS.NOT_FOUND },
      );
    }
    const msg = error instanceof Error ? error.message : 'Failed to fetch profile.';
    return NextResponse.json(
      createErrorResponse(
        process.env.NODE_ENV === 'production' ? 'Failed to fetch profile.' : `Failed to fetch profile: ${msg}`,
        {
          statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
          code: 'PROFILE_FETCH_FAILED',
        },
      ),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}));

/**
 * PATCH /api/v1/users/profile
 * Update user profile information (name, email, phone).
 */
export const profilePATCH = withDatabase(withAuth(async (authReq) => {
  if (!authReq.user) {
    return NextResponse.json(
      createErrorResponse('Authentication required.', {
        statusCode: HTTP_STATUS.UNAUTHORIZED,
        code: 'AUTH_REQUIRED',
        requestId: authReq.requestId,
      }),
      { status: HTTP_STATUS.UNAUTHORIZED },
    );
  }

  const result = await validateRequestBody(authReq as unknown as NextRequest, updateProfileSchema);
  if ('error' in result) {
    return NextResponse.json(result.error.response, {
      status: result.error.statusCode,
    });
  }

  try {
    const user = await updateUserProfile(authReq.user.id, result.data);
    return NextResponse.json(
      createSuccessResponse(
        {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          phone: user.phone,
          avatar: user.avatar,
        },
        { message: 'Profile updated successfully.', statusCode: HTTP_STATUS.OK },
      ),
      { status: HTTP_STATUS.OK },
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        return NextResponse.json(
          createErrorResponse(error.message, {
            statusCode: HTTP_STATUS.CONFLICT,
            code: 'ACCOUNT_EXISTS',
          }),
          { status: HTTP_STATUS.CONFLICT },
        );
      }
    }
    return NextResponse.json(
      createErrorResponse('Profile update failed.', {
        statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        code: 'PROFILE_UPDATE_FAILED',
      }),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}));

/**
 * GET /api/v1/users/addresses
 * Get all saved addresses for the authenticated user.
 */
export const addressesGET = withDatabase(withAuth(async (authReq) => {
  if (!authReq.user) {
    return NextResponse.json(
      createErrorResponse('Authentication required.', {
        statusCode: HTTP_STATUS.UNAUTHORIZED,
        code: 'AUTH_REQUIRED',
        requestId: authReq.requestId,
      }),
      { status: HTTP_STATUS.UNAUTHORIZED },
    );
  }

  try {
    const addresses = await getUserAddresses(authReq.user.id);
    return NextResponse.json(
      createSuccessResponse(
        addresses,
        { message: 'Addresses retrieved.', statusCode: HTTP_STATUS.OK },
      ),
      { status: HTTP_STATUS.OK },
    );
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'User not found.') {
      return NextResponse.json(
        createErrorResponse(error.message, {
          statusCode: HTTP_STATUS.NOT_FOUND,
          code: 'USER_NOT_FOUND',
        }),
        { status: HTTP_STATUS.NOT_FOUND },
      );
    }
    return NextResponse.json(
      createErrorResponse('Failed to fetch addresses.', {
        statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        code: 'ADDRESSES_FETCH_FAILED',
      }),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}));

/**
 * POST /api/v1/users/addresses
 * Add a new delivery address for the authenticated user.
 */
export const addressesPOST = withDatabase(withAuth(async (authReq) => {
  if (!authReq.user) {
    return NextResponse.json(
      createErrorResponse('Authentication required.', {
        statusCode: HTTP_STATUS.UNAUTHORIZED,
        code: 'AUTH_REQUIRED',
        requestId: authReq.requestId,
      }),
      { status: HTTP_STATUS.UNAUTHORIZED },
    );
  }

  const result = await validateRequestBody(authReq as unknown as NextRequest, createAddressSchema);
  if ('error' in result) {
    return NextResponse.json(result.error.response, {
      status: result.error.statusCode,
    });
  }

  try {
    const address = await addUserAddress(authReq.user.id, result.data);
    return NextResponse.json(
      createSuccessResponse(
        address,
        { message: 'Address added successfully.', statusCode: HTTP_STATUS.CREATED },
      ),
      { status: HTTP_STATUS.CREATED },
    );
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'User not found.') {
      return NextResponse.json(
        createErrorResponse(error.message, {
          statusCode: HTTP_STATUS.NOT_FOUND,
          code: 'USER_NOT_FOUND',
        }),
        { status: HTTP_STATUS.NOT_FOUND },
      );
    }
    return NextResponse.json(
      createErrorResponse('Failed to add address.', {
        statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        code: 'ADDRESS_ADD_FAILED',
      }),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}));

/**
 * PATCH /api/v1/users/addresses/:id
 * Edit an existing address for the authenticated user.
 */
export const addressPatch = withDatabase(withAuth(async (authReq) => {
  if (!authReq.user) {
    return NextResponse.json(
      createErrorResponse('Authentication required.', {
        statusCode: HTTP_STATUS.UNAUTHORIZED,
        code: 'AUTH_REQUIRED',
        requestId: authReq.requestId,
      }),
      { status: HTTP_STATUS.UNAUTHORIZED },
    );
  }

  // Parse and validate URL params
  const url = new URL(authReq.url);
  const pathSegments = url.pathname.split('/');
  const addressId = pathSegments[pathSegments.length - 2]; // /api/v1/users/addresses/:id

  const paramResult = addressIdParamSchema.safeParse({ id: addressId });
  if (!paramResult.success) {
    return NextResponse.json(
      createErrorResponse('Invalid address ID.', {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        code: 'INVALID_ADDRESS_ID',
      }),
      { status: HTTP_STATUS.BAD_REQUEST },
    );
  }

  const result = await validateRequestBody(authReq as unknown as NextRequest, updateAddressSchema);
  if ('error' in result) {
    return NextResponse.json(result.error.response, {
      status: result.error.statusCode,
    });
  }

  try {
    const address = await editUserAddress(authReq.user.id, addressId, result.data);
    if (!address) {
      return NextResponse.json(
        createErrorResponse('Address not found.', {
          statusCode: HTTP_STATUS.NOT_FOUND,
          code: 'ADDRESS_NOT_FOUND',
        }),
        { status: HTTP_STATUS.NOT_FOUND },
      );
    }
    return NextResponse.json(
      createSuccessResponse(
        address,
        { message: 'Address updated successfully.', statusCode: HTTP_STATUS.OK },
      ),
      { status: HTTP_STATUS.OK },
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === 'User not found.' || error.message === 'Address not found.') {
        return NextResponse.json(
          createErrorResponse(error.message, {
            statusCode: HTTP_STATUS.NOT_FOUND,
            code: 'NOT_FOUND',
          }),
          { status: HTTP_STATUS.NOT_FOUND },
        );
      }
    }
    return NextResponse.json(
      createErrorResponse('Failed to update address.', {
        statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        code: 'ADDRESS_UPDATE_FAILED',
      }),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}));

/**
 * DELETE /api/v1/users/addresses/:id
 * Delete an address for the authenticated user.
 */
export const addressDelete = withDatabase(withAuth(async (authReq) => {
  if (!authReq.user) {
    return NextResponse.json(
      createErrorResponse('Authentication required.', {
        statusCode: HTTP_STATUS.UNAUTHORIZED,
        code: 'AUTH_REQUIRED',
        requestId: authReq.requestId,
      }),
      { status: HTTP_STATUS.UNAUTHORIZED },
    );
  }

  // Parse and validate URL params
  const url = new URL(authReq.url);
  const pathSegments = url.pathname.split('/');
  const addressId = pathSegments[pathSegments.length - 2];

  const paramResult = addressIdParamSchema.safeParse({ id: addressId });
  if (!paramResult.success) {
    return NextResponse.json(
      createErrorResponse('Invalid address ID.', {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        code: 'INVALID_ADDRESS_ID',
      }),
      { status: HTTP_STATUS.BAD_REQUEST },
    );
  }

  try {
    const deleted = await deleteUserAddress(authReq.user.id, addressId);
    if (!deleted) {
      return NextResponse.json(
        createErrorResponse('Address not found.', {
          statusCode: HTTP_STATUS.NOT_FOUND,
          code: 'ADDRESS_NOT_FOUND',
        }),
        { status: HTTP_STATUS.NOT_FOUND },
      );
    }
    return NextResponse.json(
      createSuccessResponse(null, {
        message: 'Address deleted successfully.',
        statusCode: HTTP_STATUS.OK,
      }),
      { status: HTTP_STATUS.OK },
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === 'User not found.' || error.message === 'Address not found.') {
        return NextResponse.json(
          createErrorResponse(error.message, {
            statusCode: HTTP_STATUS.NOT_FOUND,
            code: 'NOT_FOUND',
          }),
          { status: HTTP_STATUS.NOT_FOUND },
        );
      }
    }
    return NextResponse.json(
      createErrorResponse('Failed to delete address.', {
        statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        code: 'ADDRESS_DELETE_FAILED',
      }),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}));

/**
 * PATCH /api/v1/users/addresses/:id/default
 * Set an address as default for the authenticated user.
 */
export const addressDefaultPatch = withDatabase(withAuth(async (authReq) => {
  if (!authReq.user) {
    return NextResponse.json(
      createErrorResponse('Authentication required.', {
        statusCode: HTTP_STATUS.UNAUTHORIZED,
        code: 'AUTH_REQUIRED',
        requestId: authReq.requestId,
      }),
      { status: HTTP_STATUS.UNAUTHORIZED },
    );
  }

  // Parse and validate URL params
  const url = new URL(authReq.url);
  const pathSegments = url.pathname.split('/');
  // Path is /api/v1/users/addresses/:id/default
  // pathSegments = ['', 'api', 'v1', 'users', 'addresses', ':id', 'default']
  const addressId = pathSegments[pathSegments.length - 3];

  const paramResult = addressIdParamSchema.safeParse({ id: addressId });
  if (!paramResult.success) {
    return NextResponse.json(
      createErrorResponse('Invalid address ID.', {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        code: 'INVALID_ADDRESS_ID',
      }),
      { status: HTTP_STATUS.BAD_REQUEST },
    );
  }

  try {
    const address = await setUserDefaultAddress(authReq.user.id, addressId);
    if (!address) {
      return NextResponse.json(
        createErrorResponse('Address not found.', {
          statusCode: HTTP_STATUS.NOT_FOUND,
          code: 'ADDRESS_NOT_FOUND',
        }),
        { status: HTTP_STATUS.NOT_FOUND },
      );
    }
    return NextResponse.json(
      createSuccessResponse(
        address,
        { message: 'Default address updated.', statusCode: HTTP_STATUS.OK },
      ),
      { status: HTTP_STATUS.OK },
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === 'User not found.' || error.message === 'Address not found.') {
        return NextResponse.json(
          createErrorResponse(error.message, {
            statusCode: HTTP_STATUS.NOT_FOUND,
            code: 'NOT_FOUND',
          }),
          { status: HTTP_STATUS.NOT_FOUND },
        );
      }
    }
    return NextResponse.json(
      createErrorResponse('Failed to set default address.', {
        statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        code: 'DEFAULT_ADDRESS_FAILED',
      }),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}));


/**
 * GET /api/v1/admin/users
 * List users for admin dashboard (RBAC protected).
 */
export const adminUsersGET = withDatabase(withAuth(withRole(USER_ROLES.ADMIN as any)(async (authReq) => {
  try {
    const url = new URL(authReq.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10) || 20));
    const search = url.searchParams.get('search') || undefined;
    const role = url.searchParams.get('role') || undefined;
    const result = await listUsersForAdmin({ page, limit, search, role });
    return NextResponse.json(
      createSuccessResponse(result, { message: 'Users retrieved.' }),
      { status: HTTP_STATUS.OK },
    );
  } catch (error: any) {
    return NextResponse.json(
      createErrorResponse(error?.message || 'Failed to fetch users.', {
        statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        code: 'ADMIN_USERS_FETCH_FAILED',
      }),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
})));

/**
 * GET /api/v1/admin/users/:id
 */
export const adminUserGET = withDatabase(withAuth(withRole(USER_ROLES.ADMIN as any)(async (authReq) => {
  try {
    const url = new URL(authReq.url);
    const parts = url.pathname.split('/').filter(Boolean);
    const userId = parts[parts.length - 1];
    if (!userId || !/^[a-f\d]{24}$/i.test(userId)) {
      return NextResponse.json(
        createErrorResponse('Invalid user ID.', { statusCode: HTTP_STATUS.BAD_REQUEST, code: 'INVALID_USER_ID' }),
        { status: HTTP_STATUS.BAD_REQUEST },
      );
    }
    const user = await getUserByIdForAdmin(userId);
    return NextResponse.json(createSuccessResponse(user, { message: 'User retrieved.' }), { status: HTTP_STATUS.OK });
  } catch (error: any) {
    const msg = error?.message || 'Failed to fetch user.';
    const status = msg.includes('not found') ? HTTP_STATUS.NOT_FOUND : HTTP_STATUS.INTERNAL_SERVER_ERROR;
    return NextResponse.json(
      createErrorResponse(msg, { statusCode: status, code: status === HTTP_STATUS.NOT_FOUND ? 'USER_NOT_FOUND' : 'ADMIN_USER_FETCH_FAILED' }),
      { status },
    );
  }
})));

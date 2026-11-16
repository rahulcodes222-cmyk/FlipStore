/**
 * Auth Controller
 * Handles HTTP request/response for auth endpoints.
 * Delegates business logic to authService.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  registerUser,
  registerVendor,
  loginUser,
  logoutUser,
  refreshToken,
  getCurrentUser,
  forgotPassword,
  resetPassword,
  changePassword,
} from '@/backend/services/authService';
import { withDatabase } from '@/backend/middleware/connectDb';
import { withAuth } from '@/backend/middleware/auth';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  vendorRegisterSchema,
  updateProfileSchema,
  changePasswordSchema,
} from '@/backend/validations/auth.schema';
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
      const details = error.flatten().fieldErrors as Record<string, string[]>;
      const first = Object.values(details).flat().find(Boolean);
      return {
        error: {
          statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY,
          response: {
            success: false,
            message: first ? `Invalid request body: ${first}` : 'Invalid request body.',
            error: {
              code: 'VALIDATION_ERROR',
              details,
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
 * POST /api/v1/auth/register
 * Register a new customer or vendor account.
 */
export const POST = withDatabase(async (req: NextRequest) => {
  const result = await validateRequestBody(req, registerSchema);
  if ('error' in result) {
    return NextResponse.json(result.error.response, {
      status: result.error.statusCode,
    });
  }

  try {
    const { user, tokens } = await registerUser(result.data);

    const response = NextResponse.json(
      createSuccessResponse(
        {
          user: {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            avatar: user.avatar,
          },
          tokens,
        },
        {
          message: 'Account created successfully.',
          statusCode: HTTP_STATUS.CREATED,
        },
      ),
      { status: HTTP_STATUS.CREATED },
    );

    // Set HTTP-only auth cookies so protected flows (e.g. checkout/payment) work immediately after registration.
    response.cookies.set('access_token', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60,
      path: '/',
    });
    response.cookies.set('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
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
      if (error.message.includes('Password')) {
        return NextResponse.json(
          createErrorResponse(error.message, {
            statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY,
            code: 'VALIDATION_ERROR',
          }),
          { status: HTTP_STATUS.UNPROCESSABLE_ENTITY },
        );
      }
    }
    return NextResponse.json(
      createErrorResponse('Registration failed.', {
        statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        code: 'REGISTRATION_FAILED',
      }),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
});

/**
 * POST /api/v1/auth/vendor/register
 * Register a new vendor account with business details.
 */
export const vendorRegisterPOST = withDatabase(async (req: NextRequest) => {
  const result = await validateRequestBody(req, vendorRegisterSchema);
  if ('error' in result) {
    return NextResponse.json(result.error.response, {
      status: result.error.statusCode,
    });
  }

  try {
    const { user, tokens } = await registerVendor(result.data);

    const response = NextResponse.json(
      createSuccessResponse(
        {
          user: {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            vendorProfile: (user as unknown as Record<string, unknown>).vendorProfile,
          },
          tokens,
        },
        {
          message: 'Vendor account created successfully. Verification pending.',
          statusCode: HTTP_STATUS.CREATED,
        },
      ),
      { status: HTTP_STATUS.CREATED },
    );

    // Set HTTP-only auth cookies for immediate authenticated session (vendor may be pending approval for vendor-only actions).
    response.cookies.set('access_token', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60,
      path: '/',
    });
    response.cookies.set('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
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
      if (error.message.includes('Password')) {
        return NextResponse.json(
          createErrorResponse(error.message, {
            statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY,
            code: 'VALIDATION_ERROR',
          }),
          { status: HTTP_STATUS.UNPROCESSABLE_ENTITY },
        );
      }
    }
    return NextResponse.json(
      createErrorResponse('Vendor registration failed.', {
        statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        code: 'VENDOR_REGISTRATION_FAILED',
      }),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
});

/**
 * POST /api/v1/auth/login
 * Authenticate user and return access/refresh tokens.
 */
export const loginPOST = withDatabase(async (req: NextRequest) => {
  const result = await validateRequestBody(req, loginSchema);
  if ('error' in result) {
    return NextResponse.json(result.error.response, {
      status: result.error.statusCode,
    });
  }

  try {
    const { user, tokens } = await loginUser(result.data);

    const response = NextResponse.json(
      createSuccessResponse(
        {
          user: {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            avatar: user.avatar,
            vendorApplicationStatus: (user as any).vendorApplicationStatus,
            isVendorApproved: (user as any).isVendorApproved,
          },
          tokens,
        },
        {
          message: 'Login successful.',
          statusCode: HTTP_STATUS.OK,
        },
      ),
      { status: HTTP_STATUS.OK },
    );

    // Set HTTP-only cookies for token storage
    response.cookies.set('access_token', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60,
      path: '/',
    });
    response.cookies.set('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (
        error.message.includes('Invalid') ||
        error.message.includes('deactivated') ||
        error.message.includes('pending approval') ||
        error.message.includes('rejected') ||
        error.message.includes('suspended') ||
        error.message.includes('not available until approved')
      ) {
        const isPending = error.message.includes('pending approval') || error.message.includes('not available until approved');
        return NextResponse.json(
          createErrorResponse(error.message, {
            statusCode: isPending ? HTTP_STATUS.FORBIDDEN : HTTP_STATUS.UNAUTHORIZED,
            code: isPending ? 'VENDOR_NOT_APPROVED' : 'INVALID_CREDENTIALS',
          }),
          { status: isPending ? HTTP_STATUS.FORBIDDEN : HTTP_STATUS.UNAUTHORIZED },
        );
      }
    }
    return NextResponse.json(
      createErrorResponse('Login failed.', {
        statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        code: 'LOGIN_FAILED',
      }),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
});

/**
 * POST /api/v1/auth/logout
 * Logout user and clear cookies.
 */
export const logoutPOST = withDatabase(async (req: NextRequest) => {
  try {
    const refreshToken = req.cookies.get('refresh_token')?.value;
    if (refreshToken) {
      await logoutUser(refreshToken);
    }

    const response = NextResponse.json(
      createSuccessResponse(null, {
        message: 'Logged out successfully.',
        statusCode: HTTP_STATUS.OK,
      }),
      { status: HTTP_STATUS.OK },
    );

    response.cookies.delete('access_token');
    response.cookies.delete('refresh_token');

    return response;
  } catch (error: unknown) {
    return NextResponse.json(
      createErrorResponse('Logout failed.', {
        statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        code: 'LOGOUT_FAILED',
      }),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
});

/**
 * POST /api/v1/auth/refresh
 * Refresh access token using refresh token.
 */
export const refreshPOST = withDatabase(async (req: NextRequest) => {
  try {
    const refreshTokenValue = req.cookies.get('refresh_token')?.value;
    if (!refreshTokenValue) {
      const response = NextResponse.json(
        createErrorResponse('Refresh token required. Please log in again.', {
          statusCode: HTTP_STATUS.UNAUTHORIZED,
          code: 'REFRESH_TOKEN_REQUIRED',
        }),
        { status: HTTP_STATUS.UNAUTHORIZED },
      );
      response.cookies.delete('access_token');
      response.cookies.delete('refresh_token');
      return response;
    }

    const tokens = await refreshToken(refreshTokenValue);

    const response = NextResponse.json(
      createSuccessResponse(
        {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          accessTokenExpiresAt: tokens.accessTokenExpiresAt,
          refreshTokenExpiresAt: tokens.refreshTokenExpiresAt,
        },
        {
          message: 'Token refreshed successfully.',
          statusCode: HTTP_STATUS.OK,
        },
      ),
      { status: HTTP_STATUS.OK },
    );

    response.cookies.set('access_token', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60,
      path: '/',
    });
    response.cookies.set('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[auth/refreshPOST] Token refresh failed:', error);
    const response = NextResponse.json(
      createErrorResponse('Invalid or expired session. Please log in again.', {
        statusCode: HTTP_STATUS.UNAUTHORIZED,
        code: 'INVALID_REFRESH_TOKEN',
      }),
      { status: HTTP_STATUS.UNAUTHORIZED },
    );
    response.cookies.delete('access_token');
    response.cookies.delete('refresh_token');
    return response;
  }
});

/**
 * GET /api/v1/auth/me
 * Get current authenticated user profile.
 */
export const meGET = withDatabase(withAuth(async (authReq) => {
  if (!authReq.user) {
    return NextResponse.json(
      createErrorResponse('Authentication required.', {
        statusCode: HTTP_STATUS.UNAUTHORIZED,
        code: 'AUTH_REQUIRED',
      }),
      { status: HTTP_STATUS.UNAUTHORIZED },
    );
  }

  try {
    const user = await getCurrentUser(authReq.user.id);
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
    console.error('[auth/meGET] Failed to fetch profile:', error);
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
 * POST /api/v1/auth/forgot-password
 * Request password reset token.
 */
export const forgotPasswordPOST = withDatabase(async (req: NextRequest) => {
  const result = await validateRequestBody(req, forgotPasswordSchema);
  if ('error' in result) {
    return NextResponse.json(result.error.response, {
      status: result.error.statusCode,
    });
  }

  try {
    await forgotPassword(result.data);
    return NextResponse.json(
      createSuccessResponse(null, {
        message:
          'If an account exists for this email/phone, a reset link has been sent.',
        statusCode: HTTP_STATUS.OK,
      }),
      { status: HTTP_STATUS.OK },
    );
  } catch (error: unknown) {
    return NextResponse.json(
      createErrorResponse('Password reset request failed.', {
        statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        code: 'RESET_REQUEST_FAILED',
      }),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
});

/**
 * POST /api/v1/auth/reset-password
 * Reset password using reset token.
 */
export const resetPasswordPOST = withDatabase(async (req: NextRequest) => {
  const result = await validateRequestBody(req, resetPasswordSchema);
  if ('error' in result) {
    return NextResponse.json(result.error.response, {
      status: result.error.statusCode,
    });
  }

  try {
    await resetPassword(result.data);
    return NextResponse.json(
      createSuccessResponse(null, {
        message: 'Password reset successful. You can now log in.',
        statusCode: HTTP_STATUS.OK,
      }),
      { status: HTTP_STATUS.OK },
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes('token')) {
        return NextResponse.json(
          createErrorResponse(error.message, {
            statusCode: HTTP_STATUS.BAD_REQUEST,
            code: 'INVALID_TOKEN',
          }),
          { status: HTTP_STATUS.BAD_REQUEST },
        );
      }
    }
    return NextResponse.json(
      createErrorResponse('Password reset failed.', {
        statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        code: 'RESET_FAILED',
      }),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
});

/**
 * POST /api/v1/auth/change-password
 * Change password for authenticated user.
 */
export const changePasswordPOST = withDatabase(withAuth(async (authReq) => {
  if (!authReq.user) {
    return NextResponse.json(
      createErrorResponse('Authentication required.', {
        statusCode: HTTP_STATUS.UNAUTHORIZED,
        code: 'AUTH_REQUIRED',
      }),
      { status: HTTP_STATUS.UNAUTHORIZED },
    );
  }

  // Need to parse body - withDatabase doesn't parse body, so we parse it here
  const result = await validateRequestBody(authReq as unknown as NextRequest, changePasswordSchema);
  if ('error' in result) {
    return NextResponse.json(result.error.response, {
      status: result.error.statusCode,
    });
  }

  try {
    await changePassword(authReq.user.id, {
      currentPassword: result.data.currentPassword,
      newPassword: result.data.newPassword,
    });
    return NextResponse.json(
      createSuccessResponse(null, {
        message: 'Password changed successfully.',
        statusCode: HTTP_STATUS.OK,
      }),
      { status: HTTP_STATUS.OK },
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes('incorrect')) {
        return NextResponse.json(
          createErrorResponse(error.message, {
            statusCode: HTTP_STATUS.UNAUTHORIZED,
            code: 'WRONG_PASSWORD',
          }),
          { status: HTTP_STATUS.UNAUTHORIZED },
        );
      }
    }
    return NextResponse.json(
      createErrorResponse('Password change failed.', {
        statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        code: 'PASSWORD_CHANGE_FAILED',
      }),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}));

/**
 * Wishlist Controller
 * Handles HTTP request/response for wishlist endpoints.
 * Delegates business logic to wishlistService.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  isInWishlist,
  moveWishlistItemToCart,
} from '@/backend/services/wishlistService';
import { withDatabase } from '@/backend/middleware/connectDb';
import { withAuth } from '@/backend/middleware/auth';
import {
  wishlistItemIdParamSchema,
} from '@/backend/validations/cart.schema';
import { createSuccessResponse, createErrorResponse } from '@/backend/utils/response';
import { HTTP_STATUS } from '@/backend/constants';

/**
 * GET /api/v1/wishlist
 * Get current authenticated user's wishlist.
 */
export const wishlistGET = withDatabase(withAuth(async (authReq) => {
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
    const wishlist = await getWishlist(authReq.user.id);
    if (!wishlist) {
      return NextResponse.json(
        createSuccessResponse(
          { items: [] },
          { message: 'Wishlist is empty.', statusCode: HTTP_STATUS.OK },
        ),
        { status: HTTP_STATUS.OK },
      );
    }

    return NextResponse.json(
      createSuccessResponse(
        wishlist.items,
        { message: 'Wishlist retrieved.', statusCode: HTTP_STATUS.OK },
      ),
      { status: HTTP_STATUS.OK },
    );
  } catch (error: unknown) {
    return NextResponse.json(
      createErrorResponse('Failed to fetch wishlist.', {
        statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        code: 'WISHLIST_FETCH_FAILED',
      }),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}));

/**
 * POST /api/v1/wishlist
 * Add item to wishlist.
 */
export const wishlistPOST = withDatabase(withAuth(async (authReq) => {
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

  const result = await validateRequestBody(
    authReq as unknown as NextRequest,
    wishlistItemIdParamSchema,
  );
  if ('error' in result) {
    return NextResponse.json(result.error.response, {
      status: result.error.statusCode,
    });
  }

  try {
    const wishlist = await addToWishlist(authReq.user.id, result.data.productId);
    return NextResponse.json(
      createSuccessResponse(
        wishlist.items,
        { message: 'Item added to wishlist.', statusCode: HTTP_STATUS.CREATED },
      ),
      { status: HTTP_STATUS.CREATED },
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          createErrorResponse(error.message, {
            statusCode: HTTP_STATUS.NOT_FOUND,
            code: 'PRODUCT_NOT_FOUND',
          }),
          { status: HTTP_STATUS.NOT_FOUND },
        );
      }
    }
    return NextResponse.json(
      createErrorResponse('Failed to add item to wishlist.', {
        statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        code: 'WISHLIST_ADD_FAILED',
      }),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}));

/**
 * DELETE /api/v1/wishlist/:productId
 * Remove item from wishlist.
 */
export const wishlistItemDelete = withDatabase(withAuth(async (authReq) => {
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

  const url = new URL(authReq.url);
  const pathSegments = url.pathname.split('/');
  const productId = pathSegments[pathSegments.length - 1];

  const paramResult = wishlistItemIdParamSchema.safeParse({ productId });
  if (!paramResult.success) {
    return NextResponse.json(
      createErrorResponse('Invalid product ID.', {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        code: 'INVALID_PRODUCT_ID',
      }),
      { status: HTTP_STATUS.BAD_REQUEST },
    );
  }

  try {
    const deleted = await removeFromWishlist(authReq.user.id, productId);
    if (!deleted) {
      return NextResponse.json(
        createErrorResponse('Item not found in wishlist.', {
          statusCode: HTTP_STATUS.NOT_FOUND,
          code: 'ITEM_NOT_FOUND',
        }),
        { status: HTTP_STATUS.NOT_FOUND },
      );
    }
    return NextResponse.json(
      createSuccessResponse(null, {
        message: 'Item removed from wishlist.',
        statusCode: HTTP_STATUS.OK,
      }),
      { status: HTTP_STATUS.OK },
    );
  } catch (error: unknown) {
    return NextResponse.json(
      createErrorResponse('Failed to remove item from wishlist.', {
        statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        code: 'WISHLIST_DELETE_FAILED',
      }),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}));

/**
 * POST /api/v1/wishlist/move-to-cart
 * Move item from wishlist to cart.
 */
export const wishlistMoveToCartPOST = withDatabase(withAuth(async (authReq) => {
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

  const result = await validateRequestBody(
    authReq as unknown as NextRequest,
    wishlistItemIdParamSchema,
  );
  if ('error' in result) {
    return NextResponse.json(result.error.response, {
      status: result.error.statusCode,
    });
  }

  try {
    const cart = await moveWishlistItemToCart(authReq.user.id, result.data.productId);
    if (!cart) {
      return NextResponse.json(
        createErrorResponse('Failed to move item to cart.', {
          statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
          code: 'MOVE_TO_CART_FAILED',
        }),
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
      );
    }
    return NextResponse.json(
      createSuccessResponse(
        { id: cart.id, items: cart.items },
        { message: 'Item moved to cart.', statusCode: HTTP_STATUS.OK },
      ),
      { status: HTTP_STATUS.OK },
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (
        error.message.includes('not found') ||
        error.message.includes('out of stock') ||
        error.message.includes('available')
      ) {
        return NextResponse.json(
          createErrorResponse(error.message, {
            statusCode: HTTP_STATUS.BAD_REQUEST,
            code: 'ITEM_UNAVAILABLE',
          }),
          { status: HTTP_STATUS.BAD_REQUEST },
        );
      }
    }
    return NextResponse.json(
      createErrorResponse('Failed to move item to cart.', {
        statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        code: 'MOVE_TO_CART_FAILED',
      }),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}));

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

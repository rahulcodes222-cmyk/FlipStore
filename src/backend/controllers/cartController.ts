/**
 * Cart Controller
 * Handles HTTP request/response for cart operations.
 * Delegates business logic to cartService.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  getCart,
  addToCart,
  updateCartItemQuantity,
  deleteCartItem,
  clearCart,
} from '@/backend/services/cartService';
import { withDatabase } from '@/backend/middleware/connectDb';
import { withAuth } from '@/backend/middleware/auth';
import {
  addToCartSchema,
  updateCartItemSchema,
  cartItemIdParamSchema,
} from '@/backend/validations/cart.schema';
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
 * GET /api/v1/cart
 * Get current authenticated user's cart.
 */
export const cartGET = withDatabase(withAuth(async (authReq) => {
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
    const cart = await getCart(authReq.user.id);
    if (!cart) {
      return NextResponse.json(
        createSuccessResponse(
          { items: [], totalAmount: 0, totalItems: 0 },
          { message: 'Cart is empty.', statusCode: HTTP_STATUS.OK },
        ),
        { status: HTTP_STATUS.OK },
      );
    }

    // Calculate totals
    const totalAmount = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    return NextResponse.json(
      createSuccessResponse(
        {
          id: cart.id,
          items: cart.items,
          totalAmount,
          totalItems,
        },
        { message: 'Cart retrieved.', statusCode: HTTP_STATUS.OK },
      ),
      { status: HTTP_STATUS.OK },
    );
  } catch (error: unknown) {
    return NextResponse.json(
      createErrorResponse('Failed to fetch cart.', {
        statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        code: 'CART_FETCH_FAILED',
      }),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}));

/**
 * POST /api/v1/cart/items
 * Add item to cart.
 */
export const cartItemsPOST = withDatabase(withAuth(async (authReq) => {
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
    addToCartSchema,
  );
  if ('error' in result) {
    return NextResponse.json(result.error.response, {
      status: result.error.statusCode,
    });
  }

  try {
    const cart = await addToCart(authReq.user.id, result.data);
    return NextResponse.json(
      createSuccessResponse(
        {
          id: cart.id,
          items: cart.items,
        },
        { message: 'Item added to cart.', statusCode: HTTP_STATUS.CREATED },
      ),
      { status: HTTP_STATUS.CREATED },
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
      createErrorResponse('Failed to add item to cart.', {
        statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        code: 'CART_ADD_FAILED',
      }),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}));

/**
 * PATCH /api/v1/cart/items/:id
 * Update cart item quantity.
 */
export const cartItemPatch = withDatabase(withAuth(async (authReq) => {
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
  const itemId = pathSegments[pathSegments.length - 2];

  const paramResult = cartItemIdParamSchema.safeParse({ id: itemId });
  if (!paramResult.success) {
    return NextResponse.json(
      createErrorResponse('Invalid item ID.', {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        code: 'INVALID_ITEM_ID',
      }),
      { status: HTTP_STATUS.BAD_REQUEST },
    );
  }

  const result = await validateRequestBody(
    authReq as unknown as NextRequest,
    updateCartItemSchema,
  );
  if ('error' in result) {
    return NextResponse.json(result.error.response, {
      status: result.error.statusCode,
    });
  }

  try {
    const cart = await updateCartItemQuantity(
      authReq.user.id,
      itemId,
      result.data.quantity,
    );
    if (!cart) {
      return NextResponse.json(
        createErrorResponse('Item not found in cart.', {
          statusCode: HTTP_STATUS.NOT_FOUND,
          code: 'ITEM_NOT_FOUND',
        }),
        { status: HTTP_STATUS.NOT_FOUND },
      );
    }
    return NextResponse.json(
      createSuccessResponse(
        { id: cart.id, items: cart.items },
        { message: 'Cart item updated.', statusCode: HTTP_STATUS.OK },
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
      createErrorResponse('Failed to update cart item.', {
        statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        code: 'CART_UPDATE_FAILED',
      }),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}));

/**
 * DELETE /api/v1/cart/items/:id
 * Delete an item from cart.
 */
export const cartItemDelete = withDatabase(withAuth(async (authReq) => {
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
  const itemId = pathSegments[pathSegments.length - 2];

  const paramResult = cartItemIdParamSchema.safeParse({ id: itemId });
  if (!paramResult.success) {
    return NextResponse.json(
      createErrorResponse('Invalid item ID.', {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        code: 'INVALID_ITEM_ID',
      }),
      { status: HTTP_STATUS.BAD_REQUEST },
    );
  }

  try {
    const deleted = await deleteCartItem(authReq.user.id, itemId);
    if (!deleted) {
      return NextResponse.json(
        createErrorResponse('Item not found in cart.', {
          statusCode: HTTP_STATUS.NOT_FOUND,
          code: 'ITEM_NOT_FOUND',
        }),
        { status: HTTP_STATUS.NOT_FOUND },
      );
    }
    return NextResponse.json(
      createSuccessResponse(null, {
        message: 'Item removed from cart.',
        statusCode: HTTP_STATUS.OK,
      }),
      { status: HTTP_STATUS.OK },
    );
  } catch (error: unknown) {
    return NextResponse.json(
      createErrorResponse('Failed to delete item.', {
        statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        code: 'CART_DELETE_FAILED',
      }),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}));

/**
 * DELETE /api/v1/cart
 * Clear all items from cart.
 */
export const cartDELETE = withDatabase(withAuth(async (authReq) => {
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
    const deleted = await clearCart(authReq.user.id);
    if (!deleted) {
      return NextResponse.json(
        createErrorResponse('Cart not found.', {
          statusCode: HTTP_STATUS.NOT_FOUND,
          code: 'CART_NOT_FOUND',
        }),
        { status: HTTP_STATUS.NOT_FOUND },
      );
    }
    return NextResponse.json(
      createSuccessResponse(null, {
        message: 'Cart cleared.',
        statusCode: HTTP_STATUS.OK,
      }),
      { status: HTTP_STATUS.OK },
    );
  } catch (error: unknown) {
    return NextResponse.json(
      createErrorResponse('Failed to clear cart.', {
        statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        code: 'CART_CLEAR_FAILED',
      }),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}));

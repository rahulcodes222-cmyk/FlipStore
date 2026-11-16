/**
 * Order Management Controller (Part 10)
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withDatabase } from '@/backend/middleware/connectDb';
import { withAuth, type AuthenticatedRequest } from '@/backend/middleware/auth';
import { createSuccessResponse, createErrorResponse } from '@/backend/utils/response';
import { HTTP_STATUS } from '@/backend/constants';
import {
  getCheckoutSummary,
  createOrder,
  getOrderById,
  getMyOrders,
  cancelOrder,
  getOrderTracking,
  updateOrderStatus as updateOrderStatusSvc,
  getInvoice,
} from '@/backend/services/orderService';
import { checkoutSummarySchema, createOrderSchema } from '@/backend/validations/checkout.schema';
import { cancelOrderSchema, updateOrderStatusSchema } from '@/backend/validations/order.schema';

function toNextRequest(req: AuthenticatedRequest): NextRequest {
  return req as unknown as NextRequest;
}

async function parseBody<T>(req: NextRequest, schema: z.ZodSchema<T>): Promise<{ data: T } | { error: NextResponse }> {
  try {
    const body = await req.json().catch(() => ({}));
    const data = schema.parse(body ?? {});
    return { data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        error: NextResponse.json(
          createErrorResponse('Invalid request body.', { code: 'VALIDATION_ERROR', details: error.flatten().fieldErrors as Record<string, string[]> }),
          { status: HTTP_STATUS.UNPROCESSABLE_ENTITY },
        ),
      };
    }
    throw error;
  }
}

function serviceError(error: unknown, fallback: string, code = 'ORDER_ERROR') {
  const message = error instanceof Error ? error.message : fallback;
  const lower = message.toLowerCase();
  const status = /forbidden/.test(lower)
    ? HTTP_STATUS.FORBIDDEN
    : /not found/.test(lower)
      ? HTTP_STATUS.NOT_FOUND
      : /invalid|cannot|not permitted|allowed only|already|out of stock|available|empty|cart|required|mismatch/.test(lower)
        ? HTTP_STATUS.BAD_REQUEST
        : HTTP_STATUS.INTERNAL_SERVER_ERROR;
  return NextResponse.json(createErrorResponse(message, { code: status === HTTP_STATUS.FORBIDDEN ? 'FORBIDDEN' : status === HTTP_STATUS.NOT_FOUND ? 'NOT_FOUND' : code }), { status });
}

export const checkoutSummaryPOST = withDatabase(
  withAuth(async (req: AuthenticatedRequest) => {
    if (!req.user) return NextResponse.json(createErrorResponse('Authentication required.', { code: 'AUTH_REQUIRED' }), { status: HTTP_STATUS.UNAUTHORIZED });
    const parsed = await parseBody(toNextRequest(req), checkoutSummarySchema);
    if ('error' in parsed) return parsed.error;
    try {
      const summary = await getCheckoutSummary(req.user.id, parsed.data);
      return NextResponse.json(createSuccessResponse(summary, { message: 'Checkout summary calculated.' }), { status: HTTP_STATUS.OK });
    } catch (error) {
      return serviceError(error, 'Failed to calculate order summary.', 'CHECKOUT_SUMMARY_FAILED');
    }
  }),
);

export const ordersPOST = withDatabase(
  withAuth(async (req: AuthenticatedRequest) => {
    if (!req.user) return NextResponse.json(createErrorResponse('Authentication required.', { code: 'AUTH_REQUIRED' }), { status: HTTP_STATUS.UNAUTHORIZED });
    const parsed = await parseBody(toNextRequest(req), createOrderSchema);
    if ('error' in parsed) return parsed.error;
    try {
      const order: any = await createOrder(req.user.id, parsed.data);
      return NextResponse.json(
        createSuccessResponse(
          {
            id: order.id || String(order._id),
            orderNumber: order.orderNumber,
            status: order.orderStatus,
            orderStatus: order.orderStatus,
            paymentStatus: order.paymentStatus,
            pricing: order.pricing,
            placedAt: order.placedAt,
          },
          { message: 'Order created successfully.' },
        ),
        { status: HTTP_STATUS.CREATED },
      );
    } catch (error) {
      return serviceError(error, 'Failed to create order.', 'ORDER_CREATE_FAILED');
    }
  }),
);

export const myOrdersGET = withDatabase(
  withAuth(async (req: AuthenticatedRequest) => {
    if (!req.user) return NextResponse.json(createErrorResponse('Authentication required.', { code: 'AUTH_REQUIRED' }), { status: HTTP_STATUS.UNAUTHORIZED });
    try {
      const orders = await getMyOrders(req.user.id, req.user.role);
      return NextResponse.json(createSuccessResponse(orders, { message: 'Orders fetched.' }), { status: HTTP_STATUS.OK });
    } catch (error) {
      return serviceError(error, 'Failed to fetch orders.', 'ORDERS_FETCH_FAILED');
    }
  }),
);

export const ordersGET = withDatabase(
  withAuth(async (req: AuthenticatedRequest, context?: { params: Promise<{ id: string }> }) => {
    if (!req.user) return NextResponse.json(createErrorResponse('Authentication required.', { code: 'AUTH_REQUIRED' }), { status: HTTP_STATUS.UNAUTHORIZED });
    const { id } = (await context?.params) || { id: '' };
    if (!id) return NextResponse.json(createErrorResponse('Order ID is required.', { code: 'VALIDATION_ERROR' }), { status: HTTP_STATUS.BAD_REQUEST });
    try {
      const order = await getOrderById(req.user.id, req.user.role, id);
      if (!order) return NextResponse.json(createErrorResponse('Order not found.', { code: 'NOT_FOUND' }), { status: HTTP_STATUS.NOT_FOUND });
      return NextResponse.json(createSuccessResponse(order, { message: 'Order retrieved.' }), { status: HTTP_STATUS.OK });
    } catch (error) {
      return serviceError(error, 'Failed to fetch order.', 'ORDER_FETCH_FAILED');
    }
  }),
);

export const orderCancelPATCH = withDatabase(
  withAuth(async (req: AuthenticatedRequest, context?: { params: Promise<{ id: string }> }) => {
    if (!req.user) return NextResponse.json(createErrorResponse('Authentication required.', { code: 'AUTH_REQUIRED' }), { status: HTTP_STATUS.UNAUTHORIZED });
    const { id } = (await context?.params) || { id: '' };
    const parsed = await parseBody(toNextRequest(req), cancelOrderSchema);
    if ('error' in parsed) return parsed.error;
    try {
      const order = await cancelOrder(req.user.id, req.user.role, id, parsed.data.reason);
      return NextResponse.json(createSuccessResponse(order, { message: 'Order cancelled.' }), { status: HTTP_STATUS.OK });
    } catch (error) {
      return serviceError(error, 'Failed to cancel order.', 'ORDER_CANCEL_FAILED');
    }
  }),
);

export const orderTrackingGET = withDatabase(
  withAuth(async (req: AuthenticatedRequest, context?: { params: Promise<{ id: string }> }) => {
    if (!req.user) return NextResponse.json(createErrorResponse('Authentication required.', { code: 'AUTH_REQUIRED' }), { status: HTTP_STATUS.UNAUTHORIZED });
    const { id } = (await context?.params) || { id: '' };
    try {
      const tracking = await getOrderTracking(req.user.id, req.user.role, id);
      return NextResponse.json(createSuccessResponse(tracking, { message: 'Tracking fetched.' }), { status: HTTP_STATUS.OK });
    } catch (error) {
      return serviceError(error, 'Failed to fetch tracking.', 'TRACKING_FETCH_FAILED');
    }
  }),
);

export const orderStatusPATCH = withDatabase(
  withAuth(async (req: AuthenticatedRequest, context?: { params: Promise<{ id: string }> }) => {
    if (!req.user) return NextResponse.json(createErrorResponse('Authentication required.', { code: 'AUTH_REQUIRED' }), { status: HTTP_STATUS.UNAUTHORIZED });
    const { id } = (await context?.params) || { id: '' };
    const parsed = await parseBody(toNextRequest(req), updateOrderStatusSchema);
    if ('error' in parsed) return parsed.error;
    try {
      const order = await updateOrderStatusSvc(req.user.id, req.user.role, id, parsed.data);
      return NextResponse.json(createSuccessResponse(order, { message: 'Order status updated.' }), { status: HTTP_STATUS.OK });
    } catch (error) {
      return serviceError(error, 'Failed to update order status.', 'ORDER_STATUS_UPDATE_FAILED');
    }
  }),
);

export const orderInvoiceGET = withDatabase(
  withAuth(async (req: AuthenticatedRequest, context?: { params: Promise<{ id: string }> }) => {
    if (!req.user) return NextResponse.json(createErrorResponse('Authentication required.', { code: 'AUTH_REQUIRED' }), { status: HTTP_STATUS.UNAUTHORIZED });
    const { id } = (await context?.params) || { id: '' };
    try {
      const invoice = await getInvoice(id, req.user.id, req.user.role);
      return NextResponse.json(createSuccessResponse(invoice, { message: 'Invoice fetched.' }), { status: HTTP_STATUS.OK });
    } catch (error) {
      return serviceError(error, 'Failed to fetch invoice.', 'INVOICE_FETCH_FAILED');
    }
  }),
);

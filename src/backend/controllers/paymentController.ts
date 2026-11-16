/**
 * Payment Controller
 * Secure Razorpay payment APIs: create order, verify, webhook, get, refund.
 */
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/backend/config/db';
import { withAuth, type AuthenticatedRequest } from '@/backend/middleware/auth';
import { withDatabase } from '@/backend/middleware/connectDb';
import { withRoles } from '@/backend/middleware/rbac';
import { validateBody } from '@/backend/middleware/validate';
import { createPaymentOrderSchema, refundPaymentSchema, verifyPaymentSchema } from '@/backend/validations/payment.schema';
import {
  createPaymentOrder,
  getPaymentById,
  handleWebhook,
  refundPayment,
  verifyPayment,
  PaymentServiceError,
} from '@/backend/services/paymentService';
import { createSuccessResponse, createErrorResponse } from '@/backend/utils/response';
import { HTTP_STATUS } from '@/backend/constants';
import { USER_ROLES } from '@/backend/constants/roles';

function toNextRequest(req: AuthenticatedRequest): NextRequest {
  return req as unknown as NextRequest;
}

function handleServiceError(error: unknown): NextResponse {
  if (error instanceof PaymentServiceError) {
    return NextResponse.json(
      createErrorResponse(error.message, { code: error.code }),
      { status: error.status },
    );
  }
  const message = error instanceof Error ? error.message : 'Payment operation failed.';
  return NextResponse.json(
    createErrorResponse(message, { code: 'INTERNAL_ERROR' }),
    { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
  );
}

export const createPaymentOrderHandler = withDatabase(
  withAuth(async (req: AuthenticatedRequest) => {
    if (!req.user) {
      return NextResponse.json(createErrorResponse('Authentication required.', { code: 'AUTH_REQUIRED' }), { status: HTTP_STATUS.UNAUTHORIZED });
    }
    const validation = await validateBody(toNextRequest(req), createPaymentOrderSchema);
    if (validation.error) {
      return NextResponse.json(validation.error.response, { status: validation.error.statusCode });
    }
    try {
      const result = await createPaymentOrder(req.user.id, validation.data);
      return NextResponse.json(
        createSuccessResponse(
          {
            paymentId: String((result.payment as any)._id || (result.payment as any).id),
            transactionId: result.payment.transactionId,
            status: result.payment.status,
            razorpayOrderId: result.payment.gatewayOrderId,
            amount: result.payment.grossAmount,
            currency: 'INR',
            keyId: result.keyId || '',
            sandbox: result.sandbox,
            alreadyPaid: result.alreadyPaid,
            razorpayOrder: result.razorpayOrder,
          },
          { message: result.alreadyPaid ? 'Order already paid.' : 'Payment order created.' },
        ),
        { status: HTTP_STATUS.OK },
      );
    } catch (error) {
      return handleServiceError(error);
    }
  }),
);

export const verifyPaymentHandler = withDatabase(
  withAuth(async (req: AuthenticatedRequest) => {
    if (!req.user) {
      return NextResponse.json(createErrorResponse('Authentication required.', { code: 'AUTH_REQUIRED' }), { status: HTTP_STATUS.UNAUTHORIZED });
    }
    const validation = await validateBody(toNextRequest(req), verifyPaymentSchema);
    if (validation.error) {
      return NextResponse.json(validation.error.response, { status: validation.error.statusCode });
    }
    try {
      const result = await verifyPayment(req.user.id, validation.data);
      return NextResponse.json(
        createSuccessResponse(
          {
            paymentId: String((result.payment as any)._id || (result.payment as any).id),
            status: result.payment.status,
            orderId: String(result.payment.orderId),
            verified: result.verified,
            idempotent: result.idempotent,
            sandbox: result.sandbox ?? false,
          },
          { message: result.idempotent ? 'Payment already verified.' : 'Payment verified successfully.' },
        ),
        { status: HTTP_STATUS.OK },
      );
    } catch (error) {
      return handleServiceError(error);
    }
  }),
);

// Webhook: no user auth; authenticity enforced via Razorpay webhook signature (or sandbox mode when secret unset).
export async function webhookHandler(req: NextRequest): Promise<NextResponse> {
  try {
    await connectDB();
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');
    let event: Record<string, unknown> = {};
    try {
      event = rawBody ? JSON.parse(rawBody) : {};
    } catch {
      event = {};
    }
    const result = await handleWebhook(rawBody, signature, event);
    return NextResponse.json(createSuccessResponse(result, { message: 'Webhook processed.' }), { status: HTTP_STATUS.OK });
  } catch (error) {
    if (error instanceof PaymentServiceError && error.code === 'INVALID_WEBHOOK_SIGNATURE') {
      return NextResponse.json(createErrorResponse('Invalid signature', { code: 'INVALID_WEBHOOK_SIGNATURE' }), { status: HTTP_STATUS.BAD_REQUEST });
    }
    // Acknowledge to avoid noisy retries for non-signature processing issues
    return NextResponse.json(createSuccessResponse({ handled: false }, { message: 'Webhook acknowledged.' }), { status: HTTP_STATUS.OK });
  }
}

export const getPaymentHandler = withDatabase(
  withAuth(async (req: AuthenticatedRequest, context?: { params: Promise<{ id: string }> }) => {
    if (!req.user) {
      return NextResponse.json(createErrorResponse('Authentication required.', { code: 'AUTH_REQUIRED' }), { status: HTTP_STATUS.UNAUTHORIZED });
    }
    const { id } = (await context?.params) || { id: '' };
    if (!id) {
      return NextResponse.json(createErrorResponse('Payment ID is required.', { code: 'VALIDATION_ERROR' }), { status: HTTP_STATUS.BAD_REQUEST });
    }
    try {
      const payment = await getPaymentById(req.user.id, req.user.role, id);
      return NextResponse.json(createSuccessResponse({ payment }, { message: 'Payment fetched.' }), { status: HTTP_STATUS.OK });
    } catch (error) {
      return handleServiceError(error);
    }
  }),
);

export const refundPaymentHandler = withDatabase(
  withAuth(
    withRoles([USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN])(async (req: AuthenticatedRequest, context?: { params: Promise<{ id: string }> }) => {
      if (!req.user) {
        return NextResponse.json(createErrorResponse('Authentication required.', { code: 'AUTH_REQUIRED' }), { status: HTTP_STATUS.UNAUTHORIZED });
      }
      const { id } = (await context?.params) || { id: '' };
      if (!id) {
        return NextResponse.json(createErrorResponse('Payment ID is required.', { code: 'VALIDATION_ERROR' }), { status: HTTP_STATUS.BAD_REQUEST });
      }
      const validation = await validateBody(toNextRequest(req), refundPaymentSchema);
      if (validation.error) {
        return NextResponse.json(validation.error.response, { status: validation.error.statusCode });
      }
      try {
        const payment = await refundPayment(req.user.id, req.user.role, id, validation.data);
        return NextResponse.json(
          createSuccessResponse(
            { paymentId: String((payment as any)._id || (payment as any).id), status: payment.status, refundAmount: payment.refundAmount },
            { message: 'Refund processed.' },
          ),
          { status: HTTP_STATUS.OK },
        );
      } catch (error) {
        return handleServiceError(error);
      }
    }),
  ),
);

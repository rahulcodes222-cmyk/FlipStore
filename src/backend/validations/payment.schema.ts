/**
 * Zod Validation Schemas for Payments (Razorpay / Cashfree)
 */
import { z } from 'zod';

export const createPaymentOrderSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required.'),
  idempotencyKey: z.string().trim().min(1).max(128).optional(),
});

export const verifyPaymentSchema = z.object({
  paymentId: z.string().min(1, 'Payment record ID is required.'),
  // Razorpay fields (optional when using Cashfree/server-verified gateway)
  razorpayOrderId: z.string().min(1).optional(),
  razorpayPaymentId: z.string().min(1).optional(),
  razorpaySignature: z.string().min(1).optional(),
  // Cashfree / generic gateway fields
  gateway: z.string().optional(),
  gatewayOrderId: z.string().min(1).optional(),
  cashfreeOrderId: z.string().min(1).optional(),
}).refine((data) => {
  const hasRazorpay = !!(data.razorpayOrderId && data.razorpayPaymentId && data.razorpaySignature);
  const hasGatewayOrder = !!(data.gatewayOrderId || data.cashfreeOrderId || data.razorpayOrderId);
  return hasRazorpay || hasGatewayOrder;
}, {
  message: 'Provide Razorpay verification fields or gateway order reference.',
});

export const refundPaymentSchema = z.object({
  amount: z.number().positive('Refund amount must be positive.').optional(),
  reason: z.string().trim().max(500).optional(),
  idempotencyKey: z.string().trim().min(1).max(128).optional(),
});

export type CreatePaymentOrderInput = z.infer<typeof createPaymentOrderSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
export type RefundPaymentInput = z.infer<typeof refundPaymentSchema>;

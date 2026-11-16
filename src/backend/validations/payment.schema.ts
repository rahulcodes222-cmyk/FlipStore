/**
 * Zod Validation Schemas for Payments (Razorpay)
 */
import { z } from 'zod';

export const createPaymentOrderSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required.'),
  idempotencyKey: z.string().trim().min(1).max(128).optional(),
});

export const verifyPaymentSchema = z.object({
  paymentId: z.string().min(1, 'Payment record ID is required.'),
  razorpayOrderId: z.string().min(1, 'Razorpay order ID is required.'),
  razorpayPaymentId: z.string().min(1, 'Razorpay payment ID is required.'),
  razorpaySignature: z.string().min(1, 'Razorpay signature is required.'),
});

export const refundPaymentSchema = z.object({
  amount: z.number().positive('Refund amount must be positive.').optional(),
  reason: z.string().trim().max(500).optional(),
  idempotencyKey: z.string().trim().min(1).max(128).optional(),
});

export type CreatePaymentOrderInput = z.infer<typeof createPaymentOrderSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
export type RefundPaymentInput = z.infer<typeof refundPaymentSchema>;

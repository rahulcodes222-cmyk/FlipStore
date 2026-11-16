import { z } from 'zod';

export const vendorPayoutRequestSchema = z.object({
  amount: z.coerce.number().positive('Amount must be greater than 0.'),
  note: z.string().trim().max(500).optional(),
  idempotencyKey: z.string().trim().max(120).optional(),
});

export const adminPayoutStatusSchema = z.enum([
  'UNDER_REVIEW', 'APPROVED', 'PROCESSING', 'COMPLETED', 'REJECTED', 'FAILED', 'PENDING',
]);

export const adminPayoutUpdateSchema = z.object({
  status: adminPayoutStatusSchema,
  adminNote: z.string().trim().max(1000).optional(),
  rejectionReason: z.string().trim().max(1000).optional(),
  failureReason: z.string().trim().max(1000).optional(),
  transactionReference: z.string().trim().max(200).optional(),
  provider: z.string().trim().max(120).optional(),
  providerPayoutId: z.string().trim().max(200).optional(),
  reconciliationConfirmed: z.boolean().optional(),
  idempotencyKey: z.string().trim().max(120).optional(),
});

export const vendorFinanceQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
  status: z.string().optional(),
  groupBy: z.enum(['day', 'month']).optional(),
});

export type VendorPayoutRequestInput = z.infer<typeof vendorPayoutRequestSchema>;
export type AdminPayoutUpdateInput = z.infer<typeof adminPayoutUpdateSchema>;
export type VendorFinanceQueryInput = z.infer<typeof vendorFinanceQuerySchema>;

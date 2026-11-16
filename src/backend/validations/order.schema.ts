import { z } from 'zod';

export const ORDER_STATUSES = [
  'PENDING',
  'PLACED',
  'CONFIRMED',
  'PROCESSING',
  'PACKED',
  'SHIPPED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
  'RETURN_REQUESTED',
  'RETURNED',
  'REFUNDED',
] as const;

export const orderIdParamSchema = z.object({
  id: z.string().min(1, 'Order ID is required.'),
});

export const cancelOrderSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  note: z.string().trim().max(500).optional(),
  trackingNumber: z.string().trim().max(100).optional(),
  trackingUrl: z.string().trim().url().max(500).optional(),
  carrier: z.string().trim().max(100).optional(),
  currentLocation: z.string().trim().max(200).optional(),
  estimatedDelivery: z.string().optional(),
  subOrderId: z.string().trim().optional(),
});

export const createReturnSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required.'),
  subOrderId: z.string().trim().optional(),
  productId: z.string().min(1, 'Product ID is required.'),
  quantity: z.number().int().min(1).max(100).default(1),
  reason: z.string().trim().min(3, 'Reason is required.').max(500),
  type: z.enum(['RETURN', 'REPLACEMENT']).default('RETURN'),
  notes: z.string().trim().max(1000).optional(),
});

export const updateReturnStatusSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'PROCESSING', 'COMPLETED', 'REFUNDED', 'REPLACED']),
  note: z.string().trim().max(500).optional(),
  refundAmount: z.number().min(0).optional(),
});

export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type CreateReturnInput = z.infer<typeof createReturnSchema>;
export type UpdateReturnStatusInput = z.infer<typeof updateReturnStatusSchema>;

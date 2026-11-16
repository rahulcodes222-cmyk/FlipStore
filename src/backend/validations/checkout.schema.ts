/**
 * Zod Validation Schemas for Checkout and Order Management
 * Shared validation logic for checkout summary and order creation.
 * Uses Zod v4 API.
 */

import { z } from 'zod';

export const checkoutSummarySchema = z.object({
  cartItems: z
    .array(
      z.object({
        productId: z.string().min(1, 'Product ID is required.'),
        variantId: z.string().optional(),
        quantity: z
          .number()
          .int()
          .min(1, 'Quantity must be at least 1.')
          .max(100, 'Quantity cannot exceed 100.'),
      }),
    )
    .min(1, 'At least one cart item is required.'),
  shippingAddressId: z.string().min(1, 'Shipping address ID is required.'),
  paymentMethod: z.enum(['COD', 'UPI', 'CARD', 'NET_BANKING']),
});

export const createOrderSchema = z.object({
  shippingAddressId: z.string().min(1, 'Shipping address ID is required.'),
  paymentMethod: z.enum(['COD', 'UPI', 'CARD', 'NET_BANKING']),
  couponCode: z.string().trim().min(1).optional(),
});

export type CheckoutSummaryInput = z.infer<typeof checkoutSummarySchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;

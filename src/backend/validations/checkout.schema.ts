/**
 * Zod Validation Schemas for Checkout and Order Management
 * Shared validation logic for checkout summary and order creation.
 * Uses Zod v4 API.
 */

import { z } from 'zod';

const cartItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required.'),
  variantId: z.string().optional(),
  quantity: z
    .number()
    .int()
    .min(1, 'Quantity must be at least 1.')
    .max(100, 'Quantity cannot exceed 100.'),
});

export const checkoutSummarySchema = z.object({
  cartItems: z.array(cartItemSchema).min(1, 'At least one cart item is required.'),
  shippingAddressId: z.string().min(1, 'Shipping address ID is required.'),
  paymentMethod: z.enum(['COD', 'UPI', 'CARD', 'NET_BANKING']),
  shippingAddress: z.object({
    pincode: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    locality: z.string().optional(),
    street: z.string().optional(),
  }).optional(),
});

export const createOrderSchema = z.object({
  shippingAddressId: z.string().min(1, 'Shipping address ID is required.'),
  paymentMethod: z.enum(['COD', 'UPI', 'CARD', 'NET_BANKING']),
  couponCode: z.string().trim().min(1).optional(),
  shippingAddress: z.object({
    pincode: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    locality: z.string().optional(),
    street: z.string().optional(),
  }).optional(),
  // Optional fallback for client-tracked carts; prices/stock are server-validated from DB.
  cartItems: z.array(cartItemSchema).optional(),
});

export type CheckoutSummaryInput = z.infer<typeof checkoutSummarySchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;


export const validateCouponSchema = z.object({
  couponCode: z.string().trim().min(1, 'Coupon code is required.'),
  cartItems: z.array(cartItemSchema).optional(),
  shippingAddressId: z.string().min(1).optional(),
});

export type ValidateCouponInput = z.infer<typeof validateCouponSchema>;

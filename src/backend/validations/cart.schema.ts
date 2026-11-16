/**
 * Zod Validation Schemas for Cart and Wishlist Management
 * Shared validation logic for cart CRUD and wishlist CRUD operations.
 * Uses Zod v4 API.
 */

import { z } from 'zod';

/**
 * Common field schemas
 */
const cartItemIdSchema = z.string().min(1, 'Item ID is required.');
const productIdSchema = z.string().min(1, 'Product ID is required.');
const quantitySchema = z
  .number()
  .int('Quantity must be a whole number.')
  .min(1, 'Quantity must be at least 1.')
  .max(100, 'Quantity cannot exceed 100.');

/**
 * Add Item to Cart Schema
 */
export const addToCartSchema = z.object({
  productId: productIdSchema,
  variantId: z.string().optional(),
  quantity: quantitySchema.optional().default(1),
});

/**
 * Update Cart Item Quantity Schema
 */
export const updateCartItemSchema = z.object({
  quantity: quantitySchema,
});

/**
 * Cart Item ID Parameter Schema
 */
export const cartItemIdParamSchema = z.object({
  itemId: cartItemIdSchema,
});

/**
 * Wishlist Item ID Parameter Schema
 */
export const wishlistItemIdParamSchema = z.object({
  productId: productIdSchema,
});

/**
 * Export types inferred from schemas
 */
export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
export type CartItemIdParamInput = z.infer<typeof cartItemIdParamSchema>;
export type WishlistItemIdParamInput = z.infer<typeof wishlistItemIdParamSchema>;

/**
 * Cart Service
 * Business logic for cart management.
 * Keeps business logic separate from API route handlers.
 *
 * Key design decisions:
 * - All prices fetched fresh from MongoDB (never trust frontend prices)
 * - Stock validated before adding/updating cart items
 * - Duplicate cart items merged (quantity incremented)
 * - Supports product variants
 * - Supports products from multiple vendors in one cart
 */

import { CartModel } from '@/backend/models';
import type { ICartDocument } from '@/backend/types';
import type { AddToCartInput, UpdateCartItemInput } from '@/backend/validations/cart.schema';

/**
 * Get cart for a user.
 * Returns the cart with current product prices and stock info.
 */
export async function getCart(userId: string): Promise<ICartDocument | null> {
  const cart = await CartModel.findOne({ userId }).lean().exec();
  return cart;
}

/**
 * Add a product to cart or update quantity if already exists.
 * Validates stock before adding.
 */
export async function addToCart(
  userId: string,
  data: AddToCartInput,
): Promise<ICartDocument> {
  const { productId, variantId, quantity } = data;

  // Fetch product from DB to get current price, MRP, stock
  const ProductModel = (await import('@/backend/models/Product')).ProductModel;
  const product = await ProductModel.findOne({ _id: productId }).exec();
  if (!product) {
    throw new Error('Product not found.');
  }

  // Check if product is active/published
  if (product.status !== 'PUBLISHED') {
    throw new Error('Product is not available for purchase.');
  }

  // Validate stock
  const effectiveStock = variantId
    ? product.variants?.find((v) => v.id === variantId)?.stock ?? 0
    : product.stock;

  if (effectiveStock <= 0) {
    throw new Error('Product is out of stock.');
  }

  const requestedQuantity = quantity;
  if (requestedQuantity > effectiveStock) {
    throw new Error(`Only ${effectiveStock} units available.`);
  }

  const cart = await CartModel.findOne({ userId }).exec();

  if (!cart) {
    // Create new cart
    const newItem = {
      id: `item-${Date.now()}`,
      productId,
      variantId: variantId || undefined,
      productName: product.name,
      thumbnail: product.images?.[0]?.url || '',
      price: product.price,
      mrp: product.mrp,
      quantity: requestedQuantity,
      selectedVariants: {},
      addedAt: new Date(),
    };

    const newCart = await CartModel.create({
      userId,
      items: [newItem],
    });
    return newCart;
  }

  // Cart exists - check if item already exists
  const existingItemIndex = cart.items.findIndex(
    (item) => item.productId === productId && item.variantId === variantId,
  );

  if (existingItemIndex !== -1) {
    // Item exists - update quantity
    const existingItem = cart.items[existingItemIndex];
    const newQuantity = existingItem.quantity + requestedQuantity;

    if (newQuantity > effectiveStock) {
      throw new Error(
        `Only ${effectiveStock} units available. You already have ${existingItem.quantity} in cart.`,
      );
    }

    existingItem.quantity = newQuantity;
    await cart.save();
    return cart;
  }

  // New item - add to cart
  const newItem = {
    id: `item-${Date.now()}`,
    productId,
    variantId: variantId || undefined,
    productName: product.name,
    thumbnail: product.images?.[0]?.url || '',
    price: product.price,
    mrp: product.mrp,
    quantity: requestedQuantity,
    selectedVariants: {},
    addedAt: new Date(),
  };

  cart.items.push(newItem);
  await cart.save();
  return cart;
}

/**
 * Update quantity of a cart item.
 * Validates stock before updating.
 */
export async function updateCartItemQuantity(
  userId: string,
  itemId: string,
  quantity: number,
): Promise<ICartDocument | null> {
  const cart = await CartModel.findOne({ userId }).exec();
  if (!cart) {
    throw new Error('Cart not found.');
  }

  const itemIndex = cart.items.findIndex((item) => item.id === itemId);
  if (itemIndex === -1) {
    throw new Error('Item not found in cart.');
  }

  const item = cart.items[itemIndex];

  // Fetch product to validate stock
  const ProductModel = (await import('@/backend/models/Product')).ProductModel;
  const product = await ProductModel.findOne({ _id: item.productId }).exec();
  if (!product) {
    throw new Error('Product not found.');
  }

  if (product.status !== 'PUBLISHED') {
    throw new Error('Product is no longer available.');
  }

  // Validate stock
  const itemVariantId = item.variantId;
  const effectiveStock = itemVariantId
    ? product.variants?.find((v) => v.id === itemVariantId)?.stock ?? 0
    : product.stock;

  if (quantity > effectiveStock) {
    throw new Error(`Only ${effectiveStock} units available.`);
  }

  // Update quantity
  item.quantity = quantity;
  await cart.save();
  return cart;
}

/**
 * Delete an item from cart.
 */
export async function deleteCartItem(userId: string, itemId: string): Promise<boolean> {
  const cart = await CartModel.findOne({ userId }).exec();
  if (!cart) {
    return false;
  }

  const initialLength = cart.items.length;
  cart.items = cart.items.filter((item) => item.id !== itemId);

  if (cart.items.length === initialLength) {
    return false;
  }

  await cart.save();
  return true;
}

/**
 * Clear all items from cart.
 */
export async function clearCart(userId: string): Promise<boolean> {
  const cart = await CartModel.findOne({ userId }).exec();
  if (!cart) {
    return false;
  }

  cart.items = [];
  await cart.save();
  return true;
}

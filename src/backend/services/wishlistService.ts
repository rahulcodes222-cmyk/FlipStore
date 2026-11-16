/**
 * Wishlist Service
 * Business logic for wishlist management.
 * Keeps business logic separate from API route handlers.
 *
 * Key design decisions:
 * - All prices fetched fresh from MongoDB (never trust frontend prices)
 * - Supports adding items to cart from wishlist
 * - Prevents duplicate wishlist items
 */

import { WishlistModel } from '@/backend/models';
import { addToCart } from '@/backend/services/cartService';
import type { IWishlistDocument, ICartDocument } from '@/backend/types';

/**
 * Get wishlist for a user.
 * Returns the wishlist with current product prices.
 */
export async function getWishlist(userId: string): Promise<IWishlistDocument | null> {
  const wishlist = await WishlistModel.findOne({ userId }).exec();
  return wishlist;
}

/**
 * Add a product to wishlist.
 * Does nothing if product already in wishlist.
 */
export async function addToWishlist(
  userId: string,
  productId: string,
): Promise<IWishlistDocument> {
  const ProductModel = (await import('@/backend/models/Product')).ProductModel;
  const product = await ProductModel.findOne({ _id: productId }).exec();
  if (!product) {
    throw new Error('Product not found.');
  }

  const wishlist = await WishlistModel.findOne({ userId }).exec();

  if (!wishlist) {
    // Create new wishlist
    const newItem = {
      id: `wish-${Date.now()}`,
      productId,
      productName: product.name,
      thumbnail: product.images?.[0]?.url || '',
      price: product.price,
      addedAt: new Date(),
    };

    const newWishlist = await WishlistModel.create({
      userId,
      items: [newItem],
    });
    return newWishlist;
  }

  // Wishlist exists - check if item already exists
  const existingItemIndex = wishlist.items.findIndex(
    (item) => item.productId === productId,
  );

  if (existingItemIndex !== -1) {
    // Already in wishlist - return as-is
    return wishlist;
  }

  // New item - add to wishlist
  const newItem = {
    id: `wish-${Date.now()}`,
    productId,
    productName: product.name,
    thumbnail: product.images?.[0]?.url || '',
    price: product.price,
    addedAt: new Date(),
  };

  wishlist.items.push(newItem);
  await wishlist.save();
  return wishlist;
}

/**
 * Remove an item from wishlist.
 */
export async function removeFromWishlist(
  userId: string,
  productId: string,
): Promise<boolean> {
  const wishlist = await WishlistModel.findOne({ userId }).exec();
  if (!wishlist) {
    return false;
  }

  const initialLength = wishlist.items.length;
  wishlist.items = wishlist.items.filter((item) => item.productId !== productId);

  if (wishlist.items.length === initialLength) {
    return false;
  }

  await wishlist.save();
  return true;
}

/**
 * Check if a product is in wishlist.
 */
export async function isInWishlist(
  userId: string,
  productId: string,
): Promise<boolean> {
  const wishlist = await WishlistModel.findOne({ userId }).exec();
  if (!wishlist) {
    return false;
  }

  return wishlist.items.some((item) => item.productId === productId);
}

/**
 * Move item from wishlist to cart.
 * Adds the product to cart with quantity 1, then removes from wishlist.
 */
export async function moveWishlistItemToCart(
  userId: string,
  productId: string,
): Promise<ICartDocument | null> {
  const { addToCart } = await import('@/backend/services/cartService');

  // Add to cart
  const cart = await addToCart(userId, {
    productId,
    quantity: 1,
  });

  // Remove from wishlist
  await removeFromWishlist(userId, productId);

  return cart;
}

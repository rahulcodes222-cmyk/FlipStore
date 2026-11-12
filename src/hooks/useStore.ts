"use client";

import { useCartStore } from "@/store/useCartStore";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useRecentlyViewedStore } from "@/store/useRecentlyViewedStore";

/**
 * Convenience hook: Cart actions (add, remove, update quantity, clear)
 */
export function useCart() {
  const items = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const clearCart = useCartStore((s) => s.clearCart);
  const getSummary = useCartStore((s) => s.getSummary);
  const appliedCoupon = useCartStore((s) => s.appliedCoupon);
  const applyCoupon = useCartStore((s) => s.applyCoupon);
  const removeCoupon = useCartStore((s) => s.removeCoupon);
  const hasHydrated = useCartStore((s) => s._hasHydrated);

  const isInCart = (productId: string) =>
    items.some((item) => item.productId === productId);

  const getItemQuantity = (productId: string) =>
    items.find((item) => item.productId === productId)?.quantity ?? 0;

  const totalItems = items.reduce((total, item) => total + item.quantity, 0);

  return {
    items,
    totalItems,
    appliedCoupon,
    hasHydrated,
    isInCart,
    getItemQuantity,
    getSummary,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    applyCoupon,
    removeCoupon,
  };
}

/**
 * Convenience hook: Wishlist actions
 */
export function useWishlist() {
  const items = useWishlistStore((s) => s.items);
  const addItem = useWishlistStore((s) => s.addItem);
  const removeItem = useWishlistStore((s) => s.removeItem);
  const toggleItem = useWishlistStore((s) => s.toggleItem);
  const isInWishlist = useWishlistStore((s) => s.isInWishlist);
  const hasHydrated = useWishlistStore((s) => s._hasHydrated);

  return {
    items,
    totalItems: items.length,
    hasHydrated,
    isInWishlist,
    addItem,
    removeItem,
    toggleItem,
  };
}

/**
 * Convenience hook: Auth state and actions
 */
export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);
  const updateUser = useAuthStore((s) => s.updateUser);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  const isAdmin = user?.role === "admin";

  return {
    user,
    isAuthenticated,
    isAdmin,
    hasHydrated,
    setUser,
    logout,
    updateUser,
  };
}

/**
 * Convenience hook: Recently viewed products
 */
export function useRecentlyViewed() {
  const products = useRecentlyViewedStore((s) => s.products);
  const addProduct = useRecentlyViewedStore((s) => s.addProduct);
  const clearRecentlyViewed = useRecentlyViewedStore((s) => s.clearRecentlyViewed);
  const hasHydrated = useRecentlyViewedStore((s) => s._hasHydrated);

  return {
    products,
    hasHydrated,
    addProduct,
    clearRecentlyViewed,
  };
}

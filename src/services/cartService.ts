import { CartItem, Coupon, Product } from "@/types";
import {
  getStandardDeliveryCharge,
  getFreeDeliveryThreshold,
  getTaxPercentage,
} from "@/lib/storeSettings";

const CART_STORAGE_KEY = "my_ecommerce_cart_v1";

export interface CartCalculationSummary {
  itemsCount: number;
  totalMrp: number;
  discountOnMrp: number;
  subtotal: number;
  couponDiscount: number;
  taxAmount: number;
  deliveryCharges: number;
  totalPayable: number;
  totalSavings: number;
}

export const cartService = {
  /**
   * Read cart from localStorage (SSR-safe)
   */
  async getCart(): Promise<CartItem[]> {
    if (typeof window === "undefined") return [];
    try {
      const data = localStorage.getItem(CART_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Failed to read cart from localStorage", e);
      return [];
    }
  },

  /**
   * Save cart items to localStorage
   */
  async saveCart(items: CartItem[]): Promise<void> {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error("Failed to save cart to localStorage", e);
    }
  },

  /**
   * Add a product to the cart
   */
  async addToCart(
    product: Product,
    quantity: number = 1,
    selectedVariants?: Record<string, string>
  ): Promise<CartItem[]> {
    const items = await this.getCart();
    const existingIndex = items.findIndex((item) => item.productId === product.id);

    if (existingIndex > -1) {
      items[existingIndex].quantity += quantity;
      if (selectedVariants) {
        items[existingIndex].selectedVariants = selectedVariants;
      }
    } else {
      items.push({
        id: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        productId: product.id,
        product,
        quantity,
        selectedVariants,
        addedAt: new Date().toISOString(),
      });
    }

    await this.saveCart(items);
    return items;
  },

  /**
   * Update quantity of a product in the cart
   */
  async updateQuantity(productId: string, quantity: number): Promise<CartItem[]> {
    let items = await this.getCart();
    if (quantity <= 0) {
      items = items.filter((item) => item.productId !== productId);
    } else {
      const item = items.find((i) => i.productId === productId);
      if (item) {
        item.quantity = quantity;
      }
    }
    await this.saveCart(items);
    return items;
  },

  /**
   * Remove item from cart
   */
  async removeFromCart(productId: string): Promise<CartItem[]> {
    const items = await this.getCart();
    const filtered = items.filter((item) => item.productId !== productId);
    await this.saveCart(filtered);
    return filtered;
  },

  /**
   * Empty the entire cart
   */
  async clearCart(): Promise<void> {
    if (typeof window === "undefined") return;
    localStorage.removeItem(CART_STORAGE_KEY);
  },

  /**
   * Calculate full pricing summary for Flipkart-style Price Details widget
   */
  calculateSummary(items: CartItem[], coupon: Coupon | null = null, deliverySettings?: { standardFee?: number; freeThreshold?: number }): CartCalculationSummary {
    const itemsCount = items.reduce((acc, curr) => acc + curr.quantity, 0);
    const totalMrp = items.reduce((acc, curr) => acc + curr.product.mrp * curr.quantity, 0);
    const subtotal = items.reduce((acc, curr) => acc + curr.product.price * curr.quantity, 0);
    const discountOnMrp = totalMrp - subtotal;

    let couponDiscount = 0;
    if (coupon && subtotal >= coupon.minOrderValue) {
      if (coupon.discountType === "FLAT") {
        couponDiscount = coupon.discountValue;
      } else {
        const calculated = Math.round((subtotal * coupon.discountValue) / 100);
        couponDiscount = coupon.maxDiscount ? Math.min(calculated, coupon.maxDiscount) : calculated;
      }
    }

    // Tax on subtotal after discount (excluding coupon)
    const taxableAmount = Math.max(0, subtotal - couponDiscount);
    const taxRate = getTaxPercentage();
    const taxAmount = Math.round((taxableAmount * taxRate) / 100);

    // Use backend-configured delivery settings if provided, else fall back to stored admin settings, else APP_CONFIG defaults
    const standardFee = deliverySettings?.standardFee ?? getStandardDeliveryCharge();
    const freeThreshold = deliverySettings?.freeThreshold ?? getFreeDeliveryThreshold();

    // Free delivery if subtotal after discount >= freeThreshold, else standard fee
    const deliveryCharges =
      subtotal === 0 || subtotal >= freeThreshold
        ? 0
        : standardFee;

    const totalPayable = Math.max(0, subtotal - couponDiscount + deliveryCharges + taxAmount);
    const totalSavings = discountOnMrp + couponDiscount;

    return {
      itemsCount,
      totalMrp,
      discountOnMrp,
      subtotal,
      couponDiscount,
      taxAmount,
      deliveryCharges,
      totalPayable,
      totalSavings,
    };
  },
};

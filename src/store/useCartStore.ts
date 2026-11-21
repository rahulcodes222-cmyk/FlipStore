import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { CartItem, Coupon, Product } from "@/types";
import { cartService, CartCalculationSummary } from "@/services/cartService";

interface CartState {
  items: CartItem[];
  appliedCoupon: Coupon | null;
  _hasHydrated: boolean;

  // Actions
  addItem: (product: Product, quantity?: number, selectedVariants?: Record<string, string>) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  applyCoupon: (coupon: Coupon) => void;
  removeCoupon: () => void;
  clearCart: () => void;
  setHasHydrated: (state: boolean) => void;

  // Computed helper
  getSummary: (deliverySettings?: { standardFee?: number; freeThreshold?: number }) => CartCalculationSummary;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      appliedCoupon: null,
      _hasHydrated: false,

      addItem: (product, quantity = 1, selectedVariants) => {
        set((state) => {
          const items = [...state.items];
          const existingIndex = items.findIndex((i) => i.productId === product.id);

          if (existingIndex > -1) {
            items[existingIndex] = {
              ...items[existingIndex],
              quantity: items[existingIndex].quantity + quantity,
              selectedVariants: selectedVariants || items[existingIndex].selectedVariants,
            };
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

          return { items };
        });
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item.productId !== productId),
        }));
      },

      updateQuantity: (productId, quantity) => {
        set((state) => {
          if (quantity <= 0) {
            return {
              items: state.items.filter((item) => item.productId !== productId),
            };
          }
          return {
            items: state.items.map((item) =>
              item.productId === productId ? { ...item, quantity } : item
            ),
          };
        });
      },

      applyCoupon: (coupon) => {
        set({ appliedCoupon: coupon });
      },

      removeCoupon: () => {
        set({ appliedCoupon: null });
      },

      clearCart: () => {
        set({ items: [], appliedCoupon: null });
      },

      setHasHydrated: (hasHydrated) => {
        set({ _hasHydrated: hasHydrated });
      },

      getSummary: (deliverySettings?) => {
        const { items, appliedCoupon } = get();
        return cartService.calculateSummary(items, appliedCoupon, deliverySettings);
      },

      getItemCount: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },
    }),
    {
      name: "my_ecommerce_cart_store",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      partialize: (state) => ({
        items: state.items,
        appliedCoupon: state.appliedCoupon,
      }),
    }
  )
);

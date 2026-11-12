import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Product, WishlistItem } from "@/types";

interface WishlistState {
  items: WishlistItem[];
  _hasHydrated: boolean;

  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  toggleItem: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
  setHasHydrated: (state: boolean) => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      _hasHydrated: false,

      addItem: (product) => {
        set((state) => {
          const exists = state.items.some((i) => i.productId === product.id);
          if (exists) return state;
          return {
            items: [
              ...state.items,
              {
                id: `wish-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                productId: product.id,
                product,
                addedAt: new Date().toISOString(),
              },
            ],
          };
        });
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        }));
      },

      toggleItem: (product) => {
        const { isInWishlist, addItem, removeItem } = get();
        if (isInWishlist(product.id)) {
          removeItem(product.id);
        } else {
          addItem(product);
        }
      },

      isInWishlist: (productId) => {
        return get().items.some((i) => i.productId === productId);
      },

      clearWishlist: () => {
        set({ items: [] });
      },

      setHasHydrated: (hasHydrated) => {
        set({ _hasHydrated: hasHydrated });
      },
    }),
    {
      name: "my_ecommerce_wishlist_store",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      partialize: (state) => ({ items: state.items }),
    }
  )
);

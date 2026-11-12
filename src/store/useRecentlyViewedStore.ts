import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Product } from "@/types";

const MAX_RECENTLY_VIEWED = 12;

interface RecentlyViewedState {
  products: Product[];
  _hasHydrated: boolean;

  addProduct: (product: Product) => void;
  clearRecentlyViewed: () => void;
  setHasHydrated: (state: boolean) => void;
}

export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
    (set) => ({
      products: [],
      _hasHydrated: false,

      addProduct: (product) => {
        set((state) => {
          // Remove if already in list (to re-add at front)
          const filtered = state.products.filter((p) => p.id !== product.id);
          // Prepend and limit to MAX
          const updated = [product, ...filtered].slice(0, MAX_RECENTLY_VIEWED);
          return { products: updated };
        });
      },

      clearRecentlyViewed: () => {
        set({ products: [] });
      },

      setHasHydrated: (hasHydrated) => {
        set({ _hasHydrated: hasHydrated });
      },
    }),
    {
      name: "my_ecommerce_recently_viewed",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      partialize: (state) => ({ products: state.products }),
    }
  )
);

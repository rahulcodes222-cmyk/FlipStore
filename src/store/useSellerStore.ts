"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Seller, SellerStats } from "@/types";

interface SellerState {
  seller: Seller | null;
  isAuthenticated: boolean;
  stats: SellerStats | null;
  _hasHydrated: boolean;

  setSeller: (seller: Seller | null) => void;
  setStats: (stats: SellerStats | null) => void;
  logout: () => void;
  updateSeller: (updates: Partial<Seller>) => void;
  setHasHydrated: (state: boolean) => void;
}

export const useSellerStore = create<SellerState>()(
  persist(
    (set) => ({
      seller: null,
      isAuthenticated: false,
      stats: null,
      _hasHydrated: false,

      setSeller: (seller) => {
        set({ seller, isAuthenticated: !!seller });
      },

      setStats: (stats) => {
        set({ stats });
      },

      logout: () => {
        set({ seller: null, isAuthenticated: false, stats: null });
      },

      updateSeller: (updates) => {
        set((state) => {
          if (!state.seller) return state;
          return {
            seller: { ...state.seller, ...updates },
          };
        });
      },

      setHasHydrated: (hasHydrated) => {
        set({ _hasHydrated: hasHydrated });
      },
    }),
    {
      name: "my_ecommerce_seller_store",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      partialize: (state) => ({
        seller: state.seller,
        isAuthenticated: state.isAuthenticated,
        stats: state.stats,
      }),
    }
  )
);

export type { Seller, SellerStats };

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { User } from "@/types";
import { useCartStore } from "./useCartStore";
import { useWishlistStore } from "./useWishlistStore";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;

  setUser: (user: User | null) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      _hasHydrated: false,

      setUser: (user) => {
        set({ user, isAuthenticated: !!user });
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
        try { useCartStore.getState().clearCart(); } catch {}
        try { useWishlistStore.getState().clearWishlist(); } catch {}
      },

      updateUser: (updates) => {
        set((state) => {
          if (!state.user) return state;
          return {
            user: { ...state.user, ...updates },
          };
        });
      },

      setHasHydrated: (hasHydrated) => {
        set({ _hasHydrated: hasHydrated });
      },
    }),
    {
      name: "my_ecommerce_auth_store",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

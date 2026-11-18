import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface DeliveryLocation {
  pincode: string;
  city?: string;
  state?: string;
  area?: string;
  label?: string; // display label e.g. "110001, New Delhi"
}

interface DeliveryLocationState {
  location: DeliveryLocation | null;
  _hasHydrated: boolean;
  setLocation: (loc: DeliveryLocation | null) => void;
  clearLocation: () => void;
  setHasHydrated: (v: boolean) => void;
}

function makeLabel(loc: DeliveryLocation | null): string {
  if (!loc) return "";
  const parts = [loc.pincode, loc.area || loc.city, loc.state].map((p) => String(p || "").trim()).filter(Boolean);
  // avoid duplicate pincode/city combos
  const uniq: string[] = [];
  for (const p of parts) { if (!uniq.some((u) => u.toLowerCase() === p.toLowerCase())) uniq.push(p); }
  return uniq.join(", ");
}

export const useDeliveryLocationStore = create<DeliveryLocationState>()(
  persist(
    (set) => ({
      location: null,
      _hasHydrated: false,
      setLocation: (loc) => set({ location: loc ? { ...loc, label: loc.label || makeLabel(loc) } : null }),
      clearLocation: () => set({ location: null }),
      setHasHydrated: (v) => set({ _hasHydrated: v }),
    }),
    {
      name: "flipstore_delivery_location_v1",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => { state?.setHasHydrated(true); },
      partialize: (state) => ({ location: state.location }),
    }
  )
);

export function getDeliveryLocationLabel(loc: DeliveryLocation | null | undefined): string {
  if (!loc) return "Select delivery location";
  return loc.label || makeLabel(loc) || "Select delivery location";
}

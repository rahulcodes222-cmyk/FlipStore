/**
 * sellerStoreService — Frontend-only simulated seller store operations.
 */

import { Seller } from "@/types";

const STORE_SESSION_KEY = "my_ecommerce_seller_session_v1";

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function getSessionSeller(): Seller | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORE_SESSION_KEY);
    return raw ? (JSON.parse(raw) as Seller) : null;
  } catch {
    return null;
  }
}

function saveSessionSeller(seller: Seller) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORE_SESSION_KEY, JSON.stringify(seller));
  } catch {
    // ignore
  }
}

export const sellerStoreService = {
  async getStoreProfile(): Promise<Seller | null> {
    await delay(400);
    return getSessionSeller();
  },

  async updateStore(updates: Partial<Seller>): Promise<Seller> {
    await delay(600);
    const current = getSessionSeller();
    if (!current) throw new Error("No seller session found");

    const updated: Seller = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    saveSessionSeller(updated);
    return updated;
  },

  async toggleStoreStatus(): Promise<Seller> {
    await delay(500);
    const current = getSessionSeller();
    if (!current) throw new Error("No seller session found");
    const updated: Seller = {
      ...current,
      storeStatus:
        current.storeStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE",
      updatedAt: new Date().toISOString(),
    };
    saveSessionSeller(updated);
    return updated;
  },

  async uploadStoreImage(file: File): Promise<{ url: string }> {
    await delay(700);
    const url = URL.createObjectURL(file);
    return { url };
  },
};

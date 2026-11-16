/**
 * sellerProfileService — Frontend-only simulated seller profile operations.
 */

import { Seller } from "@/types";

const PROFILE_SESSION_KEY = "my_ecommerce_seller_session_v1";

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function getSessionSeller(): Seller | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PROFILE_SESSION_KEY);
    return raw ? (JSON.parse(raw) as Seller) : null;
  } catch {
    return null;
  }
}

function saveSessionSeller(seller: Seller) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PROFILE_SESSION_KEY, JSON.stringify(seller));
  } catch {
    // ignore
  }
}

export const sellerProfileService = {
  async getSellerProfile(): Promise<Seller | null> {
    await delay(400);
    return getSessionSeller();
  },

  async updateProfile(updates: Partial<Seller>): Promise<Seller> {
    await delay(600);
    const current = getSessionSeller();
    if (!current) throw new Error("No seller session found");

    const updated: Seller = { ...current, ...updates, updatedAt: new Date().toISOString() };
    saveSessionSeller(updated);
    return updated;
  },

  async updateAvatar(avatarUrl: string): Promise<Seller> {
    await delay(500);
    const current = getSessionSeller();
    if (!current) throw new Error("No seller session found");
    const updated: Seller = { ...current, avatar: avatarUrl, updatedAt: new Date().toISOString() };
    saveSessionSeller(updated);
    return updated;
  },
};

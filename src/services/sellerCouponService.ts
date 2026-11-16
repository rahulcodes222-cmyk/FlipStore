/**
 * sellerCouponService — Frontend-only simulated seller coupon operations.
 * All operations are scoped to the authenticated sellerId for data isolation.
 */

import type { SellerCoupon } from "@/types";
import { MOCK_SELLER_COUPONS } from "@/data/sellerFinancial";

const COUPON_SESSION_KEY = "my_ecommerce_seller_coupons_v1";

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function getStoredCoupons(sellerId: string): SellerCoupon[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(COUPON_SESSION_KEY);
    const all = raw ? (JSON.parse(raw) as Record<string, SellerCoupon[]>) : {};
    return all[sellerId] || MOCK_SELLER_COUPONS[sellerId] || [];
  } catch {
    return MOCK_SELLER_COUPONS[sellerId] || [];
  }
}

function saveStoredCoupons(sellerId: string, coupons: SellerCoupon[]) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(COUPON_SESSION_KEY);
    const all = raw ? (JSON.parse(raw) as Record<string, SellerCoupon[]>) : {};
    all[sellerId] = coupons;
    localStorage.setItem(COUPON_SESSION_KEY, JSON.stringify(all));
  } catch {
    // ignore
  }
}

export const sellerCouponService = {
  async getCoupons(sellerId: string): Promise<SellerCoupon[]> {
    await delay(400);
    return getStoredCoupons(sellerId);
  },

  async getCoupon(sellerId: string, couponId: string): Promise<SellerCoupon | null> {
    await delay(300);
    const coupons = getStoredCoupons(sellerId);
    return coupons.find((c) => c.id === couponId) || null;
  },

  async createCoupon(sellerId: string, coupon: Omit<SellerCoupon, "id" | "sellerId" | "usedCount" | "createdAt" | "updatedAt">): Promise<SellerCoupon> {
    await delay(600);
    const coupons = getStoredCoupons(sellerId);
    const now = new Date().toISOString();
    const newCoupon: SellerCoupon = {
      ...coupon,
      id: `cpn-${Date.now()}`,
      sellerId,
      usedCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    saveStoredCoupons(sellerId, [...coupons, newCoupon]);
    return newCoupon;
  },

  async updateCoupon(sellerId: string, couponId: string, updates: Partial<SellerCoupon>): Promise<SellerCoupon | null> {
    await delay(600);
    const coupons = getStoredCoupons(sellerId);
    const idx = coupons.findIndex((c) => c.id === couponId);
    if (idx === -1) return null;
    const updated: SellerCoupon = {
      ...coupons[idx],
      ...updates,
      id: couponId,
      sellerId,
      updatedAt: new Date().toISOString(),
    };
    const next = [...coupons];
    next[idx] = updated;
    saveStoredCoupons(sellerId, next);
    return updated;
  },

  async deleteCoupon(sellerId: string, couponId: string): Promise<boolean> {
    await delay(500);
    const coupons = getStoredCoupons(sellerId);
    const filtered = coupons.filter((c) => c.id !== couponId);
    if (filtered.length === coupons.length) return false;
    saveStoredCoupons(sellerId, filtered);
    return true;
  },

  async toggleCouponStatus(sellerId: string, couponId: string): Promise<SellerCoupon | null> {
    await delay(500);
    const coupons = getStoredCoupons(sellerId);
    const idx = coupons.findIndex((c) => c.id === couponId);
    if (idx === -1) return null;
    const current = coupons[idx];
    const newStatus: "ACTIVE" | "DISABLED" = current.status === "ACTIVE" ? "DISABLED" : "ACTIVE";
    const updated: SellerCoupon = { ...current, status: newStatus, updatedAt: new Date().toISOString() };
    const next = [...coupons];
    next[idx] = updated;
    saveStoredCoupons(sellerId, next);
    return updated;
  },

  async getCouponStats(sellerId: string) {
    await delay(300);
    const coupons = getStoredCoupons(sellerId);
    return {
      total: coupons.length,
      active: coupons.filter((c) => c.status === "ACTIVE").length,
      expired: coupons.filter((c) => c.status === "EXPIRED").length,
      disabled: coupons.filter((c) => c.status === "DISABLED").length,
      totalUses: coupons.reduce((sum, c) => sum + c.usedCount, 0),
    };
  },
};

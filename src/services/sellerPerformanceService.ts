/**
 * sellerPerformanceService — Frontend-only simulated seller performance operations.
 * All operations are scoped to the authenticated sellerId for data isolation.
 */

import type { SellerPerformance } from "@/types";
import { MOCK_SELLER_PERFORMANCE } from "@/data/sellerFinancial";

const PERFORMANCE_SESSION_KEY = "my_ecommerce_seller_performance_v1";

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function getStoredPerformance(sellerId: string): SellerPerformance | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PERFORMANCE_SESSION_KEY);
    const all = raw ? (JSON.parse(raw) as Record<string, SellerPerformance>) : {};
    return all[sellerId] || MOCK_SELLER_PERFORMANCE[sellerId] || null;
  } catch {
    return MOCK_SELLER_PERFORMANCE[sellerId] || null;
  }
}

function saveStoredPerformance(sellerId: string, perf: SellerPerformance) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(PERFORMANCE_SESSION_KEY);
    const all = raw ? (JSON.parse(raw) as Record<string, SellerPerformance>) : {};
    all[sellerId] = perf;
    localStorage.setItem(PERFORMANCE_SESSION_KEY, JSON.stringify(all));
  } catch {
    // ignore
  }
}

export const sellerPerformanceService = {
  async getPerformance(sellerId: string): Promise<SellerPerformance> {
    await delay(400);
    return getStoredPerformance(sellerId) || {
      storeRating: 0,
      averageCustomerRating: 0,
      orderCancellationRate: 0,
      returnRate: 0,
      onTimeDispatchRate: 0,
      productApprovalRate: 0,
      customerSatisfaction: 0,
      totalOrders: 0,
      totalDeliveredOrders: 0,
      totalCancelledOrders: 0,
      totalReturnedOrders: 0,
    };
  },

  async updatePerformance(sellerId: string, updates: Partial<SellerPerformance>): Promise<SellerPerformance> {
    await delay(500);
    const current = getStoredPerformance(sellerId);
    if (!current) throw new Error("No performance data found");
    const updated: SellerPerformance = { ...current, ...updates };
    saveStoredPerformance(sellerId, updated);
    return updated;
  },
};

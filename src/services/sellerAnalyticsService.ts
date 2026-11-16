/**
 * sellerAnalyticsService — Frontend-only simulated seller analytics operations.
 * All operations are scoped to the authenticated sellerId for data isolation.
 */

import type {
  AnalyticsDataPoint,
  CategorySalesData,
  ProductPerformanceData,
} from "@/types";
import {
  getMockAnalyticsData,
  getMockCategorySales,
  getMockProductPerformance,
} from "@/data/sellerFinancial";

const ANALYTICS_SESSION_KEY = "my_ecommerce_seller_analytics_v1";

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function getStoredAnalytics(sellerId: string): AnalyticsDataPoint[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ANALYTICS_SESSION_KEY);
    const all = raw ? (JSON.parse(raw) as Record<string, AnalyticsDataPoint[]>) : {};
    return all[sellerId] || null;
  } catch {
    return null;
  }
}

function saveStoredAnalytics(sellerId: string, data: AnalyticsDataPoint[]) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(ANALYTICS_SESSION_KEY);
    const all = raw ? (JSON.parse(raw) as Record<string, AnalyticsDataPoint[]>) : {};
    all[sellerId] = data;
    localStorage.setItem(ANALYTICS_SESSION_KEY, JSON.stringify(all));
  } catch {
    // ignore
  }
}

export const sellerAnalyticsService = {
  async getAnalyticsData(sellerId: string): Promise<AnalyticsDataPoint[]> {
    await delay(400);
    const stored = getStoredAnalytics(sellerId);
    return stored || getMockAnalyticsData(sellerId);
  },

  async getCategorySales(sellerId: string): Promise<CategorySalesData[]> {
    await delay(400);
    return getMockCategorySales(sellerId);
  },

  async getProductPerformance(sellerId: string): Promise<ProductPerformanceData[]> {
    await delay(400);
    return getMockProductPerformance(sellerId);
  },

  async getAnalyticsSummary(sellerId: string) {
    await delay(300);
    const data = await this.getAnalyticsData(sellerId);
    const categorySales = await this.getCategorySales(sellerId);
    const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
    const totalOrders = data.reduce((sum, d) => sum + d.orders, 0);
    const totalCustomers = data.reduce((sum, d) => sum + d.customers, 0);
    const avgConversion =
      data.length > 0
        ? Math.round(
            (data.reduce((sum, d) => sum + d.conversionRate, 0) / data.length) * 10
          ) / 10
        : 0;
    return {
      totalRevenue,
      totalOrders,
      totalCustomers,
      avgConversion,
      topCategory: categorySales.length > 0 ? categorySales[0].category : "N/A",
    };
  },
};

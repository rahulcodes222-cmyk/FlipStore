import type { EarningsSummary } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { credentials: "include", headers: { "Content-Type": "application/json", ...(init?.headers || {}) }, ...init });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json?.success === false) throw new Error(json?.message || json?.error?.message || `Request failed (${res.status})`);
  return (json?.data ?? json) as T;
}

export const sellerEarningsService = {
  async getEarningsSummary(_sellerId: string): Promise<EarningsSummary & { dateWise?: any[]; reports?: any[] }> {
    const data = await api<any>("/api/v1/vendor/earnings");
    return {
      grossSales: Number(data.grossSales || data.grossRevenue || 0),
      grossRevenue: Number(data.grossRevenue || data.grossSales || 0),
      totalRevenue: Number(data.totalRevenue || data.grossRevenue || 0),
      platformCommission: Number(data.platformCommission || data.commissionDeductions || 0),
      commissionDeductions: Number(data.commissionDeductions || data.platformCommission || 0),
      shippingCharges: Number(data.shippingCharges || 0),
      refundDeductions: Number(data.refundDeductions || 0),
      netEarnings: Number(data.netEarnings || 0),
      pendingPayments: Number(data.pendingPayments || data.pendingEarnings || 0),
      pendingEarnings: Number(data.pendingEarnings || data.pendingPayments || 0),
      availableBalance: Number(data.availableBalance || 0),
      completedPayouts: Number(data.completedPayouts || data.totalPaid || 0),
      totalPaid: Number(data.totalPaid || data.completedPayouts || 0),
      dateWise: Array.isArray(data.dateWise) ? data.dateWise : Array.isArray(data.reports) ? data.reports : [],
      reports: Array.isArray(data.reports) ? data.reports : Array.isArray(data.dateWise) ? data.dateWise : [],
    };
  },
  async getEarningsData(_sellerId: string, period: "daily" | "monthly" = "daily") {
    const to = new Date();
    const from = new Date(Date.now() - (period === "monthly" ? 180 : 29) * 24 * 60 * 60 * 1000);
    const qs = new URLSearchParams({ groupBy: period === "monthly" ? "month" : "day", from: from.toISOString(), to: to.toISOString() }).toString();
    const data = await api<any>(`/api/v1/vendor/earnings?${qs}`);
    const rows = Array.isArray(data.dateWise) ? data.dateWise : Array.isArray(data.reports) ? data.reports : [];
    return rows.map((r: any) => ({ date: r.date, grossSales: Number(r.grossSales || 0), commission: Number(r.commission || 0), netEarnings: Number(r.netEarnings || 0), orders: Number(r.orders || 0) }));
  },
  async updateEarnings(_sellerId: string, _updates: Partial<EarningsSummary>): Promise<EarningsSummary> {
    return this.getEarningsSummary(_sellerId);
  },
};

import type { Payout } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { credentials: "include", headers: { "Content-Type": "application/json", ...(init?.headers || {}) }, ...init });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json?.success === false) throw new Error(json?.message || json?.error?.message || `Request failed (${res.status})`);
  return (json?.data ?? json) as T;
}

function mapPayout(p: any): Payout {
  return {
    id: p.id || String(p._id || ""),
    payoutNumber: p.payoutNumber,
    amount: Number(p.amount || 0),
    amountPaise: p.amountPaise,
    date: p.date || p.requestedAt || p.createdAt || new Date().toISOString(),
    requestedAt: p.requestedAt,
    reviewedAt: p.reviewedAt,
    completedAt: p.completedAt,
    status: p.status || "PENDING",
    bankAccount: p.bankAccount || "N/A",
    bankName: p.bankName || "N/A",
    accountHolderName: p.accountHolderName,
    referenceId: p.referenceId,
    transactionReference: p.transactionReference,
    provider: p.provider,
    reconciliationStatus: p.reconciliationStatus,
    requestNote: p.requestNote,
    adminNote: p.adminNote,
    rejectionReason: p.rejectionReason,
    failureReason: p.failureReason,
  } as Payout;
}

export const sellerTransactionService = {
  async getPayouts(_sellerId: string): Promise<Payout[]> {
    const data = await api<any>("/api/v1/vendor/payouts?limit=100");
    const rows = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
    return rows.map(mapPayout);
  },
  async getPayout(_sellerId: string, payoutId: string): Promise<Payout | null> {
    const rows = await this.getPayouts(_sellerId);
    return rows.find((p) => p.id === payoutId) || null;
  },
  async requestPayout(_sellerId: string, amount: number): Promise<Payout> {
    const data = await api<any>("/api/v1/vendor/payouts/request", { method: "POST", body: JSON.stringify({ amount }) });
    return mapPayout(data);
  },
  async updatePayoutStatus(_sellerId: string, _payoutId: string, _status: any): Promise<Payout | null> {
    return null;
  },
  async getPayoutStats(_sellerId: string) {
    const payouts = await this.getPayouts(_sellerId);
    const totalAmount = payouts.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const completed = payouts.filter((p) => p.status === "COMPLETED" || p.status === "PAID");
    const pending = payouts.filter((p) => ["PENDING","UNDER_REVIEW","APPROVED","PROCESSING"].includes(p.status));
    return {
      total: payouts.length,
      pending: pending.length,
      paid: completed.length,
      processing: payouts.filter((p) => p.status === "PROCESSING").length,
      failed: payouts.filter((p) => p.status === "FAILED" || p.status === "REJECTED").length,
      totalAmount,
      completedAmount: completed.reduce((s, p) => s + Number(p.amount || 0), 0),
      pendingAmount: pending.reduce((s, p) => s + Number(p.amount || 0), 0),
    };
  },
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { credentials: "include", headers: { "Content-Type": "application/json", ...(init?.headers || {}) }, ...init });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json?.success === false) throw new Error(json?.message || json?.error?.message || `Request failed (${res.status})`);
  return (json?.data ?? json) as T;
}

function mapTx(t: any) {
  const amt = Number(t.amount || 0);
  const isCredit = t.direction === "CREDIT" || String(t.type || "").includes("CREDIT");
  const isDebit = t.direction === "DEBIT" || String(t.type || "").includes("DEBIT");
  const commission = String(t.type || "").includes("COMMISSION") ? amt : 0;
  const netAmount = isDebit ? -amt : amt;
  const status = t.status === "AVAILABLE" || t.status === "COMPLETED" ? "PAID" : t.status === "PENDING" ? "PENDING" : t.status === "REVERSED" ? "FAILED" : "PROCESSING";
  return {
    id: t.id || String(Math.random()),
    transactionId: t.referenceId || t.id || "-",
    orderId: t.orderId || "-",
    orderNumber: t.subOrderId || t.orderId || "-",
    customerName: t.description || "Platform",
    paymentDate: t.createdAt || new Date().toISOString(),
    grossAmount: isCredit && !String(t.type || "").includes("COMMISSION") ? amt : amt,
    commission,
    netAmount,
    paymentMethod: t.type || "LEDGER",
    status,
  };
}

export const sellerPaymentService = {
  async getPayments(_sellerId: string) {
    const data = await api<any>("/api/v1/vendor/transactions?limit=100");
    const rows = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
    return rows.map(mapTx);
  },
  async getPayment(_sellerId: string, transactionId: string) {
    const rows = await this.getPayments(_sellerId);
    return rows.find((p: any) => p.id === transactionId || p.transactionId === transactionId) || null;
  },
  async updatePaymentStatus(_sellerId: string, _transactionId: string, _status: string) {
    return null;
  },
  async getPaymentStats(_sellerId: string) {
    const payments = await this.getPayments(_sellerId);
    return {
      total: payments.length,
      paid: payments.filter((p: any) => p.status === "PAID").length,
      pending: payments.filter((p: any) => p.status === "PENDING").length,
      processing: payments.filter((p: any) => p.status === "PROCESSING").length,
      failed: payments.filter((p: any) => p.status === "FAILED" || p.status === "REFUNDED").length,
      totalAmount: payments.reduce((sum: number, p: any) => sum + Number(p.netAmount || 0), 0),
      totalCommission: payments.reduce((sum: number, p: any) => sum + Number(p.commission || 0), 0),
    };
  },
};

"use client";

import { useEffect, useState } from "react";
import { useHydration } from "@/hooks/useHydration";
import { useSellerStore } from "@/store/useSellerStore";
import { sellerPaymentService } from "@/services";
import { useToast } from "@/components/common/Toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PaymentHistoryTable } from "@/components/seller/PaymentHistoryTable";
import { ReportExportButton } from "@/components/seller/ReportExportButton";
import type { PaymentTransaction, PaymentTransactionStatus } from "@/types";
import { cn } from "@/lib/utils";

const PAYMENT_FILTERS = [
  { label: "All", value: "" },
  { label: "Pending", value: "PENDING" },
  { label: "Processing", value: "PROCESSING" },
  { label: "Paid", value: "PAID" },
  { label: "Failed", value: "FAILED" },
];

export default function SellerPaymentsPage() {
  const isHydrated = useHydration();
  const { seller } = useSellerStore();
  const { success, error } = useToast();
  const sellerId = (isHydrated ? seller?.id : null) || "slr-001";

  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PaymentTransactionStatus | "">("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const [txns, s] = await Promise.all([sellerPaymentService.getPayments(sellerId), sellerPaymentService.getPaymentStats(sellerId)]);
        if (!mounted) return;
        setTransactions(txns as any);
        setStats(s);
      } catch {
        error("Failed to load transactions");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [sellerId, error]);

  const filteredTransactions = transactions.filter((t) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || String(t.transactionId || "").toLowerCase().includes(q) || String(t.orderNumber || "").toLowerCase().includes(q) || String(t.customerName || "").toLowerCase().includes(q);
    const matchesStatus = !statusFilter || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-[#212121]">Transactions</h1>
          <p className="text-xs text-[#878787]">Immutable vendor financial ledger entries and transaction history</p>
        </div>
        <ReportExportButton type="PAYMENTS" onDownload={() => success("Transactions report downloaded")} />
      </div>

      {stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-sm border border-[#E0E0E0] bg-white p-4 shadow-sm"><div className="text-xs text-[#878787] uppercase tracking-wider font-bold">Total Entries</div><div className="text-lg font-bold text-[#212121]">{stats.total}</div></div>
          <div className="rounded-sm border border-[#E0E0E0] bg-white p-4 shadow-sm"><div className="text-xs text-[#878787] uppercase tracking-wider font-bold">Settled</div><div className="text-lg font-bold text-[#212121]">{stats.paid}</div></div>
          <div className="rounded-sm border border-[#E0E0E0] bg-white p-4 shadow-sm"><div className="text-xs text-[#878787] uppercase tracking-wider font-bold">Pending</div><div className="text-lg font-bold text-[#212121]">{stats.pending}</div></div>
          <div className="rounded-sm border border-[#E0E0E0] bg-white p-4 shadow-sm"><div className="text-xs text-[#878787] uppercase tracking-wider font-bold">Net Amount</div><div className="text-lg font-bold text-[#212121]">₹{Number(stats.totalAmount || 0).toLocaleString("en-IN")}</div></div>
        </div>
      ) : null}

      <div className="rounded-sm border border-[#E0E0E0] bg-white p-4 shadow-sm flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[280px]"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#878787] text-[12px]">🔍</span><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by transaction ID, order, or description…" className="pl-8" /></div>
        <div className="flex gap-2 flex-wrap">
          {PAYMENT_FILTERS.map((f) => (
            <button key={f.value} onClick={() => setStatusFilter(f.value as PaymentTransactionStatus | "")} className={cn("px-3 py-1.5 rounded-sm text-xs font-medium border transition-colors", statusFilter === f.value ? "bg-[#2874F0] border-[#2874F0] text-white" : "bg-white border-[#E0E0E0] text-[#212121] hover:bg-[#F1F3F6]")}>{f.label}</button>
          ))}
        </div>
      </div>

      {loading ? <div className="rounded-sm border border-[#E0E0E0] bg-white p-8 text-sm text-[#878787]">Loading transactions…</div> : <PaymentHistoryTable transactions={filteredTransactions} />}
    </div>
  );
}

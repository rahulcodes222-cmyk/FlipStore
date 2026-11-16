"use client";

import { useEffect, useState } from "react";
import { useHydration } from "@/hooks/useHydration";
import { useSellerStore } from "@/store/useSellerStore";
import { sellerEarningsService, sellerTransactionService } from "@/services";
import { useToast } from "@/components/common/Toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PayoutHistoryTable } from "@/components/seller/PayoutHistoryTable";
import { ReportExportButton } from "@/components/seller/ReportExportButton";
import type { Payout, PayoutStatus } from "@/types";
import { cn } from "@/lib/utils";

const PAYOUT_FILTERS = [
  { label: "All", value: "" },
  { label: "Pending", value: "PENDING" },
  { label: "Under Review", value: "UNDER_REVIEW" },
  { label: "Approved", value: "APPROVED" },
  { label: "Processing", value: "PROCESSING" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Failed", value: "FAILED" },
];

export default function SellerTransactionsPage() {
  const isHydrated = useHydration();
  const { seller } = useSellerStore();
  const { success, error } = useToast();
  const sellerId = (isHydrated ? seller?.id : null) || "slr-001";

  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PayoutStatus | "">("");
  const [requestAmount, setRequestAmount] = useState("");
  const [requestNote, setRequestNote] = useState("");
  const [requesting, setRequesting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [p, s, sum] = await Promise.all([
        sellerTransactionService.getPayouts(sellerId),
        sellerTransactionService.getPayoutStats(sellerId),
        sellerEarningsService.getEarningsSummary(sellerId).catch(() => null),
      ]);
      setPayouts(p);
      setStats(s);
      setSummary(sum);
    } catch {
      error("Failed to load payouts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [sellerId]);

  const filteredPayouts = payouts.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || p.id.toLowerCase().includes(q) || (p.payoutNumber || "").toLowerCase().includes(q) || (p.referenceId || "").toLowerCase().includes(q) || (p.transactionReference || "").toLowerCase().includes(q);
    const matchesStatus = !statusFilter || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleRequestPayout = async () => {
    const amount = Number(requestAmount);
    if (!Number.isFinite(amount) || amount <= 0) { error("Enter a valid payout amount"); return; }
    if (summary && amount > Number(summary.availableBalance || 0)) { error("Requested amount exceeds available balance"); return; }
    setRequesting(true);
    try {
      await sellerTransactionService.requestPayout(sellerId, amount);
      setRequestAmount(""); setRequestNote("");
      success("Payout request submitted for review");
      await load();
    } catch (e: any) {
      error(e?.message || "Failed to request payout");
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-[#212121]">Payouts & Transactions</h1>
          <p className="text-xs text-[#878787]">Request payouts, track status, and view payout transaction history</p>
        </div>
        <ReportExportButton type="PAYMENTS" onDownload={() => success("Payouts report downloaded")} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-sm border border-[#E0E0E0] bg-white p-4 shadow-sm"><div className="text-xs text-[#878787] uppercase tracking-wider font-bold">Available Balance</div><div className="text-lg font-bold text-[#212121]">₹{Number(summary?.availableBalance || 0).toLocaleString("en-IN")}</div></div>
        <div className="rounded-sm border border-[#E0E0E0] bg-white p-4 shadow-sm"><div className="text-xs text-[#878787] uppercase tracking-wider font-bold">Pending/Active Payouts</div><div className="text-lg font-bold text-[#212121]">₹{Number(stats?.pendingAmount || 0).toLocaleString("en-IN")}</div></div>
        <div className="rounded-sm border border-[#E0E0E0] bg-white p-4 shadow-sm"><div className="text-xs text-[#878787] uppercase tracking-wider font-bold">Completed Payouts</div><div className="text-lg font-bold text-[#212121]">₹{Number(summary?.completedPayouts ?? stats?.completedAmount ?? 0).toLocaleString("en-IN")}</div></div>
        <div className="rounded-sm border border-[#E0E0E0] bg-white p-4 shadow-sm"><div className="text-xs text-[#878787] uppercase tracking-wider font-bold">Payout Requests</div><div className="text-lg font-bold text-[#212121]">{stats?.total || payouts.length}</div></div>
      </div>

      <div className="rounded-sm border border-[#E0E0E0] bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-[#212121]">Request Payout</h3>
          <span className="text-[10px] text-[#878787] uppercase tracking-wider font-bold">Admin review & reconciliation required</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Amount (₹)</label>
            <Input value={requestAmount} onChange={(e) => setRequestAmount(e.target.value)} type="number" min="1" step="0.01" placeholder="Enter amount" />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Note (optional)</label>
            <Input value={requestNote} onChange={(e) => setRequestNote(e.target.value)} placeholder="Reference note for this payout request" />
          </div>
          <div className="flex items-end"><Button variant="primary" onClick={handleRequestPayout} isLoading={requesting} className="w-full">Request Payout</Button></div>
        </div>
        <p className="text-[10px] text-[#878787] mt-2">Payouts are paid only to verified bank details, reviewed by admin, and marked completed only after confirmed settlement/reconciliation. Duplicate requests are blocked server-side.</p>
      </div>

      <div className="rounded-sm border border-[#E0E0E0] bg-white p-4 shadow-sm flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[280px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#878787] text-[12px]">🔍</span>
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by payout ID, number, or reference…" className="pl-8" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {PAYOUT_FILTERS.map((f) => (
            <button key={f.value} onClick={() => setStatusFilter(f.value as PayoutStatus | "")} className={cn("px-3 py-1.5 rounded-sm text-xs font-medium border transition-colors", statusFilter === f.value ? "bg-[#2874F0] border-[#2874F0] text-white" : "bg-white border-[#E0E0E0] text-[#212121] hover:bg-[#F1F3F6]")}>{f.label}</button>
          ))}
        </div>
      </div>

      {loading ? <div className="rounded-sm border border-[#E0E0E0] bg-white p-8 text-sm text-[#878787]">Loading payouts…</div> : <PayoutHistoryTable payouts={filteredPayouts} />}
    </div>
  );
}

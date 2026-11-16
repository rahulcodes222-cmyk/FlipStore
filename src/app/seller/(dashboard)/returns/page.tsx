"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Filter, RefreshCcw, Clock, AlertTriangle, Mail, Truck } from "lucide-react";
import { useHydration } from "@/hooks/useHydration";
import { useSellerStore } from "@/store/useSellerStore";
import { sellerReturnService } from "@/services";
import { useToast } from "@/components/common/Toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SellerStatsCard } from "@/components/seller/SellerStatsCard";
import { SellerStatusBadge } from "@/components/seller/SellerStatusBadge";
import { cn } from "@/lib/utils";
import type { SellerReturn, ReturnStatus } from "@/types";

const RETURN_STATUS_CONFIG: Record<ReturnStatus, { bg: string; text: string; border: string; label: string }> = {
  PENDING: { bg: "bg-[#FFF8E1]", text: "text-[#B26A00]", border: "border-[#FFE082]", label: "Pending" },
  APPROVED: { bg: "bg-[#E8F5E9]", text: "text-[#2E7D32]", border: "border-[#C8E6C9]", label: "Approved" },
  REJECTED: { bg: "bg-[#FFEBEE]", text: "text-[#C62828]", border: "border-[#FFCDD2]", label: "Rejected" },
  PROCESSING: { bg: "bg-[#FFF3E0]", text: "text-[#E65100]", border: "border-[#FFE0B2]", label: "Processing" },
  COMPLETED: { bg: "bg-[#E8F5E9]", text: "text-[#2E7D32]", border: "border-[#C8E6C9]", label: "Completed" },
  REFUNDED: { bg: "bg-[#E8F5E9]", text: "text-[#2E7D32]", border: "border-[#C8E6C9]", label: "Refunded" },
  REPLACED: { bg: "bg-[#E3F2FD]", text: "text-[#1565C0]", border: "border-[#BBDEFB]", label: "Replaced" },
};

export default function SellerReturnsPage() {
  const isHydrated = useHydration();
  const { seller } = useSellerStore();
  const { toast, success, error } = useToast();
  const currentSeller = isHydrated ? seller : null;
  const sellerId = currentSeller?.id || "slr-001";

  const [returns, setReturns] = useState<SellerReturn[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReturnStatus | "">("");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const [items, s] = await Promise.all([
          sellerReturnService.getReturns(sellerId),
          sellerReturnService.getReturnStats(sellerId),
        ]);
        if (mounted) {
          setReturns(items);
          setStats(s);
        }
      } catch {
        error("Failed to load returns");
      } finally {
        if (mounted) setLoading(false);
    }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [sellerId, toast]);

  const filteredReturns = returns.filter((r) => {
    const q = search.toLowerCase();
    const matchesSearch =
      r.returnNumber.toLowerCase().includes(q) ||
      r.orderNumber.toLowerCase().includes(q) ||
      r.customerName.toLowerCase().includes(q) ||
      r.productName.toLowerCase().includes(q) ||
      r.reason.toLowerCase().includes(q);
    const matchesStatus = !statusFilter || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleApprove = async (returnId: string) => {
    try {
      await sellerReturnService.updateReturnStatus(sellerId, returnId, "APPROVED");
      success("Return approved");
      const items = await sellerReturnService.getReturns(sellerId);
      const s = await sellerReturnService.getReturnStats(sellerId);
      setReturns(items);
      setStats(s);
    } catch {
      error("Failed to approve return");
    }
  };

  const handleReject = async (returnId: string) => {
    try {
      await sellerReturnService.updateReturnStatus(sellerId, returnId, "REJECTED");
      success("Return rejected");
      const items = await sellerReturnService.getReturns(sellerId);
      const s = await sellerReturnService.getReturnStats(sellerId);
      setReturns(items);
      setStats(s);
    } catch {
      error("Failed to reject return");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-[#212121]">Returns & Refunds</h1>
          <p className="text-xs text-[#878787]">Manage return requests and refunds</p>
        </div>
        <Link
          href="/seller/dashboard"
          className="text-[11px] font-semibold text-[#2874F0] hover:underline flex items-center gap-1"
        >
          <span>← Back to Dashboard</span>
        </Link>
      </div>

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <SellerStatsCard title="Total Returns" value={stats.total} variant="products" subtitle="All requests" />
          <SellerStatsCard title="Pending" value={stats.pending} variant="pending" subtitle="Awaiting action" />
          <SellerStatsCard title="Approved" value={stats.approved} variant="products" subtitle="Approved" />
          <SellerStatsCard title="Rejected" value={stats.rejected} variant="cancelled" subtitle="Rejected" />
          <SellerStatsCard title="Refund Amount" value={`₹${stats.totalRefund.toLocaleString("en-IN")}`} variant="balance" subtitle="Total refunded" />
        </div>
      )}

      <div className="rounded-sm border border-[#E0E0E0] bg-white p-4 shadow-sm flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[280px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#878787]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by return ID, order, customer or product…"
            className="pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ReturnStatus | "")}
          className="flex h-9 w-32 rounded-sm border border-[#E0E0E0] bg-white px-2 py-1 text-xs focus-visible:ring-1 focus-visible:ring-[#2874F0]"
        >
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="PROCESSING">Processing</option>
          <option value="COMPLETED">Completed</option>
        </select>
        <Button variant="outline" size="sm">
          <RefreshCcw size={16} /> Refresh
        </Button>
      </div>

      <div className={cn("rounded-sm border border-[#E0E0E0] bg-white shadow-sm", loading ? "pointer-events-none opacity-50" : "")}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="border-b border-[#F0F0F0] bg-[#F9FAFB]">
              <tr>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-[#878787] uppercase">Return ID</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-[#878787] uppercase">Order</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-[#878787] uppercase">Customer</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-[#878787] uppercase">Product</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-[#878787] uppercase">Reason</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-[#878787] uppercase">Date</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-[#878787] uppercase">Refund</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-[#878787] uppercase">Status</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-[#878787] uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F0F0]">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center">
                    <div className="h-24 rounded-sm bg-[#E8E8E8] animate-skeleton w-3/4 mx-auto" />
                  </td>
                </tr>
              ) : filteredReturns.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center">
                    <p className="text-sm text-[#878787]">No return requests found.</p>
                  </td>
                </tr>
              ) : (
                filteredReturns.map((ret) => (
                  <tr key={ret.id} className="hover:bg-[#F1F3F6] transition-colors">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-[#212121]">{ret.returnNumber}</div>
                      <div className="text-[10px] text-[#878787]">{ret.id}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#212121]">{ret.orderNumber}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#F1F3F6] flex items-center justify-center text-[10px] font-bold text-[#878787]">
                          {ret.customerName.charAt(0)}
                        </div>
                        <div className="text-sm text-[#212121]">{ret.customerName}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {ret.productImage ? (
                          <img
                            src={ret.productImage}
                            alt=""
                            className="w-6 h-6 rounded-sm object-cover border border-[#E0E0E0]"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-sm bg-[#F1F3F6] flex items-center justify-center text-[10px] font-bold text-[#878787]">
                            {ret.productName.charAt(0)}
                          </div>
                        )}
                        <div className="text-sm text-[#212121] truncate max-w-[100px]">{ret.productName}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#212121]">{ret.reason}</td>
                    <td className="px-4 py-3 text-sm text-[#212121]">
                      {new Date(ret.requestDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-[#212121]">
                      ₹{ret.refundAmount.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold border",
                          RETURN_STATUS_CONFIG[ret.status].bg,
                          RETURN_STATUS_CONFIG[ret.status].text,
                          RETURN_STATUS_CONFIG[ret.status].border
                        )}
                      >
                        {RETURN_STATUS_CONFIG[ret.status].label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {ret.status === "PENDING" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleApprove(ret.id)}
                              className="text-[#2E7D32] border-[#C8E6C9] hover:bg-[#E8F5E9]"
                            >
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReject(ret.id)}
                              className="text-[#C62828] border-[#FFCDD2] hover:bg-[#FFEBEE]"
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        {ret.status === "APPROVED" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => sellerReturnService.updateReturnStatus(sellerId, ret.id, "COMPLETED").then(() => {
                              success("Return completed");
                              const items = returns.map((r) => (r.id === ret.id ? { ...r, status: "COMPLETED" as const } : r));
                              setReturns(items);
                            })}
                          >
                            Complete
                          </Button>
                        )}
                        {ret.status === "REJECTED" && (
                          <span className="text-[10px] text-[#616161] font-medium">Rejected</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, Download } from "lucide-react";
import { useHydration } from "@/hooks/useHydration";
import { useSellerStore } from "@/store/useSellerStore";
import { sellerDashboardService, sellerOrderService } from "@/services";
import { useToast } from "@/components/common/Toast";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { SellerOrder, SellerOrderStatus, OrderPaymentStatus } from "@/types";

const ORDER_STATUS_CONFIG: Record<SellerOrderStatus, string> = {
  PENDING: "bg-[#FFF8E1] text-[#B26A00] border-[#FFE082]",
  PLACED: "bg-[#FFF8E1] text-[#B26A00] border-[#FFE082]",
  CONFIRMED: "bg-[#E3F2FD] text-[#1565C0] border-[#BBDEFB]",
  PROCESSING: "bg-[#FFF3E0] text-[#E65100] border-[#FFE0B2]",
  PACKED: "bg-[#EDE7F6] text-[#5E35B1] border-[#D1C4E9]",
  SHIPPED: "bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]",
  OUT_FOR_DELIVERY: "bg-[#E3F2FD] text-[#1565C0] border-[#BBDEFB]",
  DELIVERED: "bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]",
  CANCELLED: "bg-[#FFEBEE] text-[#C62828] border-[#FFCDD2]",
  RETURN_REQUESTED: "bg-[#FFF3E0] text-[#E65100] border-[#FFE0B2]",
  RETURNED: "bg-[#F5F5F5] text-[#616161] border-[#E0E0E0]",
  REFUNDED: "bg-[#F5F5F5] text-[#616161] border-[#E0E0E0]",
};

const PAYMENT_STATUS_CONFIG: Record<OrderPaymentStatus, string> = {
  PENDING: "bg-[#FFF8E1] text-[#B26A00]",
  PROCESSING: "bg-[#E3F2FD] text-[#1565C0]",
  PAID: "bg-[#E8F5E9] text-[#2E7D32]",
  FAILED: "bg-[#FFEBEE] text-[#C62828]",
  REFUNDED: "bg-[#F5F5F5] text-[#616161]",
  PARTIALLY_REFUNDED: "bg-[#FFF3E0] text-[#E65100]",
};

const ORDER_FILTERS = [
  { label: "All Orders", value: "" },
  { label: "New Orders", value: "PLACED" },
  { label: "Processing", value: "PROCESSING" },
  { label: "Shipped", value: "SHIPPED" },
  { label: "Delivered", value: "DELIVERED" },
  { label: "Cancelled", value: "CANCELLED" },
  { label: "Returned", value: "RETURNED" },
];

const NEXT_ACTIONS: Partial<Record<SellerOrderStatus, SellerOrderStatus[]>> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  PLACED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "PACKED", "CANCELLED"],
  PROCESSING: ["PACKED", "SHIPPED", "CANCELLED"],
  PACKED: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["OUT_FOR_DELIVERY", "CANCELLED"],
  OUT_FOR_DELIVERY: ["DELIVERED", "CANCELLED"],
};

function labelStatus(s: string) {
  return s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, " ");
}

export default function SellerOrdersPage() {
  const isHydrated = useHydration();
  const { seller } = useSellerStore();
  const { success, error } = useToast();
  const currentSeller = isHydrated ? seller : null;
  const sellerId = currentSeller?.id || "slr-001";

  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [draftStatus, setDraftStatus] = useState<Record<string, SellerOrderStatus | "">>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const items = await sellerDashboardService.getOrders(sellerId);
      setOrders(items);
    } catch (e: any) {
      error(e?.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isHydrated) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const items = await sellerDashboardService.getOrders(sellerId);
        if (mounted) setOrders(items);
      } catch (e: any) {
        if (mounted) error(e?.message || "Failed to load orders");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [sellerId, isHydrated, error]);

  const filteredOrders = useMemo(() => orders.filter((o) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || o.orderNumber.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q) || o.productName.toLowerCase().includes(q);
    const matchesStatus = !statusFilter || o.orderStatus === statusFilter;
    return matchesSearch && matchesStatus;
  }), [orders, search, statusFilter]);

  const handleUpdateStatus = async (orderId: string, currentStatus: SellerOrderStatus) => {
    const next = draftStatus[orderId] as SellerOrderStatus | undefined;
    if (!next) {
      error("Select a status to update");
      return;
    }
    if (next === currentStatus) {
      error("Order already has this status");
      return;
    }
    setUpdatingId(orderId);
    try {
      const updated = await sellerOrderService.updateOrderStatus(orderId, sellerId, next);
      if (updated) {
        setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, orderStatus: updated.orderStatus as SellerOrderStatus } : o));
        setDraftStatus((prev) => ({ ...prev, [orderId]: "" }));
        success(`Order status updated to ${labelStatus(String(updated.orderStatus))}`);
      } else {
        await load();
        success("Order status updated");
      }
    } catch (e: any) {
      error(e?.message || "Failed to update order status");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-[#212121]">Orders</h1>
          <p className="text-xs text-[#878787]">Manage and update your order statuses</p>
        </div>
        <Link href="/seller/dashboard" className="text-[11px] font-semibold text-[#2874F0] hover:underline flex items-center gap-1">
          <span>← Back to Dashboard</span>
        </Link>
      </div>

      <div className="rounded-sm border border-[#E0E0E0] bg-white p-4 shadow-sm flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[280px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#878787]" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by order ID, customer or product..." className="pl-10" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {ORDER_FILTERS.map((f) => (
            <button key={f.value} onClick={() => setStatusFilter(f.value)} className={cn("px-3 py-1.5 rounded-sm text-xs font-medium border transition-colors", statusFilter === f.value ? "bg-[#2874F0] border-[#2874F0] text-white" : "bg-white border-[#E0E0E0] text-[#212121] hover:bg-[#F1F3F6]")}>{f.label}</button>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 rounded-sm border border-[#E0E0E0] bg-white p-4 shadow-sm">
          <div className="text-xs text-[#878787] uppercase tracking-wider font-bold">Total Orders</div>
          <div className="text-lg font-bold text-[#212121]">{filteredOrders.length}</div>
        </div>
        <div className="flex-1 rounded-sm border border-[#E0E0E0] bg-white p-4 shadow-sm">
          <div className="text-xs text-[#878787] uppercase tracking-wider font-bold">Total Value</div>
          <div className="text-lg font-bold text-[#212121]">₹{filteredOrders.reduce((sum, o) => sum + o.totalAmount, 0).toLocaleString("en-IN")}</div>
        </div>
      </div>

      <div className={cn("rounded-sm border border-[#E0E0E0] bg-white shadow-sm", loading ? "pointer-events-none opacity-50" : "")}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="border-b border-[#F0F0F0] bg-[#F9FAFB]">
              <tr>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-[#878787] uppercase">Order ID</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-[#878787] uppercase">Product</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-[#878787] uppercase">Date</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-[#878787] uppercase">Qty</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-[#878787] uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-[#878787] uppercase">Payment</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-[#878787] uppercase">Status</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-[#878787] uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F0F0]">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center"><div className="h-24 rounded-sm bg-[#E8E8E8] animate-skeleton w-3/4 mx-auto" /></td></tr>
              ) : filteredOrders.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center"><p className="text-sm text-[#878787]">No orders found.</p></td></tr>
              ) : (
                filteredOrders.map((order) => {
                  const next = NEXT_ACTIONS[order.orderStatus] || [];
                  const busy = updatingId === order.id;
                  return (
                    <tr key={order.id} className="hover:bg-[#F1F3F6] transition-colors">
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-[#212121]">{order.orderNumber}</div>
                        <div className="text-[10px] text-[#878787]">{order.id}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          {order.productImage ? <img src={order.productImage} alt="" className="w-7 h-7 rounded-sm object-cover border border-[#E0E0E0]" /> : <div className="w-7 h-7 rounded-sm bg-[#F1F3F6] flex items-center justify-center text-[10px] font-bold text-[#878787]">{order.productName.charAt(0)}</div>}
                          <div className="text-sm font-medium text-[#212121] truncate max-w-[140px]">{order.productName}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#212121]">{new Date(order.orderDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
                      <td className="px-4 py-3 text-sm font-medium text-[#212121]">{order.quantity}</td>
                      <td className="px-4 py-3 text-sm font-medium text-[#212121]">₹{order.totalAmount.toLocaleString("en-IN")}</td>
                      <td className="px-4 py-3"><span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold border", PAYMENT_STATUS_CONFIG[order.paymentStatus])}>{labelStatus(order.paymentStatus)}</span></td>
                      <td className="px-4 py-3"><span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold border", ORDER_STATUS_CONFIG[order.orderStatus])}>{labelStatus(order.orderStatus)}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-2">
                          {next.length > 0 ? (
                            <div className="flex items-center gap-2">
                              <select
                                value={draftStatus[order.id] || ""}
                                onChange={(e) => setDraftStatus((prev) => ({ ...prev, [order.id]: e.target.value as SellerOrderStatus }))}
                                disabled={busy}
                                className="h-8 rounded-sm border border-[#D5D5D5] bg-white px-2 text-xs text-[#212121] focus:outline-none focus:border-[#2874F0] disabled:opacity-60"
                              >
                                <option value="">Select status</option>
                                {next.map((s) => <option key={s} value={s}>{labelStatus(s)}</option>)}
                              </select>
                              <button
                                type="button"
                                onClick={() => handleUpdateStatus(order.id, order.orderStatus)}
                                disabled={busy || !draftStatus[order.id]}
                                className="h-8 px-3 rounded-sm bg-[#2874F0] text-white text-xs font-semibold hover:bg-[#1f63d1] disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {busy ? "Updating..." : "Update"}
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-[#878787]">No actions</span>
                          )}
                          <Link href={`/seller/orders/${order.id}`} className="text-[#2874F0] text-xs font-medium hover:underline">View Details</Link>
                          {order.orderStatus === "CONFIRMED" || order.orderStatus === "SHIPPED" || order.orderStatus === "OUT_FOR_DELIVERY" || order.orderStatus === "DELIVERED" ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                sellerOrderService.downloadInvoice(order.id).then((blob) => {
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement("a");
                                  a.href = url;
                                  a.download = `invoice-${order.orderNumber || order.id}.pdf`;
                                  document.body.appendChild(a);
                                  a.click();
                                  document.body.removeChild(a);
                                  URL.revokeObjectURL(url);
                                }).catch(() => error("Failed to download invoice"));
                              }}
                              className="text-[10px] text-[#2874F0] font-medium hover:underline block mt-1"
                            >
                              Download Invoice
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  ShoppingCart,
  Package,
  RefreshCcw,
  Clock,
} from "lucide-react";
import { useHydration } from "@/hooks/useHydration";
import { useSellerStore } from "@/store/useSellerStore";
import { sellerDashboardService } from "@/services";
import { useToast } from "@/components/common/Toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SellerStatusBadge } from "@/components/seller/SellerStatusBadge";
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

export default function SellerOrdersPage() {
  const isHydrated = useHydration();
  const { seller } = useSellerStore();
  const { toast, success, error } = useToast();
  const currentSeller = isHydrated ? seller : null;
  const sellerId = currentSeller?.id || "slr-001";

  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const items = await sellerDashboardService.getOrders(sellerId);
        if (mounted) setOrders(items);
      } catch {
        error("Failed to load orders");
      } finally {
        if (mounted) setLoading(false);
    }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [sellerId, toast]);

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.productName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || o.orderStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-[#212121]">Orders</h1>
          <p className="text-xs text-[#878787]">Manage and track your orders</p>
        </div>
        <Link href="/seller/dashboard" className="text-[11px] font-semibold text-[#2874F0] hover:underline flex items-center gap-1">
          <span>← Back to Dashboard</span>
        </Link>
      </div>

      {/* Search & Filter */}
      <div className="rounded-sm border border-[#E0E0E0] bg-white p-4 shadow-sm flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[280px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#878787]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order ID, customer or product…"
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {ORDER_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={cn(
                "px-3 py-1.5 rounded-sm text-xs font-medium border transition-colors",
                statusFilter === f.value
                  ? "bg-[#2874F0] border-[#2874F0] text-white"
                  : "bg-white border-[#E0E0E0] text-[#212121] hover:bg-[#F1F3F6]"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="flex gap-4">
        <div className="flex-1 rounded-sm border border-[#E0E0E0] bg-white p-4 shadow-sm">
          <div className="text-xs text-[#878787] uppercase tracking-wider font-bold">Total Orders</div>
          <div className="text-lg font-bold text-[#212121]">{filteredOrders.length}</div>
        </div>
        <div className="flex-1 rounded-sm border border-[#E0E0E0] bg-white p-4 shadow-sm">
          <div className="text-xs text-[#878787] uppercase tracking-wider font-bold">Total Value</div>
          <div className="text-lg font-bold text-[#212121]">
            ₹{filteredOrders.reduce((sum, o) => sum + o.totalAmount, 0).toLocaleString("en-IN")}
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className={cn("rounded-sm border border-[#E0E0E0] bg-white shadow-sm", loading ? "pointer-events-none opacity-50" : "")}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="border-b border-[#F0F0F0] bg-[#F9FAFB]">
              <tr>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-[#878787] uppercase">Order ID</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-[#878787] uppercase">Customer</th>
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
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center">
                    <div className="h-24 rounded-sm bg-[#E8E8E8] animate-skeleton w-3/4 mx-auto" />
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center">
                    <p className="text-sm text-[#878787]">No orders found.</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-[#F1F3F6] transition-colors">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-[#212121]">{order.orderNumber}</div>
                      <div className="text-[10px] text-[#878787]">{order.id}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        {order.customerAvatar ? (
                          <img
                            src={order.customerAvatar}
                            alt=""
                            className="w-7 h-7 rounded-full object-cover border border-[#E0E0E0]"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-[#F1F3F6] flex items-center justify-center text-[10px] font-bold text-[#878787]">
                            {order.customerName.charAt(0)}
                          </div>
                        )}
                        <div className="text-sm font-medium text-[#212121]">{order.customerName}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        {order.productImage ? (
                          <img
                            src={order.productImage}
                            alt=""
                            className="w-7 h-7 rounded-sm object-cover border border-[#E0E0E0]"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-sm bg-[#F1F3F6] flex items-center justify-center text-[10px] font-bold text-[#878787]">
                            {order.productName.charAt(0)}
                          </div>
                        )}
                        <div className="text-sm font-medium text-[#212121] truncate max-w-[140px]">{order.productName}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#212121]">
                      {new Date(order.orderDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-[#212121]">{order.quantity}</td>
                    <td className="px-4 py-3 text-sm font-medium text-[#212121]">
                      ₹{order.totalAmount.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold border",
                          PAYMENT_STATUS_CONFIG[order.paymentStatus]
                        )}
                      >
                        {order.paymentStatus.charAt(0) + order.paymentStatus.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold border",
                          ORDER_STATUS_CONFIG[order.orderStatus]
                        )}
                      >
                        {order.orderStatus.charAt(0) + order.orderStatus.slice(1).toLowerCase().replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/seller/orders/${order.id}`}
                        className="text-[#2874F0] text-xs font-medium hover:underline"
                      >
                        View Details
                      </Link>
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

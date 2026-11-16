"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { orderService } from "@/services/orderService";
import { Order, OrderStatus } from "@/types";
import { useAuthStore } from "@/store/useAuthStore";
import { useHydration } from "@/hooks/useHydration";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { formatPrice, formatDate } from "@/utils/formatters";
import { useToast } from "@/components/common/Toast";
import {
  Package,
  Search,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Status Badge Helper ──────────────────────────────────────────────────────
export function getStatusBadge(status: OrderStatus) {
  switch (status) {
    case "DELIVERED":
      return { label: "Delivered", color: "bg-[#E8F5E9] text-[#388E3C] border-green-200", icon: <CheckCircle2 size={13} className="text-[#388E3C]" /> };
    case "CANCELLED":
      return { label: "Cancelled", color: "bg-red-50 text-red-600 border-red-200", icon: <XCircle size={13} className="text-red-500" /> };
    case "OUT_FOR_DELIVERY":
      return { label: "Out for Delivery", color: "bg-amber-50 text-amber-700 border-amber-200", icon: <Truck size={13} className="text-amber-600" /> };
    case "SHIPPED":
      return { label: "Shipped", color: "bg-blue-50 text-[#2874F0] border-blue-200", icon: <Truck size={13} className="text-[#2874F0]" /> };
    case "PACKED":
      return { label: "Packed", color: "bg-purple-50 text-purple-700 border-purple-200", icon: <Package size={13} className="text-purple-600" /> };
    case "PROCESSING":
      return { label: "Processing", color: "bg-purple-50 text-purple-700 border-purple-200", icon: <Clock size={13} className="text-purple-600" /> };
    case "CONFIRMED":
      return { label: "Confirmed", color: "bg-blue-50 text-[#2874F0] border-blue-200", icon: <CheckCircle2 size={13} className="text-[#2874F0]" /> };
    case "RETURN_REQUESTED":
      return { label: "Return Requested", color: "bg-orange-50 text-orange-700 border-orange-200", icon: <Clock size={13} className="text-orange-600" /> };
    case "RETURNED":
      return { label: "Returned", color: "bg-gray-100 text-gray-700 border-gray-200", icon: <Package size={13} className="text-gray-600" /> };
    case "REFUNDED":
      return { label: "Refunded", color: "bg-green-50 text-green-700 border-green-200", icon: <CheckCircle2 size={13} className="text-green-600" /> };
    case "PENDING":
    case "PLACED":
    default:
      return { label: status === "PENDING" ? "Pending" : "Order Placed", color: "bg-gray-100 text-gray-700 border-gray-200", icon: <Clock size={13} className="text-gray-600" /> };
  }
}

export default function OrdersHistoryPage() {
  const { toast } = useToast();
  const isHydrated = useHydration();
  const { isAuthenticated, user } = useAuthStore();

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Load orders from localStorage / mock
  useEffect(() => {
    let isCancelled = false;
    async function load() {
      try {
        const data = await orderService.getOrders();
        if (!isCancelled) {
          setOrders(data);
          setIsLoading(false);
        }
      } catch (err) {
        console.error(err);
        if (!isCancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      isCancelled = true;
    };
  }, []);

  // Quick cancel handler for eligible orders
  const handleQuickCancel = async (orderId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!window.confirm("Are you sure you want to cancel this order?")) {
      return;
    }

    try {
      const updated = await orderService.cancelOrder(orderId);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId || o.orderNumber === orderId ? updated : o))
      );
      toast({
        type: "info",
        title: "Order Cancelled",
        message: `Order #${updated.orderNumber} has been successfully cancelled.`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to cancel order";
      toast({ type: "error", title: "Cannot Cancel", message: msg });
    }
  };

  // Filter orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Status filter
      if (statusFilter !== "ALL" && order.orderStatus !== statusFilter) {
        return false;
      }
      // Search query filter (Order number or item title)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesId = order.orderNumber.toLowerCase().includes(query);
        const matchesItem = order.items.some((it) =>
          it.title.toLowerCase().includes(query)
        );
        return matchesId || matchesItem;
      }
      return true;
    });
  }, [orders, statusFilter, searchQuery]);

  if (!isHydrated || isLoading) {
    return (
      <div className="bg-[#F1F3F6] min-h-screen py-8">
        <div className="max-w-[1100px] mx-auto px-4 space-y-4">
          <div className="animate-pulse h-16 bg-white rounded-sm border border-[#E0E0E0]" />
          <div className="animate-pulse h-44 bg-white rounded-sm border border-[#E0E0E0]" />
          <div className="animate-pulse h-44 bg-white rounded-sm border border-[#E0E0E0]" />
        </div>
      </div>
    );
  }

  // Client-side protection guard
  if (!isAuthenticated || !user) {
    return (
      <div className="bg-[#F1F3F6] min-h-screen py-12">
        <div className="max-w-md mx-auto p-8 bg-white border border-[#E0E0E0] rounded-sm text-center shadow-xs">
          <div className="w-16 h-16 bg-blue-50 text-[#2874F0] rounded-full flex items-center justify-center mx-auto mb-4">
            <Package size={32} />
          </div>
          <h2 className="text-lg font-bold text-[#212121]">Sign in to View Your Orders</h2>
          <p className="text-xs text-[#878787] mt-1 mb-6">
            Track active shipments, view order invoices, and review order history.
          </p>
          <Link href="/login?redirect=/orders">
            <Button variant="primary" fullWidth className="font-semibold text-sm">
              Sign In to FlipStore
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F1F3F6] min-h-screen py-6">
      <div className="max-w-[1180px] mx-auto px-3 sm:px-4 space-y-4">
        {/* Page Header */}
        <div className="bg-white border border-[#E0E0E0] rounded-sm p-4 sm:p-5 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-[#212121]">
                My Orders
                <span className="ml-2 text-sm font-normal text-[#878787]">
                  ({orders.length} {orders.length === 1 ? "order" : "orders"})
                </span>
              </h1>
              <p className="text-xs text-[#878787] mt-0.5">
                Track your active shipments, cancel orders, or request returns
              </p>
            </div>

            <Link href="/products">
              <Button variant="outline" size="sm" className="text-xs font-semibold">
                Browse More Products
              </Button>
            </Link>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="mt-4 pt-4 border-t border-[#F0F0F0] flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px]">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                type="text"
                placeholder="Search by Order ID or Product name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-3 text-xs bg-gray-50 border border-[#E0E0E0] rounded-xs focus:outline-none focus:border-[#2874F0] focus:bg-white transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs py-1">
              {[
                { label: "All Orders", value: "ALL" },
                { label: "Confirmed", value: "CONFIRMED" },
                { label: "Packed", value: "PACKED" },
                { label: "Shipped", value: "SHIPPED" },
                { label: "Delivered", value: "DELIVERED" },
                { label: "Cancelled", value: "CANCELLED" },
              ].map((f) => (
                <button
                  key={f.value}
                  onClick={() => setStatusFilter(f.value)}
                  className={cn(
                    "px-3 py-1.5 rounded-full font-semibold border cursor-pointer whitespace-nowrap transition-colors",
                    statusFilter === f.value
                      ? "bg-[#2874F0] text-white border-[#2874F0]"
                      : "bg-white text-[#555] border-[#E0E0E0] hover:bg-gray-50"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white border border-[#E0E0E0] rounded-sm p-8 shadow-2xs">
            <EmptyState
              preset="orders"
              title={searchQuery || statusFilter !== "ALL" ? "No Matching Orders" : "No Orders Found"}
              description={
                searchQuery || statusFilter !== "ALL"
                  ? "Try resetting your search query or status filter."
                  : "You haven't placed any orders with us yet. Start exploring thousands of great deals!"
              }
              actionText={searchQuery || statusFilter !== "ALL" ? "Reset Filters" : "Shop Now"}
              actionHref={searchQuery || statusFilter !== "ALL" ? undefined : "/products"}
              onAction={
                searchQuery || statusFilter !== "ALL"
                  ? () => {
                      setSearchQuery("");
                      setStatusFilter("ALL");
                    }
                  : undefined
              }
            />
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => {
              const badge = getStatusBadge(order.orderStatus);
              const isEligibleForCancel =
                order.orderStatus === "PENDING" ||
                order.orderStatus === "PLACED" ||
                order.orderStatus === "CONFIRMED" ||
                order.orderStatus === "PROCESSING" ||
                order.orderStatus === "PACKED";

              return (
                <div
                  key={order.id}
                  className="bg-white border border-[#E0E0E0] rounded-sm shadow-2xs hover:shadow-md transition-shadow duration-200 overflow-hidden"
                >
                  {/* Order Card Header */}
                  <div className="p-3.5 sm:p-4 bg-[#FAFAFA] border-b border-[#F0F0F0] flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex flex-wrap items-center gap-3">
                      <div>
                        <span className="text-[#878787]">Order Placed: </span>
                        <strong className="text-[#212121]">{formatDate(order.placedAt)}</strong>
                      </div>
                      <span className="text-gray-300 hidden sm:inline">|</span>
                      <div>
                        <span className="text-[#878787]">Order ID: </span>
                        <strong className="text-[#2874F0]">{order.orderNumber}</strong>
                      </div>
                      <span className="text-gray-300 hidden sm:inline">|</span>
                      <div>
                        <span className="text-[#878787]">Total: </span>
                        <strong className="text-[#212121]">
                          {formatPrice(order.pricing.totalAmount)}
                        </strong>
                      </div>
                    </div>

                    {/* Status badge */}
                    <div
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border",
                        badge.color
                      )}
                    >
                      {badge.icon}
                      <span>{badge.label}</span>
                    </div>
                  </div>

                  {/* Items list */}
                  <div className="p-4 sm:p-5 divide-y divide-[#F0F0F0]">
                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="flex gap-3.5 items-start">
                          <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-gray-50 border border-gray-100 rounded-xs overflow-hidden shrink-0">
                            <Image
                              src={item.thumbnail}
                              alt={item.title}
                              fill
                              sizes="80px"
                              className="object-contain p-1"
                            />
                          </div>
                          <div>
                            <Link
                              href={`/orders/${order.orderNumber}`}
                              className="text-xs sm:text-sm font-semibold text-[#212121] hover:text-[#2874F0] line-clamp-2 transition-colors"
                            >
                              {item.title}
                            </Link>

                            {item.selectedVariants &&
                              Object.keys(item.selectedVariants).length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1 text-[10px] text-[#555]">
                                  {Object.entries(item.selectedVariants).map(([k, v]) => (
                                    <span key={k} className="bg-gray-100 px-1.5 py-0.5 rounded-xs">
                                      {k}: {v}
                                    </span>
                                  ))}
                                </div>
                              )}

                            <p className="text-xs text-[#878787] mt-1">
                              Qty: <strong>{item.quantity}</strong> · Price:{" "}
                              <strong className="text-[#212121]">{formatPrice(item.price)}</strong>
                            </p>
                          </div>
                        </div>

                        {/* Right delivery notice */}
                        <div className="sm:text-right text-xs">
                          {order.orderStatus === "DELIVERED" ? (
                            <p className="text-[#388E3C] font-semibold flex items-center sm:justify-end gap-1">
                              <CheckCircle2 size={13} />
                              Delivered on {formatDate(order.deliveredAt || order.estimatedDelivery)}
                            </p>
                          ) : order.orderStatus === "CANCELLED" ? (
                            <p className="text-red-500 font-semibold flex items-center sm:justify-end gap-1">
                              <XCircle size={13} />
                              Cancelled
                            </p>
                          ) : (
                            <p className="text-[#555] flex items-center sm:justify-end gap-1">
                              <Truck size={13} className="text-[#2874F0]" />
                              Expected by{" "}
                              <strong className="text-[#212121]">
                                {formatDate(order.estimatedDelivery)}
                              </strong>
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Card Action Footer */}
                  <div className="px-4 py-3 bg-[#FAFAFA] border-t border-[#F0F0F0] flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="text-[11px] text-[#878787]">
                      Payment: <strong className="text-[#555]">{order.paymentMethod}</strong> (
                      <span
                        className={cn(
                          "font-semibold",
                          order.paymentStatus === "PAID" ? "text-[#388E3C]" : "text-amber-600"
                        )}
                      >
                        {order.paymentStatus}
                      </span>
                      )
                    </div>

                    <div className="flex items-center gap-2">
                      {isEligibleForCancel && (
                        <button
                          type="button"
                          onClick={(e) => handleQuickCancel(order.orderNumber, e)}
                          className="px-3 py-1.5 text-xs text-red-600 font-semibold border border-red-200 hover:bg-red-50 rounded-xs transition-colors cursor-pointer"
                        >
                          Cancel Order
                        </button>
                      )}

                      <Link href={`/orders/${order.orderNumber}`}>
                        <Button
                          variant="primary"
                          size="sm"
                          className="text-xs font-semibold flex items-center gap-1"
                        >
                          <span>Track &amp; View Details</span>
                          <ChevronRight size={13} />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

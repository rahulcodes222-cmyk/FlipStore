"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import {
  ShoppingBag,
  Search,
  RefreshCw,
  Eye,
  CheckCircle2,
  Clock,
  Truck,
  RotateCcw,
  X,
  CreditCard,
  MapPin,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { Order, OrderStatus } from "@/types";
import { adminService } from "@/services/adminService";
import { formatPrice } from "@/utils/formatters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ORDER_STATUS_OPTIONS: { label: string; value: OrderStatus; color: string }[] = [
  { label: "Order Placed", value: "PLACED", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { label: "Confirmed", value: "CONFIRMED", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  { label: "Processing", value: "PROCESSING", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { label: "Shipped", value: "SHIPPED", color: "bg-purple-50 text-purple-700 border-purple-200" },
  { label: "Out for Delivery", value: "OUT_FOR_DELIVERY", color: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  { label: "Delivered", value: "DELIVERED", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { label: "Cancelled", value: "CANCELLED", color: "bg-red-50 text-red-700 border-red-200" },
];

export function AdminOrdersClient() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Selected Order for Details Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await adminService.getOrders();
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingId(orderId);
    try {
      const updated = await adminService.updateOrderStatus(orderId, newStatus);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(updated);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchNum = o.orderNumber?.toLowerCase().includes(q);
        const matchCustomer = o.shippingAddress?.name?.toLowerCase().includes(q);
        const matchPhone = o.shippingAddress?.phone?.includes(q);
        if (!matchNum && !matchCustomer && !matchPhone) return false;
      }

      if (statusFilter !== "ALL" && o.orderStatus !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [orders, searchQuery, statusFilter]);

  return (
    <div className="space-y-6">
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-[#212121] tracking-tight">Order Management</h1>
            <span className="bg-gray-200 text-gray-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {filteredOrders.length} Orders
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Track customer shipments, review invoice values, and advance fulfillment tracking stages.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadOrders}
          className="h-9 text-xs font-semibold bg-white border-gray-300"
        >
          <RefreshCw size={13} className="mr-1.5" />
          Refresh
        </Button>
      </div>

      {/* ── Filters ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-md border border-gray-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex-1 min-w-[240px] max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Order ID, customer name, or phone..."
            className="pl-9 h-9 text-xs bg-gray-50 border-gray-200 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-500 font-medium">Status Filter:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 text-xs bg-white border border-gray-200 rounded font-semibold text-gray-700 focus:outline-none focus:border-[#2874F0]"
          >
            <option value="ALL">All Statuses ({orders.length})</option>
            {ORDER_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Orders Table ────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-md border border-gray-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-20 text-center text-gray-500 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin text-[#2874F0] mx-auto mb-2" />
            Loading orders list...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-16 text-center text-gray-500 text-xs">
            <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="font-bold text-gray-700 text-sm">No orders matching filter</p>
            <p className="mt-1">Try resetting the status filter or search query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f9fafb] text-gray-500 uppercase text-[10px] font-bold tracking-wider border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">Order ID &amp; Date</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Products</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Order Status</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map((order) => {
                  const statusOpt =
                    ORDER_STATUS_OPTIONS.find((s) => s.value === order.orderStatus) ||
                    ORDER_STATUS_OPTIONS[0];

                  return (
                    <tr key={order.id} className="hover:bg-gray-50/70 transition-colors">
                      {/* Order ID & Date */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-gray-900 block">
                          {order.orderNumber}
                        </span>
                        <span className="text-[11px] text-gray-500">
                          {new Date(order.placedAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-gray-900">{order.shippingAddress?.name || "Customer"}</p>
                        <p className="text-[11px] text-gray-500">
                          {order.shippingAddress?.city}, {order.shippingAddress?.state}
                        </p>
                        <span className="text-[10px] text-gray-400">
                          {order.shippingAddress?.phone}
                        </span>
                      </td>

                      {/* Products */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          {order.items.slice(0, 3).map((item, idx) => (
                            <div
                              key={idx}
                              className="relative w-8 h-8 rounded border border-gray-200 bg-white overflow-hidden shrink-0"
                              title={`${item.title} (x${item.quantity})`}
                            >
                              <Image
                                src={item.thumbnail || "/placeholder-product.svg"}
                                alt={item.title}
                                fill
                                className="object-contain p-0.5"
                              />
                            </div>
                          ))}
                          {order.items.length > 3 && (
                            <span className="text-[10px] font-bold text-gray-500 bg-gray-100 rounded px-1.5 py-1">
                              +{order.items.length - 3}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-400 block mt-1">
                          {order.items.length} {order.items.length === 1 ? "item" : "items"}
                        </span>
                      </td>

                      {/* Total Amount */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-gray-900 text-sm">
                          {formatPrice(order.pricing.totalAmount)}
                        </span>
                      </td>

                      {/* Payment */}
                      <td className="py-3.5 px-4">
                        <p className="font-medium text-gray-800 text-[11px]">
                          {order.paymentMethod.replace(/_/g, " ")}
                        </p>
                        <span
                          className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold ${
                            order.paymentStatus === "PAID"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {order.paymentStatus}
                        </span>
                      </td>

                      {/* Status Dropdown */}
                      <td className="py-3.5 px-4">
                        <select
                          value={order.orderStatus}
                          disabled={updatingId === order.id}
                          onChange={(e) =>
                            handleStatusChange(order.id, e.target.value as OrderStatus)
                          }
                          className={`h-7 px-2 text-[11px] font-bold rounded border cursor-pointer focus:outline-none ${statusOpt.color}`}
                        >
                          {ORDER_STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Details Button */}
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedOrder(order)}
                          className="h-7 text-xs px-2.5 text-[#2874F0] border-blue-200 hover:bg-blue-50"
                        >
                          <Eye size={12} className="mr-1" />
                          View
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Order Details Modal ─────────────────────────────────────────────── */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setSelectedOrder(null)}>
          <div className="bg-white rounded-md max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative space-y-5" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-gray-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-[#212121]">Order Details</h2>
                  <span className="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-bold">
                    {selectedOrder.orderNumber}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Placed on {new Date(selectedOrder.placedAt).toLocaleString("en-IN")}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={20} />
              </button>
            </div>

            {/* Quick Status Update in Modal */}
            <div className="bg-gray-50 rounded p-3 flex flex-wrap items-center justify-between gap-3 border border-gray-200">
              <span className="text-xs font-bold text-gray-700">Update Tracking Stage:</span>
              <div className="flex items-center gap-2">
                <select
                  value={selectedOrder.orderStatus}
                  onChange={(e) =>
                    handleStatusChange(selectedOrder.id, e.target.value as OrderStatus)
                  }
                  className="h-8 px-2.5 text-xs font-bold rounded border bg-white text-[#2874F0] border-blue-300 focus:outline-none"
                >
                  {ORDER_STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Items Breakdown */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                Ordered Products ({selectedOrder.items.length})
              </h3>
              <div className="border border-gray-200 rounded divide-y divide-gray-100">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="p-3 flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded border border-gray-200 bg-white overflow-hidden shrink-0">
                      <Image
                        src={item.thumbnail || "/placeholder-product.svg"}
                        alt={item.title}
                        fill
                        className="object-contain p-1"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">{item.title}</p>
                      <p className="text-[11px] text-gray-500">
                        Qty: <span className="font-semibold">{item.quantity}</span> × {formatPrice(item.price)}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-gray-900">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Address & Payment Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Shipping Address */}
              <div className="border border-gray-200 rounded p-3 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-gray-800 mb-1">
                  <MapPin size={14} className="text-[#2874F0]" />
                  <span>Delivery Address</span>
                </div>
                <p className="font-bold text-gray-900">{selectedOrder.shippingAddress?.name || "Customer"}</p>
                <p className="text-gray-600">
                  {selectedOrder.shippingAddress?.street}, {selectedOrder.shippingAddress?.locality ? `${selectedOrder.shippingAddress.locality}, ` : ""}
                </p>
                <p className="text-gray-600">
                  {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} - {selectedOrder.shippingAddress?.pincode}
                </p>
                <p className="text-gray-700 font-semibold pt-1">
                  Phone: {selectedOrder.shippingAddress?.phone}
                </p>
              </div>

              {/* Pricing Summary */}
              <div className="border border-gray-200 rounded p-3 text-xs space-y-1.5 bg-gray-50/50">
                <div className="flex items-center gap-1.5 font-bold text-gray-800 mb-1">
                  <CreditCard size={14} className="text-[#2874F0]" />
                  <span>Payment &amp; Pricing</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Total MRP:</span>
                  <span>{formatPrice(selectedOrder.pricing.totalMrp)}</span>
                </div>
                {selectedOrder.pricing.discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Discount:</span>
                    <span>- {formatPrice(selectedOrder.pricing.discount)}</span>
                  </div>
                )}
                {selectedOrder.pricing.couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Coupon Savings:</span>
                    <span>- {formatPrice(selectedOrder.pricing.couponDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Charges:</span>
                  <span>
                    {selectedOrder.pricing.deliveryCharges === 0 ? "FREE" : formatPrice(selectedOrder.pricing.deliveryCharges)}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 pt-1.5 border-t border-gray-200 text-sm">
                  <span>Grand Total:</span>
                  <span>{formatPrice(selectedOrder.pricing.totalAmount)}</span>
                </div>
                <div className="pt-1 text-[11px] text-gray-500">
                  Method: <span className="font-bold text-gray-800">{selectedOrder.paymentMethod}</span> ({selectedOrder.paymentStatus})
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end pt-3 border-t border-gray-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedOrder(null)}
                className="text-xs"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

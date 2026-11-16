"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Package,
  User,
  MapPin,
  CreditCard,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCcw,
} from "lucide-react";
import { useHydration } from "@/hooks/useHydration";
import { useSellerStore } from "@/store/useSellerStore";
import { sellerOrderService } from "@/services";
import { useToast } from "@/components/common/Toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { SellerOrderDetail, SellerOrderStatus } from "@/types";

const STATUS_CONFIG: Record<SellerOrderStatus, { bg: string; text: string; border: string; label: string }> = {
  PENDING: { bg: "bg-[#FFF8E1]", text: "text-[#B26A00]", border: "border-[#FFE082]", label: "Pending" },
  PLACED: { bg: "bg-[#FFF8E1]", text: "text-[#B26A00]", border: "border-[#FFE082]", label: "Placed" },
  CONFIRMED: { bg: "bg-[#E3F2FD]", text: "text-[#1565C0]", border: "border-[#BBDEFB]", label: "Confirmed" },
  PROCESSING: { bg: "bg-[#FFF3E0]", text: "text-[#E65100]", border: "border-[#FFE0B2]", label: "Processing" },
  PACKED: { bg: "bg-[#EDE7F6]", text: "text-[#5E35B1]", border: "border-[#D1C4E9]", label: "Packed" },
  SHIPPED: { bg: "bg-[#E8F5E9]", text: "text-[#2E7D32]", border: "border-[#C8E6C9]", label: "Shipped" },
  OUT_FOR_DELIVERY: { bg: "bg-[#E3F2FD]", text: "text-[#1565C0]", border: "border-[#BBDEFB]", label: "Out for Delivery" },
  DELIVERED: { bg: "bg-[#E8F5E9]", text: "text-[#2E7D32]", border: "border-[#C8E6C9]", label: "Delivered" },
  CANCELLED: { bg: "bg-[#FFEBEE]", text: "text-[#C62828]", border: "border-[#FFCDD2]", label: "Cancelled" },
  RETURN_REQUESTED: { bg: "bg-[#FFF3E0]", text: "text-[#E65100]", border: "border-[#FFE0B2]", label: "Return Requested" },
  RETURNED: { bg: "bg-[#F5F5F5]", text: "text-[#616161]", border: "border-[#E0E0E0]", label: "Returned" },
  REFUNDED: { bg: "bg-[#F5F5F5]", text: "text-[#616161]", border: "border-[#E0E0E0]", label: "Refunded" },
};

const NEXT_ACTIONS: Record<SellerOrderStatus, SellerOrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  PLACED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "PACKED", "CANCELLED"],
  PROCESSING: ["PACKED", "SHIPPED", "CANCELLED"],
  PACKED: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["OUT_FOR_DELIVERY", "CANCELLED"],
  OUT_FOR_DELIVERY: ["DELIVERED", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
  RETURN_REQUESTED: ["RETURNED", "REFUNDED"],
  RETURNED: ["REFUNDED"],
  REFUNDED: [],
};

export default function SellerOrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const isHydrated = useHydration();
  const { seller } = useSellerStore();
  const { toast, success, error } = useToast();
  const currentSeller = isHydrated ? seller : null;
  const sellerId = currentSeller?.id || "slr-001";
  const orderId = params.id;

  const [order, setOrder] = useState<SellerOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const o = await sellerOrderService.getOrderDetail(orderId, sellerId);
        if (mounted) setOrder(o);
      } catch {
        error("Failed to load order");
      } finally {
        if (mounted) setLoading(false);
    }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [sellerId, orderId, toast]);

  const handleStatusChange = async (newStatus: SellerOrderStatus) => {
    if (!order) return;
    try {
      const updated = await sellerOrderService.updateOrderStatus(orderId, sellerId, newStatus);
      if (updated) {
        setOrder(updated);
        success(`Order status updated to ${updated.orderStatus}`);
      }
    } catch {
      error("Failed to update order status");
    }
  };

  if (loading || !order) {
    return (
      <div className="p-4 sm:p-6">
        <h1 className="text-lg font-bold text-[#212121]">Order Details</h1>
        <div className="h-64 rounded-sm bg-[#E8E8E8] animate-skeleton mt-4" />
      </div>
    );
  }

  const nextStatuses: SellerOrderStatus[] = NEXT_ACTIONS[order.orderStatus as keyof typeof NEXT_ACTIONS] || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Link
          href="/seller/orders"
          className="inline-flex items-center gap-2 text-sm text-[#2874F0] font-semibold hover:underline"
        >
          <ArrowLeft size={16} /> Back to Orders
        </Link>
        <div>
          <h1 className="text-lg font-bold text-[#212121]">Order {order.orderNumber}</h1>
          <p className="text-xs text-[#878787]">Order ID: {order.id}</p>
        </div>
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold border",
            order.orderStatus === "DELIVERED"
              ? "bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]"
              : order.orderStatus === "SHIPPED" || order.orderStatus === "OUT_FOR_DELIVERY"
              ? "bg-[#E3F2FD] text-[#1565C0] border-[#BBDEFB]"
              : order.orderStatus === "PROCESSING" || order.orderStatus === "CONFIRMED"
              ? "bg-[#FFF3E0] text-[#E65100] border-[#FFE0B2]"
              : order.orderStatus === "CANCELLED" || order.orderStatus === "RETURNED" || order.orderStatus === "RETURN_REQUESTED"
              ? "bg-[#FFEBEE] text-[#C62828] border-[#FFCDD2]"
              : "bg-[#F5F5F5] text-[#616161] border-[#E0E0E0]"
          )}
        >
          {order.orderStatus.charAt(0) + order.orderStatus.slice(1).toLowerCase().replace(/_/g, " ")}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Summary */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[#878787]">Order Date</span>
                  <span className="text-[#212121] font-medium">
                    {new Date(order.placedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#878787]">Estimated Delivery</span>
                  <span className="text-[#212121] font-medium">
                    {new Date(order.estimatedDelivery).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                </div>
                {order.deliveredAt && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#878787]">Delivered At</span>
                    <span className="text-[#212121] font-medium">
                      {new Date(order.deliveredAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                    </span>
                  </div>
                )}
              </div>
              <div className="border-t border-[#F0F0F0] pt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[#878787]">Payment Method</span>
                  <span className="text-[#212121] font-medium">{order.paymentMethod}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#878787]">Payment Status</span>
                  <span className={cn("font-medium", order.paymentStatus === "PAID" ? "text-[#2E7D32]" : "text-[#E53935]")}>
                    {order.paymentStatus}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Order Total</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-[#878787]">Subtotal</span>
                <span className="text-[#212121]">₹{order.pricing.totalMrp.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#878787]">Discount</span>
                <span className="text-[#2E7D32]">-₹{order.pricing.discount.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#878787]">Delivery Charges</span>
                <span className="text-[#212121]">₹{order.pricing.deliveryCharges.toLocaleString("en-IN")}</span>
              </div>
              <div className="border-t border-[#F0F0F0] pt-2">
                <div className="flex justify-between text-base font-bold">
                  <span className="text-[#212121]">Total Amount</span>
                  <span className="text-[#212121]">₹{order.pricing.totalAmount.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {nextStatuses.length > 0 ? (
                <div className="space-y-2">
                  {nextStatuses.map((status) => (
                    <Button
                      key={status}
                      variant="outline"
                      onClick={() => handleStatusChange(status)}
                      className="w-full text-left justify-between"
                    >
                      <span>Mark as {status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, " ")}</span>
                      <RefreshCcw size={14} />
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#878787]">No further status changes available.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Order Items & Timeline */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Items ({order.items.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-b border-[#F0F0F0] pb-3">
                <div className="grid grid-cols-12 text-[10px] font-bold text-[#878787] uppercase mb-2">
                  <div className="col-span-4">Product</div>
                  <div className="col-span-2 text-right">Price</div>
                  <div className="col-span-2 text-right">Qty</div>
                  <div className="col-span-2 text-right">Total</div>
                </div>
              </div>
              <div className="divide-y divide-[#F0F0F0]">
                {order.items.map((item: any, i: number) => (
                  <div key={i} className="grid grid-cols-12 items-center py-3">
                    <div className="col-span-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-sm overflow-hidden border border-[#E0E0E0] flex-shrink-0">
                        <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="text-sm font-medium text-[#212121]">{item.title}</div>
                    </div>
                    <div className="col-span-2 text-right text-sm font-medium text-[#212121]">
                      ₹{item.price.toLocaleString("en-IN")}
                    </div>
                    <div className="col-span-2 text-right text-sm text-[#212121]">{item.quantity}</div>
                    <div className="col-span-2 text-right text-sm font-bold text-[#212121]">
                      ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Order Timeline</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative">
                <div className="absolute left-3 top-0 bottom-0 w-px bg-[#E0E0E0]" />
                {order.timeline.map((entry: any, i: number) => (
                  <div key={entry.id} className="relative pl-10 py-3">
                    <div className={cn(
                      "absolute -left-[8px] top-2 w-3 h-3 rounded-full border-2 border-[#2874F0]",
                      entry.isCompleted ? "bg-[#2874F0]" : "bg-[#F1F3F6]"
                    )} />
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-medium text-[#212121]">{entry.title}</div>
                      <div className="ml-auto text-[10px] text-[#878787]">
                        {new Date(entry.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </div>
                    </div>
                    {!entry.isCompleted && (
                      <div className="text-[10px] text-[#878787] mt-1">{entry.description}</div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Customer Info */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#F1F3F6] flex items-center justify-center">
                  <User size={20} className="text-[#878787]" />
                </div>
                <div>
                  <div className="text-sm font-bold text-[#212121]">{order.customerName}</div>
                  <div className="text-xs text-[#878787]">{order.customerEmail}</div>
                  <div className="text-xs text-[#878787]">{order.customerPhone}</div>
                </div>
              </div>
              <div className="border-t border-[#F0F0F0] pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin size={16} className="text-[#2874F0]" />
                  <span className="text-xs font-bold text-[#878787] uppercase">Shipping Address</span>
                </div>
                <div className="text-sm text-[#212121]">
                  {order.customerAddress.street}<br />
                  {order.customerAddress.locality}, {order.customerAddress.city}<br />
                  {order.customerAddress.state} - {order.customerAddress.pincode}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

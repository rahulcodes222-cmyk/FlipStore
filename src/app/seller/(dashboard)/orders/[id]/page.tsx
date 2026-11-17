"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, User, MapPin, RefreshCcw } from "lucide-react";
import { useHydration } from "@/hooks/useHydration";
import { useSellerStore } from "@/store/useSellerStore";
import { sellerOrderService } from "@/services";
import { useToast } from "@/components/common/Toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { SellerOrderDetail, SellerOrderStatus } from "@/types";

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

function formatMoney(n: number) {
  return `₹${Number(n || 0).toLocaleString("en-IN")}`;
}

function labelStatus(s: string) {
  return String(s || "").charAt(0) + String(s || "").slice(1).toLowerCase().replace(/_/g, " ");
}

export default function SellerOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const isHydrated = useHydration();
  const { seller } = useSellerStore();
  const { success, error } = useToast();
  const currentSeller = isHydrated ? seller : null;
  const sellerId = currentSeller?.id || "slr-001";
  const orderId = String(params?.id || "");

  const [order, setOrder] = useState<SellerOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<SellerOrderStatus | null>(null);

  useEffect(() => {
    if (!isHydrated || !orderId) return;
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const o = await sellerOrderService.getOrderDetail(orderId, sellerId);
        if (mounted) setOrder(o);
      } catch (e: any) {
        if (mounted) error(e?.message || "Failed to load order");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [sellerId, orderId, isHydrated, error]);

  const handleStatusChange = async (newStatus: SellerOrderStatus) => {
    if (!order || !orderId) return;
    setUpdating(newStatus);
    try {
      const updated = await sellerOrderService.updateOrderStatus(orderId, sellerId, newStatus);
      if (updated) {
        setOrder(updated);
        success(`Order status updated to ${labelStatus(String(updated.orderStatus))}`);
      }
    } catch (e: any) {
      error(e?.message || "Failed to update order status");
    } finally {
      setUpdating(null);
    }
  };

  if (loading || !isHydrated) {
    return (
      <div className="p-4 sm:p-6 space-y-4">
        <Link href="/seller/orders" className="inline-flex items-center gap-2 text-sm text-[#2874F0] font-semibold hover:underline"><ArrowLeft size={16} /> Back to Orders</Link>
        <h1 className="text-lg font-bold text-[#212121]">Order Details</h1>
        <div className="h-64 rounded-sm bg-[#E8E8E8] animate-skeleton mt-4" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-4 sm:p-6 space-y-4">
        <Link href="/seller/orders" className="inline-flex items-center gap-2 text-sm text-[#2874F0] font-semibold hover:underline"><ArrowLeft size={16} /> Back to Orders</Link>
        <h1 className="text-lg font-bold text-[#212121]">Order not found</h1>
        <p className="text-sm text-[#878787]">This order could not be loaded. It may not belong to your seller account or may no longer exist.</p>
      </div>
    );
  }

  const nextStatuses: SellerOrderStatus[] = NEXT_ACTIONS[order.orderStatus as keyof typeof NEXT_ACTIONS] || [];
  const statusBadgeClass = order.orderStatus === "DELIVERED"
    ? "bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]"
    : order.orderStatus === "SHIPPED" || order.orderStatus === "OUT_FOR_DELIVERY"
    ? "bg-[#E3F2FD] text-[#1565C0] border-[#BBDEFB]"
    : order.orderStatus === "PROCESSING" || order.orderStatus === "CONFIRMED" || order.orderStatus === "PACKED"
    ? "bg-[#FFF3E0] text-[#E65100] border-[#FFE0B2]"
    : order.orderStatus === "CANCELLED" || order.orderStatus === "RETURNED" || order.orderStatus === "RETURN_REQUESTED" || order.orderStatus === "REFUNDED"
    ? "bg-[#FFEBEE] text-[#C62828] border-[#FFCDD2]"
    : "bg-[#F5F5F5] text-[#616161] border-[#E0E0E0]";

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <Link href="/seller/orders" className="inline-flex items-center gap-2 text-sm text-[#2874F0] font-semibold hover:underline">
            <ArrowLeft size={16} /> Back to Orders
          </Link>
          <h1 className="text-lg sm:text-xl font-bold text-[#212121] break-words">Order {order.orderNumber || "-"}</h1>
          <p className="text-xs text-[#878787] break-all">Order ID: {order.id}</p>
        </div>
        <span className={cn("inline-flex items-center self-start rounded-full px-2.5 py-1 text-[10px] sm:text-xs font-semibold border whitespace-nowrap", statusBadgeClass)}>
          {labelStatus(order.orderStatus)}
        </span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        <div className="xl:col-span-1 space-y-4 sm:space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-3"><CardTitle className="text-sm sm:text-base">Order Summary</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3"><span className="text-[#878787] shrink-0">Order Date</span><span className="text-[#212121] font-medium text-right">{new Date(order.placedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span></div>
                <div className="flex items-start justify-between gap-3"><span className="text-[#878787] shrink-0">Estimated Delivery</span><span className="text-[#212121] font-medium text-right">{new Date(order.estimatedDelivery).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span></div>
                {order.deliveredAt && (
                  <div className="flex items-start justify-between gap-3"><span className="text-[#878787] shrink-0">Delivered At</span><span className="text-[#212121] font-medium text-right">{new Date(order.deliveredAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span></div>
                )}
              </div>
              <div className="border-t border-[#F0F0F0] pt-4 space-y-3">
                <div className="flex items-start justify-between gap-3"><span className="text-[#878787] shrink-0">Payment Method</span><span className="text-[#212121] font-medium text-right break-words">{String(order.paymentMethod || "-")}</span></div>
                <div className="flex items-start justify-between gap-3"><span className="text-[#878787] shrink-0">Payment Status</span><span className={cn("font-medium text-right", order.paymentStatus === "PAID" ? "text-[#2E7D32]" : "text-[#E53935]")}>{String(order.paymentStatus || "-")}</span></div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-3"><CardTitle className="text-sm sm:text-base">Order Total</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between gap-3"><span className="text-[#878787]">Subtotal</span><span className="text-[#212121] font-medium">{formatMoney(order.pricing.totalMrp)}</span></div>
              <div className="flex justify-between gap-3"><span className="text-[#878787]">Discount</span><span className="text-[#2E7D32] font-medium">-{formatMoney(order.pricing.discount)}</span></div>
              <div className="flex justify-between gap-3"><span className="text-[#878787]">Delivery Charges</span><span className="text-[#212121] font-medium">{formatMoney(order.pricing.deliveryCharges)}</span></div>
              <div className="border-t border-[#F0F0F0] pt-3 flex justify-between gap-3 text-base font-bold"><span className="text-[#212121]">Total Amount</span><span className="text-[#212121]">{formatMoney(order.pricing.totalAmount)}</span></div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-3"><CardTitle className="text-sm sm:text-base">Actions</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {nextStatuses.length > 0 ? (
                <div className="space-y-2">
                  {nextStatuses.map((status) => (
                    <Button key={status} variant="outline" onClick={() => handleStatusChange(status)} disabled={!!updating} className="w-full h-auto min-h-10 py-2 px-3 text-left justify-between gap-3 whitespace-normal">
                      <span className="text-sm">{updating === status ? "Updating..." : `Mark as ${labelStatus(status)}`}</span>
                      <RefreshCcw size={14} className={cn("shrink-0", updating === status ? "animate-spin" : "")} />
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#878787]">No further status changes available.</p>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-3"><CardTitle className="text-sm sm:text-base">Customer Information</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-[#F1F3F6] flex items-center justify-center shrink-0"><User size={20} className="text-[#878787]" /></div>
                <div className="min-w-0 space-y-0.5">
                  <div className="font-bold text-[#212121] break-words">{order.customerName || "Customer"}</div>
                  {order.customerEmail ? <div className="text-xs text-[#878787] break-all">{order.customerEmail}</div> : null}
                  {order.customerPhone ? <div className="text-xs text-[#878787] break-all">{order.customerPhone}</div> : null}
                </div>
              </div>
              <div className="border-t border-[#F0F0F0] pt-4">
                <div className="flex items-center gap-2 mb-2"><MapPin size={16} className="text-[#2874F0] shrink-0" /><span className="text-xs font-bold text-[#878787] uppercase">Shipping Address</span></div>
                <div className="text-[#212121] break-words leading-relaxed">
                  {order.customerAddress?.street || "-"}<br />
                  {[order.customerAddress?.locality, order.customerAddress?.city].filter(Boolean).join(", ") || "-"}<br />
                  {[order.customerAddress?.state, order.customerAddress?.pincode ? `- ${order.customerAddress.pincode}` : ""].filter(Boolean).join(" ") || "-"}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="xl:col-span-2 space-y-4 sm:space-y-6 min-w-0">
          <Card className="shadow-sm">
            <CardHeader className="pb-3"><CardTitle className="text-sm sm:text-base">Order Items ({order.items.length})</CardTitle></CardHeader>
            <CardContent className="p-0 sm:p-6 sm:pt-0">
              <div className="hidden sm:grid grid-cols-12 gap-3 text-[10px] font-bold text-[#878787] uppercase px-6 pb-3 border-b border-[#F0F0F0]">
                <div className="col-span-6">Product</div>
                <div className="col-span-2 text-right">Price</div>
                <div className="col-span-2 text-right">Qty</div>
                <div className="col-span-2 text-right">Total</div>
              </div>
              <div className="divide-y divide-[#F0F0F0]">
                {order.items.map((item: any, i: number) => {
                  const qty = Number(item.quantity || 0);
                  const price = Number(item.price || 0);
                  return (
                    <div key={item.id || i} className="p-4 sm:px-6 sm:py-4">
                      <div className="flex gap-3 sm:grid sm:grid-cols-12 sm:gap-3 sm:items-center">
                        <div className="sm:col-span-6 flex items-start gap-3 min-w-0 flex-1">
                          <div className="w-14 h-14 sm:w-12 sm:h-12 rounded-sm overflow-hidden border border-[#E0E0E0] flex-shrink-0 bg-white">
                            <img src={item.thumbnail || "/placeholder-product.svg"} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-[#212121] break-words">{item.title || "Product"}</div>
                            <div className="mt-2 grid grid-cols-2 gap-2 text-xs sm:hidden">
                              <div><span className="text-[#878787]">Price: </span><span className="font-medium text-[#212121]">{formatMoney(price)}</span></div>
                              <div className="text-right"><span className="text-[#878787]">Qty: </span><span className="font-medium text-[#212121]">{qty}</span></div>
                              <div className="col-span-2"><span className="text-[#878787]">Total: </span><span className="font-bold text-[#212121]">{formatMoney(price * qty)}</span></div>
                            </div>
                          </div>
                        </div>
                        <div className="hidden sm:block sm:col-span-2 text-right text-sm font-medium text-[#212121]">{formatMoney(price)}</div>
                        <div className="hidden sm:block sm:col-span-2 text-right text-sm text-[#212121]">{qty}</div>
                        <div className="hidden sm:block sm:col-span-2 text-right text-sm font-bold text-[#212121]">{formatMoney(price * qty)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-3"><CardTitle className="text-sm sm:text-base">Order Timeline</CardTitle></CardHeader>
            <CardContent className="pt-0">
              <div className="relative pl-2 sm:pl-0">
                <div className="absolute left-3 top-1 bottom-1 w-px bg-[#E0E0E0]" />
                {(order.timeline || []).map((entry: any) => (
                  <div key={entry.id} className="relative pl-9 sm:pl-10 py-3">
                    <div className={cn("absolute left-[7px] top-4 w-3 h-3 rounded-full border-2 border-[#2874F0]", entry.isCompleted ? "bg-[#2874F0]" : "bg-[#F1F3F6]")} />
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-3 min-w-0">
                      <div className="text-sm font-medium text-[#212121] break-words">{entry.title || labelStatus(entry.status || "")}</div>
                      <div className="text-[10px] sm:text-xs text-[#878787] shrink-0">{entry.date ? new Date(entry.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : ""}</div>
                    </div>
                    {entry.description ? <div className="text-xs text-[#878787] mt-1 break-words">{entry.description}</div> : null}
                  </div>
                ))}
                {(!order.timeline || order.timeline.length === 0) && <p className="text-xs text-[#878787] py-2">No timeline updates available.</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

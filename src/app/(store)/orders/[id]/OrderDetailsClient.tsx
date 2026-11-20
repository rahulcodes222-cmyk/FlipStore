"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { orderService } from "@/services/orderService";
import { productService } from "@/services/productService";
import { Order, OrderStatus, Review } from "@/types";
import { useHydration } from "@/hooks/useHydration";
import { useAuthStore } from "@/store/useAuthStore";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { formatPrice, formatDate } from "@/utils/formatters";
import { useToast } from "@/components/common/Toast";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  MapPin,
  CreditCard,
  Download,
  AlertTriangle,
  HelpCircle,
  Star,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── 6 Official Tracking Stages ───────────────────────────────────────────────
const TIMELINE_STAGES: {
  status: OrderStatus;
  title: string;
  description: string;
}[] = [
  {
    status: "PLACED",
    title: "Order Placed",
    description: "Your order has been recorded and submitted to the seller.",
  },
  {
    status: "CONFIRMED",
    title: "Order Confirmed",
    description: "The seller has accepted and verified the order details.",
  },
  {
    status: "PROCESSING",
    title: "Processing & Packaging",
    description: "Item is inspected, packed, and assigned a shipping label.",
  },
  {
    status: "SHIPPED",
    title: "Shipped",
    description: "Package handed over to the courier partner at the dispatch hub.",
  },
  {
    status: "OUT_FOR_DELIVERY",
    title: "Out for Delivery",
    description: "Courier executive is out for delivery to your doorstep today.",
  },
  {
    status: "DELIVERED",
    title: "Delivered",
    description: "Package safely delivered and signed for.",
  },
];

const STAGE_ORDER: Record<string, number> = {
  PENDING: 0,
  PLACED: 0,
  CONFIRMED: 1,
  PROCESSING: 2,
  PACKED: 2,
  SHIPPED: 3,
  OUT_FOR_DELIVERY: 4,
  DELIVERED: 5,
  CANCELLED: -1,
  RETURN_REQUESTED: 5,
  RETURNED: 5,
  REFUNDED: 5,
};

export function OrderDetailsClient({ orderId }: { orderId: string }) {
  const { toast } = useToast();
  const isHydrated = useHydration();
  const user = useAuthStore((s) => s.user);

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Cancellation modal state
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("Found a better price elsewhere");
  const [isCancelling, setIsCancelling] = useState(false);

  // Return modal state
  const [returnItemId, setReturnItemId] = useState<string | null>(null);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnReason, setReturnReason] = useState("Defective or damaged item");
  const [returnType, setReturnType] = useState<"RETURN" | "REPLACEMENT">("RETURN");
  const [isReturning, setIsReturning] = useState(false);

  // Review state (only for purchased order items)
  const [reviewOpenFor, setReviewOpenFor] = useState<string | null>(null);
  const [reviewForm, setReviewForm] = useState<Record<string, { rating: number; title: string; comment: string }>>({});
  const [reviewSubmitting, setReviewSubmitting] = useState<string | null>(null);
  const [reviewedProducts, setReviewedProducts] = useState<Record<string, boolean>>({});
  const [myReviews, setMyReviews] = useState<Record<string, Review | null>>({});

  const isReviewEligibleOrder = useMemo(() => {
    const st = String(order?.orderStatus || "").toUpperCase();
    return !!order && st === "DELIVERED";
  }, [order]);

  // Load Order
  useEffect(() => {
    let isCancelled = false;
    async function load() {
      try {
        const found = await orderService.getOrderById(orderId);
        if (!isCancelled) {
          setOrder(found);
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
  }, [orderId]);

  // Load current user's existing review for this order/product (allow repeat reviews on new orders)
  useEffect(() => {
    if (!order || !isReviewEligibleOrder) return;
    const uid = String((user as any)?.id || (user as any)?._id || "").trim();
    if (!uid) return;
    const productIds = Array.from(new Set((order.items || []).map((it: any) => String(it?.productId || "").trim()).filter(Boolean)));
    if (productIds.length === 0) return;
    const orderIdsToMatch = new Set([String(order.id || "").trim(), String(order.orderNumber || "").trim()].filter(Boolean));
    let cancelled = false;
    (async () => {
      try {
        const entries = await Promise.all(productIds.map(async (pid) => {
          try {
            const reviews = await productService.getProductReviews(pid);
            const mineForOrder = (reviews || []).find((r: any) => {
              if (String(r?.userId || "") !== uid) return false;
              const rid = String((r as any)?.orderId || "").trim();
              if (rid && orderIdsToMatch.size > 0) return orderIdsToMatch.has(rid);
              // Legacy fallback: if review has no orderId, treat as already reviewed for this product
              return !rid;
            }) || null;
            return [pid, mineForOrder] as const;
          } catch {
            return [pid, null] as const;
          }
        }));
        if (cancelled) return;
        setMyReviews((prev) => {
          const next = { ...prev };
          for (const [pid, mine] of entries) next[pid] = mine as any;
          return next;
        });
        setReviewedProducts((prev) => {
          const next = { ...prev };
          for (const [pid, mine] of entries) next[pid] = !!mine;
          return next;
        });
      } catch {
        // ignore; backend still prevents duplicate review on submit
      }
    })();
    return () => { cancelled = true; };
  }, [order, isReviewEligibleOrder, user]);

  // ── Cancellation ────────────────────────────────────────────────────────────
  const handleConfirmCancel = async () => {
    if (!order) return;
    setIsCancelling(true);
    try {
      const cancelled = await orderService.cancelOrder(order.id, cancelReason);
      setOrder(cancelled);
      setIsCancelModalOpen(false);
      toast({
        type: "success",
        title: "Order Cancelled",
        message: `Order #${order.orderNumber} has been successfully cancelled.`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to cancel order";
      toast({ type: "error", message: msg });
    } finally {
      setIsCancelling(false);
    }
  };

  // ── Return / Replacement ─────────────────────────────────────────────────────
  const openReturnModal = (itemId: string) => {
    setReturnItemId(itemId);
    setReturnReason("Defective or damaged item");
    setReturnType("RETURN");
    setIsReturnModalOpen(true);
  };

  const handleConfirmReturn = async () => {
    if (!order || !returnItemId) return;
    const item = order.items.find((i) => String((i as any).id || (i as any)._id || i.productId) === returnItemId);
    if (!item) return;
    setIsReturning(true);
    try {
      await orderService.createReturn({
        orderId: order.id,
        productId: item.productId,
        subOrderId: undefined,
        quantity: item.quantity,
        reason: returnReason.trim(),
        type: returnType,
        notes: `Customer requested ${returnType.toLowerCase()} via order details page.`,
      });
      toast({
        type: "success",
        title: "Return Request Submitted",
        message: `Your ${returnType.toLowerCase()} request for item ${item.title} has been submitted and is pending approval.`,
      });
      setIsReturnModalOpen(false);
      setReturnItemId(null);
      // Refresh order to reflect latest status
      const refreshed = await orderService.getOrderById(order.id);
      setOrder(refreshed);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to submit return request";
      toast({ type: "error", message: msg });
    } finally {
      setIsReturning(false);
    }
  };

  const handleDownloadInvoice = async () => {
    if (!order) return;
    try {
      const { blob, filename } = await orderService.getInvoice(order.orderNumber || order.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename || `INV-${order.orderNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({ type: "success", title: "Invoice Downloaded", message: `${a.download || "Invoice"} downloaded.` });
    } catch {
      toast({ type: "error", message: "Failed to download invoice." });
    }
  };

  const getReviewForm = (productId: string) => reviewForm[productId] || { rating: 5, title: "", comment: "" };
  const setReviewField = (productId: string, patch: Partial<{ rating: number; title: string; comment: string }>) => {
    setReviewForm((prev) => ({ ...prev, [productId]: { ...getReviewForm(productId), ...patch } }));
  };

  const handleSubmitReview = async (productId: string, productTitle: string) => {
    if (!productId || !order) return;
    if (myReviews[productId] || reviewedProducts[productId]) {
      toast({ type: "info", message: "You have already reviewed this product for this order." });
      return;
    }
    const f = getReviewForm(productId);
    const title = f.title.trim();
    const comment = f.comment.trim();
    if (!Number.isFinite(f.rating) || f.rating < 1 || f.rating > 5) {
      toast({ type: "error", message: "Please select a rating (1-5)." });
      return;
    }
    if (title.length < 3 || comment.length < 10) {
      toast({ type: "error", message: "Please add a short title and a detailed review comment." });
      return;
    }
    setReviewSubmitting(productId);
    try {
      const res = await productService.createProductReview(productId, {
        rating: f.rating,
        title,
        comment,
        orderId: String(order.id || order.orderNumber || ""),
      });
      if (!res?.success) {
        const msg = String(res?.message || "Failed to submit review.");
        if (msg.toLowerCase().includes("already reviewed")) {
          setReviewedProducts((prev) => ({ ...prev, [productId]: true }));
          // fetch existing review for this order to display rating/content
          try {
            const uid = String((user as any)?.id || (user as any)?._id || "").trim();
            const orderIdsToMatch = new Set([String(order.id || "").trim(), String(order.orderNumber || "").trim()].filter(Boolean));
            const reviews = await productService.getProductReviews(productId);
            const mine = uid ? (reviews || []).find((r: any) => String(r?.userId || "") === uid && (!r?.orderId || orderIdsToMatch.has(String(r.orderId)))) || null : null;
            if (mine) setMyReviews((prev) => ({ ...prev, [productId]: mine as any }));
          } catch {}
        }
        toast({ type: "error", title: "Review not submitted", message: msg });
        return;
      }
      const submittedReview = (res as any)?.review as Review | undefined;
      if (submittedReview) {
        setMyReviews((prev) => ({ ...prev, [productId]: submittedReview }));
      } else {
        try {
          const uid = String((user as any)?.id || (user as any)?._id || "").trim();
          const orderIdsToMatch = new Set([String(order.id || "").trim(), String(order.orderNumber || "").trim()].filter(Boolean));
          const reviews = await productService.getProductReviews(productId);
          const mine = uid ? (reviews || []).find((r: any) => String(r?.userId || "") === uid && (!r?.orderId || orderIdsToMatch.has(String(r.orderId)))) || null : null;
          if (mine) setMyReviews((prev) => ({ ...prev, [productId]: mine as any }));
        } catch {}
      }
      setReviewedProducts((prev) => ({ ...prev, [productId]: true }));
      setReviewOpenFor(null);
      toast({ type: "success", title: "Review submitted", message: `Thanks for reviewing ${productTitle}.` });
    } catch (e: any) {
      toast({ type: "error", title: "Review failed", message: e?.message || "Failed to submit review." });
    } finally {
      setReviewSubmitting(null);
    }
  };

  if (!isHydrated || isLoading) {
    return (
      <div className="bg-[#F1F3F6] min-h-screen py-8">
        <div className="max-w-[1100px] mx-auto px-4 space-y-4">
          <div className="animate-pulse h-16 bg-white rounded-sm border border-[#E0E0E0]" />
          <div className="animate-pulse h-64 bg-white rounded-sm border border-[#E0E0E0]" />
          <div className="animate-pulse h-48 bg-white rounded-sm border border-[#E0E0E0]" />
        </div>
      </div>
    );
  }

  // Not found
  if (!order) {
    return (
      <div className="bg-[#F1F3F6] min-h-screen py-10">
        <div className="max-w-[900px] mx-auto px-4">
          <EmptyState
            preset="orders"
            title="Order Not Found"
            description={`We could not locate an order matching ID "${orderId}".`}
            actionText="View All Orders"
            actionHref="/orders"
          />
        </div>
      </div>
    );
  }

  // Guard: if order not loaded yet, show loading
  if (!isHydrated || isLoading) {
    return (
      <div className="bg-[#F1F3F6] min-h-screen py-12">
        <div className="max-w-[800px] mx-auto p-12 text-center text-sm text-[#878787]">
          Loading order details...
        </div>
      </div>
    );
  }

  // Guard: if order not found, show not found state (prevents crash when API returns 404)
  if (!order) {
    return (
      <div className="bg-[#F1F3F6] min-h-screen py-12">
        <div className="max-w-md mx-auto p-8 bg-white border border-[#E0E0E0] rounded-sm text-center shadow-xs">
          <AlertTriangle size={40} className="text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-[#212121]">Order Not Found</h2>
          <p className="text-xs text-[#878787] mt-1 mb-6">
            We could not find this order. Please check the order ID and try again.
          </p>
          <Link href="/orders">
            <Button variant="primary" fullWidth className="font-semibold text-xs">
              View All Orders
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentStageIndex = STAGE_ORDER[order.orderStatus];
  const isCancelled = order.orderStatus === "CANCELLED";
  const isReturnedOrRefunded = order.orderStatus === "RETURNED" || order.orderStatus === "REFUNDED" || order.orderStatus === "RETURN_REQUESTED";
  const isEligibleForCancel =
    order.orderStatus === "PENDING" ||
    order.orderStatus === "PLACED" ||
    order.orderStatus === "CONFIRMED" ||
    order.orderStatus === "PROCESSING" ||
    order.orderStatus === "PACKED";

  return (
    <div className="bg-[#F1F3F6] min-h-screen py-6">
      <div className="max-w-[1180px] mx-auto px-3 sm:px-4 space-y-4">
        {/* Top Back bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/orders"
            className="inline-flex items-center gap-1.5 text-xs text-[#878787] hover:text-[#2874F0] font-semibold transition-colors"
          >
            <ArrowLeft size={14} /> Back to My Orders
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadInvoice}
              className="px-3 py-1.5 bg-white border border-[#E0E0E0] rounded-xs text-xs font-semibold text-[#212121] hover:bg-gray-50 flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Download size={13} className="text-[#2874F0]" />
              Download Invoice
            </button>
          </div>
        </div>

        {/* ── Order Header Card ────────────────────────────────────────────── */}
        <div className="bg-white border border-[#E0E0E0] rounded-sm p-4 sm:p-5 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-bold text-[#212121]">
                  Order #{order.orderNumber}
                </h1>
                <span
                  className={cn(
                    "text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wide border",
                    isCancelled
                      ? "bg-red-50 text-red-600 border-red-200"
                      : order.orderStatus === "DELIVERED"
                      ? "bg-green-50 text-[#388E3C] border-green-200"
                      : "bg-blue-50 text-[#2874F0] border-blue-200"
                  )}
                >
                  {order.orderStatus.replace(/_/g, " ")}
                </span>
              </div>
              <p className="text-xs text-[#878787] mt-1">
                Placed on {formatDate(order.placedAt)} · Paid via {order.paymentMethod} (
                <span
                  className={cn(
                    "font-semibold",
                    order.paymentStatus === "PAID" ? "text-[#388E3C]" : "text-amber-600"
                  )}
                >
                  {order.paymentStatus}
                </span>
                )
              </p>
            </div>

            {isEligibleForCancel && (
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(true)}
                className="px-3 py-1.5 border border-red-200 text-red-600 text-xs font-bold rounded-xs hover:bg-red-50 transition-colors cursor-pointer"
              >
                Cancel Order
              </button>
            )}
          </div>
        </div>

        {/* ── TRACKING TIMELINE CARD ────────────────────────────────────────── */}
        <div className="bg-white border border-[#E0E0E0] rounded-sm p-4 sm:p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-[#F0F0F0]">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#212121]">
                Live Shipment Tracking
              </h2>
              <p className="text-xs text-[#878787] mt-0.5">
                {isCancelled
                  ? "This shipment has been cancelled."
                  : order.orderStatus === "DELIVERED"
                  ? `Delivered on ${formatDate(order.deliveredAt || order.estimatedDelivery)}`
                  : `Expected Delivery by ${formatDate(order.estimatedDelivery)}`}
              </p>
            </div>

            {/* Courier ID badge */}
            <div className="text-right text-[11px] text-[#878787]">
              <span>Courier Partner: </span>
              <strong className="text-[#212121]">Ekart Logistics</strong>
              <div className="text-[10px] text-gray-400">AWB: EKRT{order.orderNumber.slice(2)}IN</div>
            </div>
          </div>

          {/* Cancelled/Return Banner */}
          {isCancelled || isReturnedOrRefunded ? (
            <div className={cn("p-4 border rounded-xs flex items-start gap-3", isCancelled ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200")}>
              <XCircle size={22} className={cn("shrink-0 mt-0.5", isCancelled ? "text-red-500" : "text-amber-600")} />
              <div>
                <h3 className={cn("font-bold text-sm", isCancelled ? "text-red-700" : "text-amber-700")}>
                  {isCancelled ? "Order Cancelled" : order.orderStatus.replace(/_/g, " ")}
                </h3>
                <p className={cn("text-xs mt-0.5 leading-relaxed", isCancelled ? "text-red-600" : "text-amber-700")}>
                  {isCancelled
                    ? `This order was cancelled as requested. Any amount deducted will be refunded to your original payment method (${order.paymentMethod}) within 3–5 business days.`
                    : `Current status: ${order.orderStatus.replace(/_/g, " ")}. Refund/request updates are reflected in order status.`}
                </p>
              </div>
            </div>
          ) : (
            /* Active Multi-stage Stepper (6 statuses) */
            <div className="relative py-2">
              {/* Stepper Grid on Desktop */}
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4 relative">
                {TIMELINE_STAGES.map((stage, idx) => {
                  const isCompleted = currentStageIndex >= idx;
                  const isCurrent = currentStageIndex === idx;

                  return (
                    <div
                      key={stage.status}
                      className={cn(
                        "relative flex md:flex-col items-start gap-3 md:gap-2",
                        idx !== TIMELINE_STAGES.length - 1 ? "md:pb-0 pb-6" : ""
                      )}
                    >
                      {/* Node Icon */}
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-all z-10",
                          isCompleted
                            ? "bg-[#388E3C] text-white ring-4 ring-green-100"
                            : "bg-gray-100 text-gray-400 border border-gray-300",
                          isCurrent ? "animate-pulse" : ""
                        )}
                      >
                        {isCompleted ? <CheckCircle2 size={16} /> : idx + 1}
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <p
                          className={cn(
                            "text-xs font-bold transition-colors",
                            isCompleted ? "text-[#212121]" : "text-gray-400"
                          )}
                        >
                          {stage.title}
                        </p>
                        <p className="text-[11px] text-[#878787] mt-0.5 leading-snug">
                          {stage.description}
                        </p>
                        {isCurrent && (
                          <span className="inline-block mt-1 text-[10px] font-bold text-[#388E3C] bg-green-50 px-1.5 py-0.5 rounded-xs border border-green-200">
                            Current Status
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}


        </div>

        {/* ── Products & Address & Payment Details ──────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left: Products Info (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border border-[#E0E0E0] rounded-sm p-4 sm:p-5 shadow-2xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#878787] mb-3 pb-2 border-b border-[#F0F0F0]">
                Items in this Order ({order.items.length})
              </h3>

              <div className="divide-y divide-[#F0F0F0]">
                {order.items.map((item, idx) => (
                  <div key={idx} className="py-3.5 first:pt-0 last:pb-0 flex gap-4 items-start">
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-gray-50 border border-gray-100 rounded-xs overflow-hidden shrink-0">
                      <Image
                        src={item.thumbnail || "/placeholder-product.svg"}
                        alt={item.title}
                        fill
                        sizes="96px"
                        className="object-contain p-1.5"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/products/${item.productId}`}
                        className="text-xs sm:text-sm font-semibold text-[#212121] hover:text-[#2874F0] line-clamp-2 transition-colors"
                      >
                        {item.title}
                      </Link>

                      {item.selectedVariants && Object.keys(item.selectedVariants).length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1 text-[10px] text-[#555]">
                          {Object.entries(item.selectedVariants).map(([k, v]) => (
                            <span key={k} className="bg-gray-100 px-2 py-0.5 rounded-xs">
                              {k}: <strong>{v}</strong>
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="font-bold text-sm text-[#212121]">
                          {formatPrice(item.price)}
                        </span>
                        {item.mrp > item.price && (
                          <span className="text-xs text-[#878787] line-through">
                            {formatPrice(item.mrp)}
                          </span>
                        )}
                        <span className="text-xs text-[#878787]">Qty: {item.quantity}</span>
                      </div>

                      <p className="text-xs text-[#2874F0] font-semibold mt-2">
                        Total: {formatPrice(item.price * item.quantity)}
                      </p>

                      {/* Return button (only when order is delivered) */}
                      {String(order?.orderStatus || "").toUpperCase() === "DELIVERED" && (
                        <button
                          type="button"
                          onClick={() => openReturnModal(String((item as any).id || (item as any)._id || item.productId))}
                          className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#2874F0] hover:underline"
                        >
                          <Package size={13} />
                          Return / Replace Item
                        </button>
                      )}

                      {isReviewEligibleOrder && (
                        <div className="mt-3 pt-3 border-t border-[#F0F0F0]">
                          {myReviews[item.productId] || reviewedProducts[item.productId] ? (
                            <div className="rounded-sm border border-green-200 bg-green-50 p-3 space-y-1.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#388E3C]">
                                  <CheckCircle2 size={13} /> Your review for this order
                                </span>
                                {myReviews[item.productId]?.rating != null && (
                                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#212121]">
                                    <Star size={13} className="fill-[#FF9F00] text-[#FF9F00]" />
                                    {Number(myReviews[item.productId]?.rating || 0).toFixed(1)}/5
                                  </span>
                                )}
                              </div>
                              {myReviews[item.productId]?.title ? (
                                <p className="text-xs font-semibold text-[#212121]">{String(myReviews[item.productId]?.title)}</p>
                              ) : null}
                              {myReviews[item.productId]?.comment ? (
                                <p className="text-xs text-[#555] whitespace-pre-wrap">{String(myReviews[item.productId]?.comment)}</p>
                              ) : !myReviews[item.productId] ? (
                                <p className="text-xs text-[#555]">You have already reviewed this product.</p>
                              ) : null}
                            </div>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => setReviewOpenFor((cur) => cur === item.productId ? null : item.productId)}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2874F0] hover:underline"
                              >
                                <Star size={13} className="text-[#FF9F00]" />
                                {reviewOpenFor === item.productId ? "Hide Review Form" : "Rate & Review Product"}
                              </button>

                              {reviewOpenFor === item.productId && (
                                <div className="mt-2 rounded-sm border border-[#E0E0E0] bg-[#FAFAFA] p-3 space-y-2">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[11px] font-semibold text-[#555] mr-1">Rating:</span>
                                    {[1, 2, 3, 4, 5].map((n) => (
                                      <button
                                        key={n}
                                        type="button"
                                        onClick={() => setReviewField(item.productId, { rating: n })}
                                        className="p-0.5"
                                        aria-label={`Rate ${n}`}
                                      >
                                        <Star size={16} className={n <= getReviewForm(item.productId).rating ? "fill-[#FF9F00] text-[#FF9F00]" : "text-gray-300"} />
                                      </button>
                                    ))}
                                  </div>
                                  <input
                                    type="text"
                                    value={getReviewForm(item.productId).title}
                                    onChange={(e) => setReviewField(item.productId, { title: e.target.value })}
                                    placeholder="Review title"
                                    className="w-full h-9 px-3 text-xs bg-white border border-[#E0E0E0] rounded-xs focus:outline-none focus:border-[#2874F0]"
                                  />
                                  <textarea
                                    value={getReviewForm(item.productId).comment}
                                    onChange={(e) => setReviewField(item.productId, { comment: e.target.value })}
                                    placeholder="Share your experience with this product..."
                                    rows={3}
                                    className="w-full px-3 py-2 text-xs bg-white border border-[#E0E0E0] rounded-xs focus:outline-none focus:border-[#2874F0] resize-y"
                                  />
                                  <div className="flex items-center gap-2">
                                    <Button
                                      type="button"
                                      size="sm"
                                      onClick={() => handleSubmitReview(item.productId, item.title)}
                                      isLoading={reviewSubmitting === item.productId}
                                      className="text-xs"
                                    >
                                      Submit Review
                                    </Button>
                                    <button
                                      type="button"
                                      onClick={() => setReviewOpenFor(null)}
                                      className="text-xs text-[#878787] hover:text-[#212121]"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                  <p className="text-[10px] text-[#878787]">Only customers who purchased and received this product can submit a review. One review per order.</p>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {Array.isArray((order as any).returns) && (order as any).returns.length > 0 && (
              <div className="bg-white border border-[#E0E0E0] rounded-sm p-4 sm:p-5 shadow-2xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#878787] mb-3 pb-2 border-b border-[#F0F0F0]">
                  Return / Replacement Requests ({(order as any).returns.length})
                </h3>
                <div className="space-y-3">
                  {(order as any).returns.map((ret: any) => {
                    const status = String(ret?.status || "PENDING").toUpperCase();
                    const statusStyles: Record<string, string> = {
                      PENDING: "bg-amber-50 text-amber-700 border-amber-200",
                      APPROVED: "bg-blue-50 text-blue-700 border-blue-200",
                      PROCESSING: "bg-indigo-50 text-indigo-700 border-indigo-200",
                      COMPLETED: "bg-green-50 text-green-700 border-green-200",
                      REFUNDED: "bg-green-50 text-green-700 border-green-200",
                      REPLACED: "bg-green-50 text-green-700 border-green-200",
                      REJECTED: "bg-red-50 text-red-700 border-red-200",
                      CANCELLED: "bg-gray-50 text-gray-700 border-gray-200",
                    };
                    const reqDate = ret?.requestDate || ret?.createdAt;
                    const resolvedDate = ret?.resolvedAt || ret?.updatedAt;
                    return (
                      <div key={String(ret?._id || ret?.id || ret?.returnNumber || Math.random())} className="border border-[#F0F0F0] rounded-sm p-3 text-xs">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-semibold text-[#212121] truncate">
                              {ret?.productName || "Product"}{ret?.quantity ? ` (Qty: ${ret.quantity})` : ""}
                            </p>
                            <p className="text-[#878787] mt-0.5">
                              Request #{ret?.returnNumber || String(ret?._id || ret?.id || "-")} · {String(ret?.type || "RETURN")}
                            </p>
                          </div>
                          <span className={cn("px-2 py-0.5 rounded-full border font-bold uppercase tracking-wide text-[10px] whitespace-nowrap", statusStyles[status] || "bg-gray-50 text-gray-700 border-gray-200")}>
                            {status.replace(/_/g, " ")}
                          </span>
                        </div>
                        {ret?.reason ? (
                          <p className="text-[#555] mt-2"><span className="font-medium text-[#212121]">Reason:</span> {String(ret.reason)}</p>
                        ) : null}
                        {String(ret?.type || "RETURN").toUpperCase() !== "REPLACEMENT" && Number(ret?.refundAmount || 0) > 0 ? (
                          <p className="text-[#555] mt-1">
                            <span className="font-medium text-[#212121]">Refund Amount:</span> {formatPrice(Number(ret.refundAmount || 0))}
                            {ret?.refundStatus ? <span className="text-[#878787]"> ({String(ret.refundStatus).replace(/_/g, " ")})</span> : null}
                          </p>
                        ) : null}
                        {ret?.notes ? <p className="text-[#878787] mt-1">Note: {String(ret.notes)}</p> : null}
                        <p className="text-[#878787] mt-2">
                          Requested: {reqDate ? formatDate(String(reqDate)) : "-"}
                          {resolvedDate && status !== "PENDING" ? ` · Last update: ${formatDate(String(resolvedDate))}` : ""}
                        </p>
                      </div>
                    );
                  })}
                </div>
                <p className="text-[10px] text-[#878787] mt-3">Status updates made by seller/admin will appear here when you refresh this page.</p>
              </div>
            )}

            {/* Help & Support strip */}
            <div className="bg-white border border-[#E0E0E0] rounded-sm p-4 shadow-2xs flex items-center justify-between text-xs text-[#555]">
              <div className="flex items-center gap-2">
                <HelpCircle size={16} className="text-[#2874F0]" />
                <span>Need help with this order or return request?</span>
              </div>
              <button
                type="button"
                onClick={() =>
                  toast({
                    type: "info",
                    title: "24x7 Customer Support",
                    message: "Support ticket generated for Order #" + order.orderNumber,
                  })
                }
                className="text-[#2874F0] font-bold hover:underline cursor-pointer"
              >
                Contact Support
              </button>
            </div>
          </div>

          {/* Right: Address & Payment Summary */}
          <div className="space-y-4">
            {/* Delivery Address Card */}
            <div className="bg-white border border-[#E0E0E0] rounded-sm p-4 sm:p-5 shadow-2xs space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-[#F0F0F0]">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#878787]">
                  <MapPin size={13} className="text-[#2874F0]" />
                  <span>Delivery Address</span>
                </div>
                <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-xs bg-gray-100 text-gray-600">
                  {order.shippingAddress.type}
                </span>
              </div>
              <p className="font-bold text-sm text-[#212121]">{order.shippingAddress.name}</p>
              <p className="text-xs text-[#555] leading-relaxed">{order.shippingAddress.street}</p>
              <p className="text-xs text-[#555]">
                {order.shippingAddress.locality && `${order.shippingAddress.locality}, `}
                {order.shippingAddress.city}, {order.shippingAddress.state} -{" "}
                <strong className="text-[#212121]">{order.shippingAddress.pincode}</strong>
              </p>
              <p className="text-xs text-[#878787] pt-1">
                Phone Number: <strong className="text-[#555]">{order.shippingAddress.phone}</strong>
              </p>
            </div>

            {/* Payment Summary Card */}
            <div className="bg-white border border-[#E0E0E0] rounded-sm p-4 sm:p-5 shadow-2xs space-y-3">
              <div className="flex items-center gap-1.5 pb-2 border-b border-[#F0F0F0] text-xs font-bold uppercase tracking-wider text-[#878787]">
                <CreditCard size={13} className="text-[#2874F0]" />
                <span>Payment Summary</span>
              </div>

              <div className="space-y-2 text-xs border-b border-[#F0F0F0] pb-3">
                <div className="flex justify-between">
                  <span className="text-[#878787]">Total List Price</span>
                  <span>{formatPrice(order.pricing.totalMrp)}</span>
                </div>
                <div className="flex justify-between text-[#388E3C]">
                  <span>Discount</span>
                  <span>−{formatPrice(order.pricing.discount)}</span>
                </div>
                {order.pricing.couponDiscount > 0 && (
                  <div className="flex justify-between text-[#388E3C] font-semibold">
                    <span>Coupon Discount</span>
                    <span>−{formatPrice(order.pricing.couponDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[#878787]">Delivery Charges</span>
                  <span className="text-[#388E3C] font-semibold">
                    {order.pricing.deliveryCharges === 0
                      ? "FREE"
                      : formatPrice(order.pricing.deliveryCharges)}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center text-sm font-bold text-[#212121]">
                <span>Total Amount</span>
                <span>{formatPrice(order.pricing.totalAmount)}</span>
              </div>

              <div className="pt-2 text-[11px] text-[#878787] border-t border-[#F0F0F0] space-y-1">
                <p>
                  Payment Method: <strong className="text-[#212121]">{order.paymentMethod}</strong>
                </p>
                <p>
                  Payment Status:{" "}
                  <span
                    className={cn(
                      "font-bold",
                      order.paymentStatus === "PAID" ? "text-[#388E3C]" : "text-amber-600"
                    )}
                  >
                    {order.paymentStatus}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── CANCELLATION MODAL DIALOG ────────────────────────────────────────── */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => { if (!isCancelling) setIsCancelModalOpen(false); }}>
          <div className="bg-white rounded-sm max-w-md w-full p-6 shadow-xl space-y-4 border border-[#E0E0E0] animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[#F0F0F0] pb-3">
              <h3 className="font-bold text-sm text-[#212121] flex items-center gap-1.5">
                <AlertTriangle size={16} className="text-red-500" />
                Cancel Order #{order.orderNumber}
              </h3>
              <button
                onClick={() => setIsCancelModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#555] leading-relaxed">
              Are you sure you want to cancel this order? Once cancelled, the order cannot be
              reopened.
            </p>

            <div>
              <label className="block text-xs font-semibold text-[#212121] uppercase tracking-wider mb-1.5">
                Reason for Cancellation
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full h-10 px-3 text-xs bg-white border border-[#E0E0E0] rounded-xs focus:outline-none focus:border-[#2874F0]"
              >
                <option value="Found a better price elsewhere">Found a better price elsewhere</option>
                <option value="Expected delivery time is too long">
                  Expected delivery time is too long
                </option>
                <option value="Ordered by mistake">Ordered by mistake</option>
                <option value="Need to change shipping address">
                  Need to change shipping address
                </option>
                <option value="Other reason">Other reason</option>
              </select>
            </div>

            <div className="flex gap-2 pt-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCancelModalOpen(false)}
                className="text-xs"
              >
                Keep Order
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleConfirmCancel}
                isLoading={isCancelling}
                className="text-xs font-bold"
              >
                Confirm Cancellation
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── RETURN / REPLACEMENT MODAL ─────────────────────────────────────────── */}
      {isReturnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => { if (!isReturning) setIsReturnModalOpen(false); }}>
          <div className="bg-white rounded-sm max-w-md w-full p-6 shadow-xl space-y-4 border border-[#E0E0E0] animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[#F0F0F0] pb-3">
              <h3 className="font-bold text-sm text-[#212121] flex items-center gap-1.5">
                <Package size={16} className="text-[#2874F0]" />
                Return / Replace Item
              </h3>
              <button
                onClick={() => setIsReturnModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#555] leading-relaxed">
              Return or replacement requests are reviewed by the seller/admin and approved
              only if within the product's return window after delivery.
            </p>

            <div>
              <label className="block text-xs font-semibold text-[#212121] uppercase tracking-wider mb-1.5">
                Request Type
              </label>
              <select
                value={returnType}
                onChange={(e) => setReturnType(e.target.value as "RETURN" | "REPLACEMENT")}
                className="w-full h-10 px-3 text-xs bg-white border border-[#E0E0E0] rounded-xs focus:outline-none focus:border-[#2874F0] mb-4"
              >
                <option value="RETURN">Return for Refund</option>
                <option value="REPLACEMENT">Replace with New Item</option>
              </select>

              <label className="block text-xs font-semibold text-[#212121] uppercase tracking-wider mb-1.5">
                Reason
              </label>
              <select
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                className="w-full h-10 px-3 text-xs bg-white border border-[#E0E0E0] rounded-xs focus:outline-none focus:border-[#2874F0] mb-4"
              >
                <option value="Defective or damaged item">Defective or damaged item</option>
                <option value="Not as described">Not as described</option>
                <option value="Wrong item received">Wrong item received</option>
                <option value="No longer needed">No longer needed</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="flex gap-2 pt-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsReturnModalOpen(false)}
                className="text-xs"
              >
                Keep Item
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmReturn}
                isLoading={isReturning}
                className="text-xs font-bold"
              >
                Submit Return Request
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

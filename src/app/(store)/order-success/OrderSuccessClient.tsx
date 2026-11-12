"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { orderService } from "@/services/orderService";
import { Order } from "@/types";
import { useAuthStore } from "@/store/useAuthStore";
import { useHydration } from "@/hooks/useHydration";
import { formatPrice, formatDate } from "@/utils/formatters";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Package,
  Truck,
  MapPin,
  Calendar,
  CreditCard,
} from "lucide-react";

export function OrderSuccessClient() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const isHydrated = useHydration();
  const { user } = useAuthStore();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;
    async function load() {
      try {
        if (orderId) {
          const found = await orderService.getOrderById(orderId);
          if (!isCancelled && found) {
            setOrder(found);
            setIsLoading(false);
            return;
          }
        }
        // Fallback to most recent order
        const all = await orderService.getOrders();
        if (!isCancelled && all.length > 0) {
          setOrder(all[0]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      isCancelled = true;
    };
  }, [orderId]);

  if (!isHydrated || isLoading) {
    return (
      <div className="bg-[#F1F3F6] min-h-screen py-12">
        <div className="max-w-[800px] mx-auto p-12 text-center text-sm text-[#878787]">
          Verifying your order details...
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-[#F1F3F6] min-h-screen py-12">
        <div className="max-w-md mx-auto p-8 bg-white border border-[#E0E0E0] rounded-sm text-center shadow-xs">
          <CheckCircle2 size={40} className="text-[#388E3C] mx-auto mb-3" />
          <h2 className="text-lg font-bold text-[#212121]">Order Placed!</h2>
          <p className="text-xs text-[#878787] mt-1 mb-6">
            Your purchase was confirmed. You can check all past and active orders anytime.
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

  return (
    <div className="bg-[#F1F3F6] min-h-screen py-8">
      <div className="max-w-[850px] mx-auto px-4">
        <div className="bg-white border border-[#E0E0E0] rounded-sm p-6 sm:p-8 shadow-sm">
          {/* Celebratory Banner */}
          <div className="text-center pb-6 border-b border-[#F0F0F0]">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 animate-in zoom-in-75 duration-300">
              <CheckCircle2 size={40} className="text-[#388E3C]" />
            </div>
            <span className="text-xs uppercase font-bold tracking-wider text-[#388E3C] bg-green-50 px-3 py-1 rounded-full border border-green-200">
              Order Placed Successfully
            </span>
            <h1 className="text-2xl font-bold text-[#212121] mt-3">
              Thank you for shopping with us!
            </h1>
            <p className="text-xs text-[#878787] mt-1">
              Confirmation receipt sent to{" "}
              <strong className="text-[#555]">{user?.email || "your registered email"}</strong>
            </p>

            <div className="inline-block mt-3 bg-gray-50 border border-gray-200 px-4 py-2 rounded-xs text-sm">
              <span className="text-[#878787]">Order ID: </span>
              <strong className="text-[#212121]">{order.orderNumber}</strong>
            </div>
          </div>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-6 border-b border-[#F0F0F0] text-xs">
            <div className="p-3 bg-gray-50 rounded-xs">
              <div className="flex items-center gap-1.5 font-bold text-[#212121] mb-1">
                <MapPin size={14} className="text-[#2874F0]" />
                <span>Delivery Address</span>
              </div>
              <p className="font-semibold text-[#212121]">{order.shippingAddress.name}</p>
              <p className="text-[#555] mt-0.5 line-clamp-2">{order.shippingAddress.street}</p>
              <p className="text-[#555]">
                {order.shippingAddress.city}, {order.shippingAddress.state} -{" "}
                <strong className="text-[#212121]">{order.shippingAddress.pincode}</strong>
              </p>
            </div>

            <div className="p-3 bg-gray-50 rounded-xs">
              <div className="flex items-center gap-1.5 font-bold text-[#212121] mb-1">
                <CreditCard size={14} className="text-[#2874F0]" />
                <span>Payment Summary</span>
              </div>
              <p className="text-[#555]">
                Method: <strong className="text-[#212121]">{order.paymentMethod}</strong>
              </p>
              <p className="text-[#555] mt-0.5">
                Status: <strong className="text-[#388E3C]">{order.paymentStatus}</strong>
              </p>
              <p className="text-[#212121] font-bold text-sm mt-2">
                Total: {formatPrice(order.pricing.totalAmount)}
              </p>
            </div>

            <div className="p-3 bg-gray-50 rounded-xs">
              <div className="flex items-center gap-1.5 font-bold text-[#212121] mb-1">
                <Calendar size={14} className="text-[#388E3C]" />
                <span>Estimated Delivery</span>
              </div>
              <p className="text-[#388E3C] font-bold text-sm">
                Arriving by {formatDate(order.estimatedDelivery)}
              </p>
              <p className="text-[#878787] mt-1">Dispatched via Ekart Logistics</p>
            </div>
          </div>

          {/* Items Summary */}
          <div className="py-6 border-b border-[#F0F0F0]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#878787] mb-3">
              Items in this Order ({order.items.length})
            </h3>
            <div className="space-y-3">
              {order.items.map((it, idx) => (
                <div key={idx} className="flex gap-3 items-center">
                  <div className="relative w-14 h-14 bg-gray-50 border border-gray-100 rounded-xs overflow-hidden shrink-0">
                    <Image
                      src={it.thumbnail}
                      alt={it.title}
                      fill
                      sizes="56px"
                      className="object-contain p-1"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#212121] truncate">{it.title}</p>
                    <p className="text-[11px] text-[#878787]">Qty: {it.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-[#212121]">
                      {formatPrice(it.price * it.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action CTAs */}
          <div className="pt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href={`/orders/${order.orderNumber}`} className="flex-1 max-w-xs">
              <Button variant="buyNow" fullWidth className="text-xs font-bold flex items-center justify-center gap-1.5">
                <Truck size={14} />
                <span>Track Live Shipment</span>
              </Button>
            </Link>

            <Link href="/orders" className="flex-1 max-w-xs">
              <Button variant="primary" fullWidth className="text-xs font-semibold flex items-center justify-center gap-1.5">
                <Package size={14} />
                <span>View All Orders</span>
              </Button>
            </Link>

            <Link href="/" className="flex-1 max-w-xs">
              <Button variant="outline" fullWidth className="text-xs font-semibold">
                <span>Continue Shopping</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

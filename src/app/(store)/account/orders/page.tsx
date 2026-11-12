"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { orderService } from "@/services/orderService";
import { Order } from "@/types";
import { useAuthStore } from "@/store/useAuthStore";
import { useHydration } from "@/hooks/useHydration";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { formatPrice, formatDate } from "@/utils/formatters";
import { Package } from "lucide-react";

export default function OrdersPage() {
  const isHydrated = useHydration();
  const { isAuthenticated, user } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;
    let isCancelled = false;
    async function fetchOrders() {
      try {
        const data = await orderService.getOrders();
        if (!isCancelled) setOrders(data);
      } catch (e) {
        console.error(e);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }
    fetchOrders();
    return () => {
      isCancelled = true;
    };
  }, [isAuthenticated]);

  if (!isHydrated || (isAuthenticated && isLoading)) {
    return (
      <div className="max-w-[1280px] mx-auto p-8 text-center text-sm text-[#878787]">
        Loading your orders...
      </div>
    );
  }

  // Client-side protected route guard
  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white border border-[#E0E0E0] rounded-sm text-center shadow-xs">
        <div className="w-16 h-16 bg-blue-50 text-[#2874F0] rounded-full flex items-center justify-center mx-auto mb-4">
          <Package size={32} />
        </div>
        <h2 className="text-lg font-bold text-[#212121]">Sign in to View Your Orders</h2>
        <p className="text-xs text-[#878787] mt-1 mb-6">
          Track packages, view past purchases, and manage returns by logging in.
        </p>
        <Link href="/login?redirect=/account/orders">
          <Button variant="primary" fullWidth className="font-semibold text-sm">
            Sign In to FlipStore
          </Button>
        </Link>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 py-8">
        <EmptyState
          preset="orders"
          title="No Orders Found"
          description="You have not placed any orders yet. Start exploring great deals!"
          actionText="Start Shopping"
          actionHref="/"
        />
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto px-3 sm:px-4 py-8">
      <div className="bg-white border border-[#E0E0E0] rounded-sm p-4 mb-5 shadow-2xs">
        <h1 className="text-xl font-bold text-[#212121]">My Orders ({orders.length})</h1>
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="bg-white border border-[#E0E0E0] rounded-sm p-5 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between pb-3 mb-4 border-b border-[#F0F0F0] text-xs text-[#878787] gap-2">
              <div>
                <span className="font-bold text-[#212121]">Order #{order.orderNumber}</span> · Placed on {formatDate(order.placedAt)}
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-green-50 text-[#388E3C] border border-green-200">
                  {order.orderStatus}
                </span>
                <span className="font-bold text-[#212121]">
                  {formatPrice(order.pricing.totalAmount)}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex gap-4 items-center">
                  <div className="relative w-16 h-16 bg-white border border-gray-100 rounded-xs shrink-0 overflow-hidden">
                    <Image
                      src={item.thumbnail}
                      alt={item.title}
                      fill
                      sizes="64px"
                      className="object-contain p-1"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-[#212121] truncate">{item.title}</h4>
                    <p className="text-xs text-[#878787] mt-0.5">Qty: {item.quantity}</p>
                    <p className="text-xs font-bold text-[#212121] mt-1">{formatPrice(item.price)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-[#F0F0F0] flex justify-end">
              <Link href={`/orders/${order.orderNumber}`}>
                <Button variant="primary" size="sm" className="text-xs font-semibold">
                  Track &amp; View Details →
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useHydration } from "@/hooks/useHydration";
import { useSellerStore } from "@/store/useSellerStore";
import { sellerNotificationService } from "@/services";
import type { Notification } from "@/types";
import { NotificationList } from "@/components/seller/NotificationList";

export default function SellerNotificationsPage() {
  const isHydrated = useHydration();
  const { seller } = useSellerStore();
  const currentSeller = isHydrated ? seller : null;
  const sellerId = currentSeller?.id || "slr-001";

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const [notifs, count] = await Promise.all([
          sellerNotificationService.getNotifications(sellerId),
          sellerNotificationService.getUnreadCount(sellerId),
        ]);
        if (mounted) {
          setNotifications(notifs);
          setUnreadCount(count);
        }
      } catch {
        // ignore
      } finally {
        if (mounted) setLoading(false);
    }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [sellerId]);

  const handleMarkAsRead = (id: string) => {
    sellerNotificationService.markAsRead(id, sellerId);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, status: "READ" as const } : n))
    );
    setUnreadCount((c) => Math.max(c - 1, 0));
  };

  const handleMarkAllAsRead = async () => {
    await sellerNotificationService.markAllAsRead(sellerId);
    setNotifications((prev) => prev.map((n) => ({ ...n, status: "READ" as const })));
    setUnreadCount(0);
  };

  const handleDelete = (id: string) => {
    sellerNotificationService.deleteNotification(id, sellerId);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-lg font-bold text-[#212121]">Notifications</h1>
        <Link
          href="/seller/dashboard"
          className="text-[11px] font-semibold text-[#2874F0] hover:underline flex items-center gap-1"
        >
          <span>← Back to Dashboard</span>
        </Link>
      </div>

      <NotificationList
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
        onDelete={handleDelete}
      />
    </div>
  );
}

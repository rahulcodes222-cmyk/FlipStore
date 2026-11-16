/**
 * sellerNotificationService — Frontend-only simulated seller notifications.
 */

import { Notification } from "@/types";
import { MOCK_NOTIFICATIONS } from "@/data";

const NOTIFICATION_SESSION_KEY = "my_ecommerce_seller_notifications_v1";

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function getStoredNotifications(sellerId: string): Notification[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(NOTIFICATION_SESSION_KEY);
    const all = raw ? (JSON.parse(raw) as Record<string, Notification[]>) : {};
    return all[sellerId] || MOCK_NOTIFICATIONS[sellerId] || [];
  } catch {
    return MOCK_NOTIFICATIONS[sellerId] || [];
  }
}

function saveStoredNotifications(sellerId: string, notifications: Notification[]) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(NOTIFICATION_SESSION_KEY);
    const all = raw ? (JSON.parse(raw) as Record<string, Notification[]>) : {};
    all[sellerId] = notifications;
    localStorage.setItem(NOTIFICATION_SESSION_KEY, JSON.stringify(all));
  } catch {
    // ignore
  }
}

export const sellerNotificationService = {
  async getNotifications(sellerId: string): Promise<Notification[]> {
    await delay(400);
    return getStoredNotifications(sellerId);
  },

  async getUnreadCount(sellerId: string): Promise<number> {
    await delay(300);
    return getStoredNotifications(sellerId).filter((n) => n.status === "UNREAD").length;
  },

  async markAsRead(notificationId: string, sellerId: string): Promise<void> {
    await delay(300);
    const notifications = getStoredNotifications(sellerId);
    const updated = notifications.map((n) =>
      n.id === notificationId ? { ...n, status: "READ" as const } : n
    );
    saveStoredNotifications(sellerId, updated);
  },

  async markAllAsRead(sellerId: string): Promise<void> {
    await delay(400);
    const notifications = getStoredNotifications(sellerId);
    const updated = notifications.map((n) => ({ ...n, status: "READ" as const }));
    saveStoredNotifications(sellerId, updated);
  },

  async deleteNotification(notificationId: string, sellerId: string): Promise<void> {
    await delay(400);
    const notifications = getStoredNotifications(sellerId);
    const updated = notifications.filter((n) => n.id !== notificationId);
    saveStoredNotifications(sellerId, updated);
  },
};

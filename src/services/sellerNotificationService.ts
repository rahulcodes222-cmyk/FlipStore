import type { Notification } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json?.success === false) {
    throw new Error(json?.message || json?.error?.message || `Request failed (${res.status})`);
  }
  return (json?.data ?? json) as T;
}

function formatTime(value: any): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function mapNotification(n: any): Notification {
  return {
    id: String(n?.id || n?._id || ""),
    type: String(n?.type || "STORE_UPDATE"),
    category: n?.category,
    title: String(n?.title || "Notification"),
    message: String(n?.message || ""),
    time: formatTime(n?.time || n?.createdAt),
    status: (String(n?.status || "UNREAD").toUpperCase() === "READ" ? "READ" : "UNREAD") as any,
    readAt: n?.readAt,
    link: n?.link || undefined,
    metadata: n?.metadata || undefined,
  } as Notification;
}

export const sellerNotificationService = {
  async getNotifications(_sellerId?: string): Promise<Notification[]> {
    const data = await api<any>("/api/v1/notifications?limit=100");
    const rows = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
    return rows.map(mapNotification);
  },

  async getUnreadCount(_sellerId?: string): Promise<number> {
    const res = await fetch(`${API_BASE}/api/v1/notifications?limit=1`, { credentials: "include", headers: { "Content-Type": "application/json" } });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json?.success === false) throw new Error(json?.message || json?.error?.message || "Failed to fetch notifications.");
    const metaUnread = json?.meta?.unreadCount;
    if (typeof metaUnread === "number") return metaUnread;
    const rows = Array.isArray(json?.data) ? json.data : [];
    return rows.filter((n: any) => String(n?.status).toUpperCase() !== "READ").length;
  },

  async markAsRead(notificationId: string, _sellerId?: string): Promise<void> {
    await api<any>(`/api/v1/notifications/${encodeURIComponent(notificationId)}/read`, { method: "PATCH" });
  },

  async markAllAsRead(_sellerId?: string): Promise<void> {
    await api<any>(`/api/v1/notifications/read-all`, { method: "PATCH" });
  },

  async deleteNotification(notificationId: string, _sellerId?: string): Promise<void> {
    await api<any>(`/api/v1/notifications/${encodeURIComponent(notificationId)}`, { method: "DELETE" });
  },
};

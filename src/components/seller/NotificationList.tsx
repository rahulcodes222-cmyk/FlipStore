"use client";

import { useState } from "react";
import { Mail, CheckCircle2, Trash2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Notification } from "@/types";
import { cn } from "@/lib/utils";

const typeIcons: Record<string, React.ReactNode> = {
  NEW_ORDER: <Mail size={16} className="text-[#2874F0]" />,
  LOW_STOCK: <AlertIcon size={16} className="text-[#F9A825]" />,
  PAYMENT_UPDATE: <CheckCircle2 size={16} className="text-[#388E3C]" />,
  RETURN_REQUEST: <Trash2 size={16} className="text-[#E53935]" />,
  PRODUCT_APPROVAL: <CheckCircle2 size={16} className="text-[#388E3C]" />,
  STORE_UPDATE: <Mail size={16} className="text-[#878787]" />,
};

const typeLabels: Record<string, string> = {
  NEW_ORDER: "New Order",
  LOW_STOCK: "Low Stock",
  PAYMENT_UPDATE: "Payment",
  RETURN_REQUEST: "Return",
  PRODUCT_APPROVAL: "Approval",
  STORE_UPDATE: "Store Update",
};

interface NotificationListProps {
  notifications: Notification[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: string) => void;
  className?: string;
}

function AlertIcon({ className, size = 16 }: { className?: string; size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

export function NotificationList({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  className,
}: NotificationListProps) {
  const [allRead, setAllRead] = useState(unreadCount === 0);

  const handleMarkAll = () => {
    onMarkAllAsRead();
    setAllRead(true);
  };

  return (
    <div className={cn("rounded-sm border border-[#E0E0E0] bg-white shadow-sm", className)}>
      <div className="px-4 py-3 border-b border-[#F0F0F0] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-[#212121]">Notifications</span>
          {unreadCount > 0 && (
            <span className="h-5 min-w-5 rounded-full bg-[#FB641B] text-white text-[10px] font-bold px-1.5">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && !allRead && (
            <Button variant="outline" size="sm" onClick={handleMarkAll}>
              Mark all as read
            </Button>
          )}
        </div>
      </div>

      <div className="divide-y divide-[#F0F0F0]">
        {notifications.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-[#878787]">No notifications</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={cn(
                "px-4 py-3.5 flex items-center justify-between group hover:bg-[#F1F3F6] cursor-pointer transition-colors",
                n.status === "UNREAD" ? "bg-[#FFF8E1]/30 border-l-2 border-[#FFE082]" : ""
              )}
              onClick={() => {
                if (n.status === "UNREAD") onMarkAsRead(n.id);
              }}
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-sm bg-[#F9FAFB]">
                  {typeIcons[n.type] || <Mail size={16} className="text-[#878787]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#212121] truncate">
                    {n.title}
                  </p>
                  <p className="text-[10px] text-[#878787] truncate">{n.message}</p>
                </div>
                <ChevronRight size={14} className="text-[#B0B0B0]" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[#B0B0B0]">{n.time}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(n.id);
                  }}
                  className="p-1 text-[#878787] hover:text-[#E53935] hover:bg-red-50 rounded-sm transition-colors"
                  aria-label="Delete notification"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

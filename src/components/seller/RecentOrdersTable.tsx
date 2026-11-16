"use client";

import Link from "next/link";
import type { SellerOrder, OrderPaymentStatus, SellerOrderStatus } from "@/types";
import { cn } from "@/lib/utils";

interface RecentOrdersTableProps {
  orders: SellerOrder[];
  className?: string;
}

const paymentStatusStyles: Record<OrderPaymentStatus, string> = {
  PENDING: "bg-[#FFF8E1] text-[#B26A00]",
  PROCESSING: "bg-[#E3F2FD] text-[#1565C0]",
  PAID: "bg-[#E8F5E9] text-[#2E7D32]",
  FAILED: "bg-[#FFEBEE] text-[#C62828]",
  REFUNDED: "bg-[#F5F5F5] text-[#616161]",
  PARTIALLY_REFUNDED: "bg-[#FFF3E0] text-[#E65100]",
};

const orderStatusStyles: Record<SellerOrderStatus, string> = {
  PENDING: "bg-[#FFF8E1] text-[#B26A00]",
  PLACED: "bg-[#FFF8E1] text-[#B26A00]",
  CONFIRMED: "bg-[#E3F2FD] text-[#1565C0]",
  PROCESSING: "bg-[#FFF3E0] text-[#E65100]",
  PACKED: "bg-[#EDE7F6] text-[#5E35B1]",
  SHIPPED: "bg-[#E8F5E9] text-[#2E7D32]",
  OUT_FOR_DELIVERY: "bg-[#E3F2FD] text-[#1565C0]",
  DELIVERED: "bg-[#E8F5E9] text-[#2E7D32]",
  CANCELLED: "bg-[#FFEBEE] text-[#C62828]",
  RETURN_REQUESTED: "bg-[#FFF3E0] text-[#E65100]",
  RETURNED: "bg-[#F5F5F5] text-[#616161]",
  REFUNDED: "bg-[#F5F5F5] text-[#616161]",
};

function statusChip(status: string) {
  const map: Record<string, string> = {
    ...paymentStatusStyles,
    ...orderStatusStyles,
  };
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold border", map[status] || "bg-[#F5F5F5] text-[#616161] border-[#E0E0E0]")}>
    {status.split(/(?=[A-Z])/).join(" ").replace(/\b\w/g, (c) => c.toUpperCase())}
  </span>;
}

export function RecentOrdersTable({ orders, className }: RecentOrdersTableProps) {
  if (orders.length === 0) {
    return (
      <div className={cn("rounded-sm border border-[#E0E0E0] bg-white p-6 shadow-sm", className)}>
        <div className="text-center py-8">
          <p className="text-sm text-[#878787]">No orders yet.</p>
          <p className="text-xs text-[#B0B0B0] mt-1">Orders will appear here once customers purchase your products.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("rounded-sm border border-[#E0E0E0] bg-white shadow-sm", className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-[#F0F0F0] bg-[#F9FAFB]">
              {[
                "Order ID",
                "Customer",
                "Product",
                "Date",
                "Qty",
                "Amount",
                "Payment",
                "Status",
              ].map((header) => (
                <th
                  key={header}
                  className="px-4 py-3 text-left text-[10px] font-bold text-[#878787] uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0F0F0]">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-[#F1F3F6] transition-colors">
                <td className="px-4 py-3">
                  <div className="text-[#212121] font-medium text-sm">{order.orderNumber}</div>
                  <div className="text-[10px] text-[#878787]">{order.id}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    {order.customerAvatar ? (
                      <img src={order.customerAvatar} alt="" className="w-7 h-7 rounded-full object-cover border border-[#E0E0E0]" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-[#F1F3F6] flex items-center justify-center text-[10px] font-bold text-[#878787]">
                        {order.customerName.charAt(0)}
                      </div>
                    )}
                    <div className="text-sm font-medium text-[#212121]">{order.customerName}</div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    {order.productImage ? (
                      <img src={order.productImage} alt="" className="w-7 h-7 rounded-sm object-cover border border-[#E0E0E0]" />
                    ) : (
                      <div className="w-7 h-7 rounded-sm bg-[#F1F3F6] flex items-center justify-center text-[10px] font-bold text-[#878787]">
                        {order.productName.charAt(0)}
                      </div>
                    )}
                    <div className="text-sm font-medium text-[#212121] truncate max-w-[120px]">{order.productName}</div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-[#212121]">
                  {new Date(order.orderDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </td>
                <td className="px-4 py-3 text-sm text-[#212121] font-medium">{order.quantity}</td>
                <td className="px-4 py-3 text-sm font-medium text-[#212121]">₹{order.totalAmount.toLocaleString("en-IN")}</td>
                <td className="px-4 py-3">{statusChip(order.paymentStatus)}</td>
                <td className="px-4 py-3">{statusChip(order.orderStatus)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t border-[#F0F0F0] p-3 bg-[#F9FAFB]">
        <Link
          href="/seller/orders"
          className="inline-flex items-center gap-1.5 text-sm text-[#2874F0] font-semibold hover:underline"
        >
          View All Orders <span>→</span>
        </Link>
      </div>
    </div>
  );
}

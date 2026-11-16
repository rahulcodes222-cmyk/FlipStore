"use client";

import Link from "next/link";
import type { SellerCoupon, CouponStatus } from "@/types";
import { cn } from "@/lib/utils";

const COUPON_STATUS_CONFIG: Record<CouponStatus, string> = {
  ACTIVE: "bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]",
  EXPIRED: "bg-[#FFEBEE] text-[#C62828] border-[#FFCDD2]",
  DISABLED: "bg-[#F5F5F5] text-[#616161] border-[#E0E0E0]",
  DRAFT: "bg-[#FFF8E1] text-[#B26A00] border-[#FFE082]",
};

interface CouponTableProps {
  coupons: SellerCoupon[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit?: (id: string) => void;
  className?: string;
}

export function CouponTable({
  coupons,
  onToggle,
  onDelete,
  onEdit,
  className,
}: CouponTableProps) {
  if (coupons.length === 0) {
    return (
      <div className={cn("rounded-sm border border-[#E0E0E0] bg-white p-8 shadow-sm", className)}>
        <div className="text-center">
          <p className="text-sm text-[#878787]">No coupons found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("rounded-sm border border-[#E0E0E0] bg-white shadow-sm", className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead className="border-b border-[#F0F0F0] bg-[#F9FAFB]">
            <tr>
              <th className="px-4 py-3 text-left text-[10px] font-bold text-[#878787] uppercase">Coupon Code</th>
              <th className="px-4 py-3 text-left text-[10px] font-bold text-[#878787] uppercase">Discount</th>
              <th className="px-4 py-3 text-left text-[10px] font-bold text-[#878787] uppercase">Min Order</th>
              <th className="px-4 py-3 text-left text-[10px] font-bold text-[#878787] uppercase">Max Discount</th>
              <th className="px-4 py-3 text-left text-[10px] font-bold text-[#878787] uppercase">Usage</th>
              <th className="px-4 py-3 text-left text-[10px] font-bold text-[#878787] uppercase">Expiry</th>
              <th className="px-4 py-3 text-left text-[10px] font-bold text-[#878787] uppercase">Status</th>
              <th className="px-4 py-3 text-left text-[10px] font-bold text-[#878787] uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0F0F0]">
            {coupons.map((coupon) => (
              <tr key={coupon.id} className="hover:bg-[#F1F3F6] transition-colors">
                <td className="px-4 py-3">
                  <div className="text-sm font-medium text-[#212121]">{coupon.code}</div>
                  <div className="text-[10px] text-[#878787]">{coupon.id}</div>
                </td>
                <td className="px-4 py-3 text-sm text-[#212121]">
                  {coupon.discountType === "PERCENTAGE"
                    ? `${coupon.discountValue}%`
                    : `₹${coupon.discountValue}`}
                </td>
                <td className="px-4 py-3 text-sm text-[#212121]">
                  ₹{coupon.minOrderValue.toLocaleString("en-IN")}
                </td>
                <td className="px-4 py-3 text-sm text-[#212121]">
                  {coupon.maxDiscount ? `₹${coupon.maxDiscount.toLocaleString("en-IN")}` : "None"}
                </td>
                <td className="px-4 py-3 text-sm text-[#212121]">
                  {coupon.usedCount}/{coupon.usageLimit}
                </td>
                <td className="px-4 py-3 text-sm text-[#212121]">
                  {new Date(coupon.expiryDate).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold border",
                      COUPON_STATUS_CONFIG[coupon.status]
                    )}
                  >
                    {coupon.status.charAt(0) + coupon.status.slice(1).toLowerCase()}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => onToggle(coupon.id)}
                      className={cn(
                        "p-1.5 text-xs font-medium rounded-sm transition-colors",
                        coupon.status === "ACTIVE"
                          ? "text-[#E53935] hover:bg-[#FFEBEE]"
                          : "text-[#2874F0] hover:bg-[#2874F0]/10"
                      )}
                    >
                      {coupon.status === "ACTIVE" ? "Disable" : "Enable"}
                    </button>
                    {onEdit && (
                      <Link
                        href={`/seller/coupons/${coupon.id}/edit`}
                        className="p-1.5 text-[#878787] hover:text-[#2874F0] hover:bg-[#F1F3F6] rounded-sm transition-colors"
                        title="Edit"
                      >
                        <span className="text-[10px]">Edit</span>
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => onDelete(coupon.id)}
                      className="p-1.5 text-[#878787] hover:text-[#E53935] hover:bg-[#FFEBEE] rounded-sm transition-colors"
                      title="Delete"
                    >
                      <span className="text-[10px]">Delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

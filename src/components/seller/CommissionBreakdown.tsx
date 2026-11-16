"use client";

import { cn } from "@/lib/utils";
import type { CommissionBreakdown } from "@/data/sellerFinancial";

interface CommissionBreakdownProps {
  breakdown: CommissionBreakdown;
  className?: string;
}

export function CommissionBreakdown({ breakdown, className }: CommissionBreakdownProps) {
  return (
    <div className={cn("rounded-sm border border-[#E0E0E0] bg-white p-5 shadow-sm", className)}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm font-bold text-[#212121] flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2874F0]" />
          Commission Breakdown
        </span>
      </div>
      <div className="space-y-3">
        {[
          { label: "Selling Price", value: breakdown.sellingPrice, key: "sellingPrice" },
          { label: "Platform Commission", value: breakdown.commissionAmount, key: "commissionAmount", negative: true },
          { label: "Applicable Charges", value: breakdown.applicableCharges, key: "applicableCharges", negative: true },
          { label: "Refund Deductions", value: breakdown.refundDeductions, key: "refundDeductions", negative: true },
          { label: "Seller Net Amount", value: breakdown.sellerNetAmount, key: "sellerNetAmount", highlight: true },
        ].map((item) => (
          <div
            key={item.key}
            className={cn(
              "flex justify-between items-center px-3 py-2.5 rounded-sm border border-[#E0E0E0]",
              item.highlight ? "bg-[#2874F0]/5 border-[#2874F0]" : "bg-[#F9FAFB]"
            )}
          >
            <span className={cn("text-sm", item.highlight ? "font-bold text-[#2874F0]" : "text-[#878787]")}>
              {item.label}
            </span>
            <span
              className={cn(
                "text-sm font-medium",
                item.negative ? "text-[#E53935]" : item.highlight ? "text-[#2874F0]" : "text-[#212121]"
              )}
            >
              {item.negative ? "-" : ""}₹{item.value.toLocaleString("en-IN")}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t border-[#F0F0F0] flex justify-between items-center">
        <span className="text-xs text-[#878787]">Commission Rate</span>
        <span className="text-sm font-bold text-[#212121]">{breakdown.commissionPercentage}%</span>
      </div>
    </div>
  );
}

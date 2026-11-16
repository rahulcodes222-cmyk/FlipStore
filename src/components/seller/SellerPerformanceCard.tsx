"use client";

import type { SellerPerformance } from "@/types";
import { cn } from "@/lib/utils";

interface SellerPerformanceCardProps {
  performance: SellerPerformance;
  className?: string;
}

export function SellerPerformanceCard({ performance, className }: SellerPerformanceCardProps) {
  const metrics = [
    { label: "Store Rating", value: performance.storeRating.toFixed(1), suffix: "/5", variant: "rating" },
    { label: "Avg. Customer Rating", value: performance.averageCustomerRating.toFixed(1), suffix: "/5", variant: "rating" },
    { label: "Cancellation Rate", value: performance.orderCancellationRate.toFixed(1), suffix: "%", variant: "warning" },
    { label: "Return Rate", value: performance.returnRate.toFixed(1), suffix: "%", variant: "warning" },
    { label: "On-Time Dispatch", value: performance.onTimeDispatchRate.toFixed(1), suffix: "%", variant: "success" },
    { label: "Product Approval", value: performance.productApprovalRate.toFixed(1), suffix: "%", variant: "success" },
    { label: "Customer Satisfaction", value: performance.customerSatisfaction.toFixed(1), suffix: "/5", variant: "rating" },
  ];

  return (
    <div className={cn("rounded-sm border border-[#E0E0E0] bg-white p-5 shadow-sm", className)}>
      <h3 className="text-xs font-bold text-[#878787] uppercase tracking-wider mb-4">
        Seller Performance
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="rounded-sm border border-[#E0E0E0] bg-[#F9FAFB] p-3"
          >
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-sm font-bold text-[#212121]">{m.value}</span>
              <span className="text-[10px] text-[#878787]">{m.suffix}</span>
            </div>
            <p className="text-[10px] text-[#878787]">{m.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

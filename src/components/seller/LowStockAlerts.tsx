"use client";

import Link from "next/link";
import type { LowStockProduct } from "@/types";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface LowStockAlertsProps {
  products: LowStockProduct[];
  className?: string;
}

export function LowStockAlerts({ products, className }: LowStockAlertsProps) {
  if (products.length === 0) {
    return (
      <div className={cn("rounded-sm border border-[#E0E0E0] bg-white p-6 shadow-sm", className)}>
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-[#212121]">All products are well stocked.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("rounded-sm border border-[#E0E0E0] bg-white shadow-sm", className)}>
      <div className="px-4 py-3 border-b border-[#F0F0F0] flex items-center justify-between">
        <h3 className="text-sm font-bold text-[#212121] flex items-center gap-2">
          <AlertTriangle size={16} className="text-[#F9A825]" />
          Low Stock Alerts
        </h3>
        <Link
          href="/seller/inventory"
          className="text-[11px] font-semibold text-[#2874F0] hover:underline"
        >
          View Inventory
        </Link>
      </div>
      <div className="divide-y divide-[#F0F0F0]">
        {products.map((product) => (
          <div key={product.id} className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-sm overflow-hidden border border-[#E0E0E0] flex-shrink-0">
                <img src={product.image} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#212121] truncate">{product.name}</p>
                <p className="text-[10px] text-[#878787]">
                  {product.stock} left (threshold: {product.threshold})
                </p>
              </div>
            </div>
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold text-[#C62828] bg-[#FFEBEE] border border-[#FFCDD2]">
              Low Stock
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

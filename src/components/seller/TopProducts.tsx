"use client";

import type { TopProduct } from "@/types";
import { SellerStatusBadge } from "./SellerStatusBadge";
import { cn } from "@/lib/utils";

interface TopProductsProps {
  products: TopProduct[];
  className?: string;
}

export function TopProducts({ products, className }: TopProductsProps) {
  if (products.length === 0) {
    return (
      <div className={cn("rounded-sm border border-[#E0E0E0] bg-white p-6 shadow-sm", className)}>
        <p className="text-sm text-[#878787] text-center">No products listed yet.</p>
      </div>
    );
  }

  return (
    <div className={cn("rounded-sm border border-[#E0E0E0] bg-white shadow-sm", className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-[#F0F0F0] bg-[#F9FAFB]">
              {["Product", "Units Sold", "Revenue", "Stock", "Status"].map(
                (header) => (
                  <th
                    key={header}
                    className="px-4 py-3 text-left text-[10px] font-bold text-[#878787] uppercase tracking-wider"
                  >
                    {header}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0F0F0]">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-[#F1F3F6] transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-sm overflow-hidden border border-[#E0E0E0] flex-shrink-0">
                      <img src={product.image} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="text-sm font-medium text-[#212121] truncate max-w-[140px]">
                      {product.name}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-[#212121] font-medium">
                  {product.unitsSold}
                </td>
                <td className="px-4 py-3 text-sm font-medium text-[#212121]">
                  ₹{product.revenue.toLocaleString("en-IN")}
                </td>
                <td className="px-4 py-3 text-sm text-[#212121]">{product.stock}</td>
                <td className="px-4 py-3">
                  <SellerStatusBadge
                    status={product.inStock ? "VERIFIED" : "REJECTED"}
                    size="sm"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

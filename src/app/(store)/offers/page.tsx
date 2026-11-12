import React from "react";
import { productService } from "@/services/productService";
import { ProductCard } from "@/components/common/ProductCard";
import { Flame } from "lucide-react";

export default async function OffersPage() {
  const deals = await productService.getDealsOfTheDay(12);

  return (
    <div className="max-w-[1280px] mx-auto px-3 sm:px-4 py-6">
      <div className="bg-gradient-to-r from-[#172337] to-[#2874F0] text-white rounded-sm p-6 mb-6 shadow-sm flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-[#ffe500] font-bold text-xs uppercase tracking-wider mb-1">
            <Flame size={16} /> Flash Deals &amp; Discounts
          </div>
          <h1 className="text-xl sm:text-2xl font-black">Today&apos;s Top Offers &amp; Steal Deals</h1>
          <p className="text-xs sm:text-sm text-blue-100 mt-1">Up to 75% off on trending electronics and fashion</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
        {deals.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}

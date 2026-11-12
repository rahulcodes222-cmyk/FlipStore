import React from "react";
import { CheckCircle2, ShieldCheck, Truck, RefreshCw, Award } from "lucide-react";

interface ProductHighlightsProps {
  highlights?: string[];
  isAssured?: boolean;
  warranty?: string;
  sellerName?: string;
  sellerRating?: number;
}

export function ProductHighlights({
  highlights = [],
  isAssured = false,
  warranty = "1 Year Brand Warranty",
  sellerName,
  sellerRating = 4.8,
}: ProductHighlightsProps) {
  return (
    <div className="space-y-4">
      {/* Key Feature Bullets */}
      {highlights.length > 0 && (
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#878787] mb-2">
            Product Highlights
          </h3>
          <ul className="space-y-2 text-xs sm:text-sm text-[#212121]">
            {highlights.map((h, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle2 size={15} className="text-[#2874F0] mt-0.5 shrink-0" />
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Trust & Guarantee Badges Grid */}
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#F0F0F0] text-center">
        <div className="p-2.5 bg-[#F9FAFB] rounded-xs border border-gray-100">
          <Truck size={18} className="text-[#2874F0] mx-auto mb-1" />
          <p className="text-[11px] font-semibold text-[#212121]">Free Express Delivery</p>
          <p className="text-[10px] text-[#878787]">Across India</p>
        </div>

        <div className="p-2.5 bg-[#F9FAFB] rounded-xs border border-gray-100">
          <RefreshCw size={18} className="text-[#388E3C] mx-auto mb-1" />
          <p className="text-[11px] font-semibold text-[#212121]">7 Days Replacement</p>
          <p className="text-[10px] text-[#878787]">Hassle-free pickups</p>
        </div>

        <div className="p-2.5 bg-[#F9FAFB] rounded-xs border border-gray-100">
          <ShieldCheck size={18} className="text-[#FB641B] mx-auto mb-1" />
          <p className="text-[11px] font-semibold text-[#212121]">{warranty}</p>
          <p className="text-[10px] text-[#878787]">Brand Authorized</p>
        </div>
      </div>

      {/* Verified Seller Info */}
      {sellerName && (
        <div className="pt-3 border-t border-[#F0F0F0] flex items-center justify-between text-xs text-[#878787]">
          <div className="flex items-center gap-1.5">
            <Award size={15} className="text-[#2874F0]" />
            <span>
              Sold by: <span className="font-semibold text-[#212121]">{sellerName}</span>
            </span>
            {isAssured && (
              <span className="bg-blue-50 text-[#2874F0] text-[10px] font-bold px-1.5 py-0.2 rounded-xs">
                ✦ Assured
              </span>
            )}
          </div>
          <span className="bg-[#E8F5E9] text-[#388E3C] font-bold px-1.5 py-0.5 rounded-xs text-[11px]">
            ★ {sellerRating} / 5
          </span>
        </div>
      )}
    </div>
  );
}

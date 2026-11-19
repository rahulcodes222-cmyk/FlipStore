"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Timer, ArrowRight, Flame } from "lucide-react";
import { Product } from "@/types";
import { ProductCard } from "@/components/common/ProductCard";

export interface DealsSectionProps {
  products: Product[];
  title?: string;
  subtitle?: string;
  viewAllHref?: string;
}

export function DealsSection({
  products,
  title = "Deals of the Day",
  subtitle = "Lowest prices guaranteed on top-rated brands",
  viewAllHref = "/offers",
}: DealsSectionProps) {
  // Mock countdown timer for urgency (14h 25m 40s)
  const [timeLeft, setTimeLeft] = useState({ hours: 14, minutes: 25, seconds: 40 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 23, minutes: 59, seconds: 59 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatUnit = (n: number) => n.toString().padStart(2, "0");

  return (
    <section className="w-full bg-white border border-[#E0E0E0] rounded-sm p-4 sm:p-5 shadow-2xs mb-6">
      {/* Header with Title & Live Timer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-[#F0F0F0] gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-full bg-[#FFF3ED] text-[#FB641B]">
              <Flame size={20} className="animate-pulse" />
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-[#212121] tracking-tight">
              {title}
            </h2>
          </div>
          <p className="text-xs text-[#878787] mt-0.5">{subtitle}</p>
        </div>

        {/* Live Urgency Countdown Timer */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#878787]">
            <Timer size={16} className="text-[#2874F0]" />
            <span className="hidden sm:inline">Ends in:</span>
            <div className="flex items-center gap-1 font-mono text-xs font-bold text-white">
              <span className="bg-[#172337] px-1.5 py-0.5 rounded-xs">
                {formatUnit(timeLeft.hours)}h
              </span>
              <span className="text-[#172337]">:</span>
              <span className="bg-[#172337] px-1.5 py-0.5 rounded-xs">
                {formatUnit(timeLeft.minutes)}m
              </span>
              <span className="text-[#172337]">:</span>
              <span className="bg-[#FB641B] px-1.5 py-0.5 rounded-xs">
                {formatUnit(timeLeft.seconds)}s
              </span>
            </div>
          </div>

          {/* View All Button */}
          <Link
            href={viewAllHref}
            className="inline-flex items-center gap-1 bg-[#2874F0] hover:bg-[#1259c7] text-white text-xs font-bold px-3.5 py-1.5 rounded-xs shadow-2xs transition-colors shrink-0"
          >
            <span>VIEW ALL</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      {/* Responsive Product Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-2.5">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

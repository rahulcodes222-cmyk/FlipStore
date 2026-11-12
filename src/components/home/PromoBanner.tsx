import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Banner } from "@/types";
import { cn } from "@/lib/utils";

export interface PromoBannerProps {
  banner: Banner;
  className?: string;
}

export function PromoBanner({ banner, className }: PromoBannerProps) {
  return (
    <div
      className={cn(
        "relative w-full rounded-sm overflow-hidden bg-[#172337] border border-[#E0E0E0] shadow-xs mb-6 group",
        className
      )}
    >
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src={banner.imageUrl}
          alt={banner.title}
          fill
          sizes="(max-width: 768px) 100vw, 1200px"
          className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/20 sm:from-black/80 sm:via-black/40 sm:to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 p-6 sm:p-10 max-w-xl text-white">
        {banner.discountText && (
          <div className="inline-flex items-center gap-1.5 bg-[#ffe500] text-[#172337] text-xs font-black uppercase px-2.5 py-0.5 rounded-full mb-2.5 tracking-wider">
            <Sparkles size={12} />
            <span>{banner.discountText}</span>
          </div>
        )}

        <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold leading-tight tracking-tight mb-2">
          {banner.title}
        </h3>

        {banner.description && (
          <p className="text-xs sm:text-sm text-gray-200 line-clamp-2 mb-4 leading-relaxed">
            {banner.description}
          </p>
        )}

        <Link
          href={banner.targetUrl}
          className="inline-flex items-center gap-2 bg-[#2874F0] hover:bg-[#1259c7] text-white text-xs sm:text-sm font-bold px-5 py-2.5 rounded-xs shadow-md transition-all active:scale-95"
        >
          <span>{banner.ctaText || "Explore Collection"}</span>
          <ArrowRight size={15} />
        </Link>
      </div>
    </div>
  );
}

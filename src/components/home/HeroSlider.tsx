"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight } from "lucide-react";
import { Banner } from "@/types";
import { cn } from "@/lib/utils";

export interface HeroSliderProps {
  banners: Banner[];
  autoSlideInterval?: number;
}

export function HeroSlider({
  banners,
  autoSlideInterval = 5000,
}: HeroSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const heroBanners = banners.filter((b) => b.position === "hero" && b.isActive);
  const total = heroBanners.length;

  const nextSlide = useCallback(() => {
    if (total === 0) return;
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total]);

  const prevSlide = useCallback(() => {
    if (total === 0) return;
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  // Auto sliding
  useEffect(() => {
    if (isPaused || total <= 1) return;
    const interval = setInterval(() => {
      nextSlide();
    }, autoSlideInterval);
    return () => clearInterval(interval);
  }, [isPaused, total, nextSlide, autoSlideInterval]);

  // Touch swipe support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    if (deltaX > 50) {
      prevSlide();
    } else if (deltaX < -50) {
      nextSlide();
    }
    touchStartX.current = null;
  };

  if (total === 0) return null;

  return (
    <div
      className="relative w-full overflow-hidden bg-[#172337] shadow-sm select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-roledescription="carousel"
      aria-label="Promotional Hero Carousel"
    >
      {/* Slider Viewport */}
      <div className="relative w-full h-[240px] sm:h-[320px] md:h-[400px] lg:h-[440px]">
        {heroBanners.map((banner, index) => {
          const isActive = index === currentIndex;

          return (
            <div
              key={banner.id}
              className={cn(
                "absolute inset-0 transition-opacity duration-700 ease-in-out",
                isActive ? "opacity-100 z-10 pointer-events-auto" : "opacity-0 z-0 pointer-events-none"
              )}
              aria-hidden={!isActive}
            >
              {/* Background Backdrop Image with Overlay */}
              <div className="absolute inset-0">
                <Image
                  src={banner.imageUrl || "/placeholder-product.svg"}
                  alt={banner.title}
                  fill
                  priority={index === 0}
                  sizes="100vw"
                  className="object-cover object-center"
                />
                {/* Gradient vignette for text legibility */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-transparent sm:from-black/80 sm:via-black/40" />
              </div>

              {/* Foreground Banner Content */}
              <div className="relative h-full max-w-[1280px] mx-auto px-4 sm:px-8 flex flex-col justify-center items-start text-white z-10">
                <div className="max-w-lg space-y-2 sm:space-y-3">
                  {/* Badge & Discount Tag */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {banner.badgeText && (
                      <span className="inline-flex items-center gap-1 bg-[#ffe500] text-[#172337] text-[10px] sm:text-xs font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider shadow-sm">
                        <Sparkles size={11} /> {banner.badgeText}
                      </span>
                    )}
                    {banner.discountText && (
                      <span className="bg-[#FB641B] text-white text-[10px] sm:text-xs font-bold uppercase px-2.5 py-0.5 rounded-full tracking-wider shadow-sm">
                        {banner.discountText}
                      </span>
                    )}
                  </div>

                  {/* Headline */}
                  <h2 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-black leading-tight tracking-tight drop-shadow-sm">
                    {banner.title}
                  </h2>

                  {/* Subtitle / Description */}
                  <p className="text-xs sm:text-base text-gray-200 line-clamp-2 max-w-md font-medium">
                    {banner.description || banner.subtitle}
                  </p>

                  {/* Shop Now Action */}
                  <div className="pt-2 sm:pt-3">
                    <Link
                      href={banner.targetUrl}
                      className="inline-flex items-center gap-2 bg-[#FB641B] hover:bg-[#e04e05] text-white text-xs sm:text-sm font-bold px-5 sm:px-7 py-2.5 sm:py-3 rounded-xs shadow-md hover:shadow-lg transition-all transform active:scale-95 min-h-[44px]"
                    >
                      <span>{banner.ctaText || "Shop Now"}</span>
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Manual Left/Right Arrow Controls */}
      {total > 1 && (
        <>
          <button
            type="button"
            onClick={prevSlide}
            className="group absolute left-0 sm:left-0 top-1/2 -translate-y-1/2 z-20 h-14 w-8 sm:h-24 sm:w-11 flex items-center justify-center bg-black/30 hover:bg-black/50 text-white rounded-r-md sm:rounded-r-lg shadow-[0_2px_8px_rgba(0,0,0,0.18)] border border-l-0 border-white/20 transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.22)] active:scale-95 cursor-pointer"
            aria-label="Previous slide"
          >
            <ChevronLeft size={22} className="sm:w-6 sm:h-6" />
          </button>

          <button
            type="button"
            onClick={nextSlide}
            className="group absolute right-0 sm:right-0 top-1/2 -translate-y-1/2 z-20 h-14 w-8 sm:h-24 sm:w-11 flex items-center justify-center bg-black/30 hover:bg-black/50 text-white rounded-l-md sm:rounded-l-lg shadow-[0_2px_8px_rgba(0,0,0,0.18)] border border-r-0 border-white/20 transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.22)] active:scale-95 cursor-pointer"
            aria-label="Next slide"
          >
            <ChevronRight size={22} className="sm:w-6 sm:h-6" />
          </button>
        </>
      )}

      {/* Slide Indicator Dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {heroBanners.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={cn(
              "h-2 rounded-full transition-all duration-300 cursor-pointer",
              idx === currentIndex ? "w-6 bg-[#ffe500]" : "w-2 bg-white/60 hover:bg-white"
            )}
            aria-label={`Go to slide ${idx + 1}`}
            aria-current={idx === currentIndex ? "true" : undefined}
          />
        ))}
      </div>
    </div>
  );
}

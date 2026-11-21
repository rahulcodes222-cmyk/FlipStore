"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Laptop,
  Smartphone,
  Shirt,
  Home,
  Tv,
  Sparkles,
  ShoppingBag,
  Baby,
  Flame,
  Package,
  Grid,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { categoryService } from "@/services/categoryService";
import { Category } from "@/types";

const ICON_MAP: Record<string, any> = {
  all: Grid,
  electronics: Laptop,
  mobiles: Smartphone,
  fashion: Shirt,
  "home-furniture": Home,
  appliances: Tv,
  beauty: Sparkles,
  grocery: ShoppingBag,
  "toys-baby": Baby,
};

function getIconForCategory(slug: string) {
  return ICON_MAP[slug] || Package;
}

interface NavCategory {
  label: string;
  slug: string;
  Icon: any;
}

function toNavCategory(cat: Category): NavCategory {
  return {
    label: cat.name,
    slug: cat.slug,
    Icon: getIconForCategory(cat.slug),
  };
}

export const CATEGORIES_NAV_ITEMS: NavCategory[] = [
  { label: "For You", slug: "all", Icon: Grid },
  { label: "Electronics", slug: "electronics", Icon: Laptop },
  { label: "Mobiles", slug: "mobiles", Icon: Smartphone },
  { label: "Fashion", slug: "fashion", Icon: Shirt },
  { label: "Home & Furniture", slug: "home-furniture", Icon: Home },
  { label: "Appliances", slug: "appliances", Icon: Tv },
  { label: "Beauty", slug: "beauty", Icon: Sparkles },
  { label: "Grocery", slug: "grocery", Icon: ShoppingBag },
  { label: "Toys & Baby", slug: "toys-baby", Icon: Baby },
];

export interface CategoryNavigationProps {
  variant?: "desktop" | "mobile" | "both";
  className?: string;
}

export function CategoryNavigation({
  variant = "both",
  className,
}: CategoryNavigationProps) {
  const pathname = usePathname();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    categoryService
      .getCategories()
      .then((list) => {
        if (!cancelled) {
          setCategories(list);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const navCategories: NavCategory[] = categories.length > 0
    ? [
        { label: "For You", slug: "all", Icon: Grid },
        ...categories.map(toNavCategory),
      ]
    : CATEGORIES_NAV_ITEMS;

  return (
    <>
      {/* 1. Desktop Category Bar (Dark Navy, high contrast Flipkart sub-header) */}
      {(variant === "desktop" || variant === "both") && (
        <div
          className={cn(
            "hidden md:block bg-[#172337] border-b border-[#21314d] text-white select-none",
            className
          )}
        >
          <div className="max-w-[1280px] mx-auto px-4">
            <nav aria-label="Desktop Categories">
              <ul className="flex items-center gap-3 overflow-x-auto scrollbar-none pb-1">
                {navCategories.map((cat) => {
                  const isActive =
                    cat.slug === "all"
                      ? pathname === "/" || pathname === "/category/all"
                      : pathname === `/category/${cat.slug}`;

                  return (
                    <li key={cat.slug}>
                      <Link
                        href={`/category/${cat.slug}`}
                        className={cn(
                          "group flex items-center gap-2 px-3 py-2.5 text-xs font-medium transition-all duration-150 relative",
                          isActive
                            ? "text-[#ffe500] font-bold"
                            : "text-gray-200 hover:text-white hover:bg-[#21314d]"
                        )}
                      >
                        <cat.Icon
                          size={15}
                          className={cn(
                            "transition-transform duration-200 group-hover:scale-110",
                            isActive ? "text-[#ffe500]" : "text-blue-300"
                          )}
                        />
                        <span className="whitespace-nowrap tracking-wide">{cat.label}</span>
                        {isActive && (
                          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ffe500]" />
                        )}
                      </Link>
                    </li>
                  );
                })}

                {/* Special Highlight: Top Offers */}
                <li>
                  <Link
                    href="/offers"
                    className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-bold text-[#ffe500] hover:bg-[#21314d] transition-colors whitespace-nowrap"
                  >
                    <Flame size={15} className="text-[#FB641B] animate-pulse" />
                    <span>Top Offers</span>
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      )}

      {/* 2. Mobile Horizontally Scrollable Categories Bar */}
      {(variant === "mobile" || variant === "both") && (
        <div
          className={cn(
            "md:hidden bg-white border-b border-[#E0E0E0] shadow-2xs overflow-x-auto scrollbar-none",
            className
          )}
        >
          <div className="px-3 py-2 flex items-center gap-2 min-w-max">
            {navCategories.map((cat) => {
              const isActive = pathname === `/category/${cat.slug}`;

              return (
                <Link
                  key={cat.slug}
                  href={`/category/${cat.slug}`}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 border",
                    isActive
                      ? "bg-[#2874F0] text-white border-[#2874F0] shadow-2xs"
                      : "bg-[#F1F3F6] text-[#212121] border-transparent hover:bg-gray-200 active:scale-95"
                  )}
                >
                  <cat.Icon size={13} className={isActive ? "text-white" : "text-[#2874F0]"} />
                  <span className="whitespace-nowrap">{cat.label}</span>
                </Link>
              );
            })}

            {/* Mobile Top Offers Chip */}
            <Link
              href="/offers"
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-[#FFF3ED] text-[#FB641B] border border-[#FB641B]/30 shrink-0"
            >
              <Flame size={13} className="text-[#FB641B]" />
              <span>Offers</span>
            </Link>
          </div>
        </div>
      )}
    </>
  );
}

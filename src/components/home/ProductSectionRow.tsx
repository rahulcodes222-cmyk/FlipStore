import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Product } from "@/types";
import { ProductCard } from "@/components/common/ProductCard";
import { cn } from "@/lib/utils";

export interface ProductSectionRowProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  products: Product[];
  viewAllHref?: string;
  className?: string;
}

export function ProductSectionRow({
  title,
  subtitle,
  icon,
  products,
  viewAllHref = "/search",
  className,
}: ProductSectionRowProps) {
  if (!products || products.length === 0) return null;

  return (
    <section
      className={cn(
        "w-full bg-white border border-[#E0E0E0] rounded-sm p-4 sm:p-5 shadow-2xs mb-6",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-[#F0F0F0]">
        <div className="flex items-center gap-2.5">
          {icon && <div className="shrink-0">{icon}</div>}
          <div>
            <h2 className="text-base sm:text-xl font-bold text-[#212121] tracking-tight">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs text-[#878787] mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>

        {/* View All */}
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-[#2874F0] hover:text-[#1259c7] transition-colors shrink-0"
          >
            <span>View All</span>
            <ArrowRight size={14} />
          </Link>
        )}
      </div>

      {/* Responsive Grid: 2 mobile, 3 tablet, 4-5 desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-2.5">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

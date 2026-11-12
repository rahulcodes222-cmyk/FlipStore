import React from "react";
import { cn } from "@/lib/utils";
import { formatPrice, calculateDiscount, calculateSavings } from "@/utils/formatters";

export interface PriceDisplayProps {
  price: number;
  mrp?: number;
  discountPercentage?: number;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  showSavings?: boolean;
  showEmi?: boolean;
  className?: string;
}

export function PriceDisplay({
  price,
  mrp,
  discountPercentage,
  size = "md",
  showSavings = false,
  showEmi = false,
  className,
}: PriceDisplayProps) {
  // Compute discount if not explicitly passed
  const discount = discountPercentage ?? (mrp ? calculateDiscount(mrp, price) : 0);
  const savings = mrp ? calculateSavings(mrp, price) : 0;
  const hasDiscount = mrp !== undefined && mrp > price && discount > 0;

  // Typographic scales
  const sizeStyles = {
    sm: {
      price: "text-sm font-semibold",
      mrp: "text-xs",
      discount: "text-xs",
    },
    md: {
      price: "text-base font-bold",
      mrp: "text-xs",
      discount: "text-xs",
    },
    lg: {
      price: "text-xl font-bold",
      mrp: "text-sm",
      discount: "text-sm",
    },
    xl: {
      price: "text-2xl font-bold",
      mrp: "text-base",
      discount: "text-base",
    },
    "2xl": {
      price: "text-3xl font-extrabold",
      mrp: "text-lg",
      discount: "text-lg",
    },
  };

  const currentSize = sizeStyles[size];

  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <div className="flex items-baseline flex-wrap gap-2">
        {/* Main Selling Price */}
        <span className={cn("text-[#212121] tracking-tight", currentSize.price)}>
          {formatPrice(price)}
        </span>

        {/* MRP Strikethrough */}
        {hasDiscount && (
          <span className={cn("text-[#878787] line-through font-normal", currentSize.mrp)}>
            {formatPrice(mrp)}
          </span>
        )}

        {/* Discount Percentage Callout in Flipkart Green */}
        {hasDiscount && (
          <span className={cn("text-[#388E3C] font-semibold", currentSize.discount)}>
            {discount}% off
          </span>
        )}
      </div>

      {/* Optional Savings Callout */}
      {showSavings && hasDiscount && savings > 0 && (
        <span className="text-xs font-medium text-[#388E3C]">
          You save {formatPrice(savings)}
        </span>
      )}

      {/* Optional EMI estimate (for high-value products) */}
      {showEmi && price >= 3000 && (
        <span className="text-[11px] text-[#878787]">
          No Cost EMI from {formatPrice(Math.round(price / 12))}/month
        </span>
      )}
    </div>
  );
}

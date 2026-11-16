"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingCart, Check } from "lucide-react";
import { Product } from "@/types";
import { PriceDisplay } from "@/components/common/PriceDisplay";
import { RatingStars } from "@/components/common/RatingStars";
import { Badge } from "@/components/ui/badge";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useCartStore } from "@/store/useCartStore";
import { cn } from "@/lib/utils";

export interface ProductCardProps {
  product: Product;
  variant?: "vertical" | "horizontal" | "compact";
  showQuickAdd?: boolean;
  className?: string;
}

export function ProductCard({
  product,
  variant = "vertical",
  showQuickAdd = true,
  className,
}: ProductCardProps) {
  const isInWishlist = useWishlistStore((state) => state.isInWishlist(product.id));
  const toggleWishlist = useWishlistStore((state) => state.toggleItem);
  const addItemToCart = useCartStore((state) => state.addItem);
  const isInCart = useCartStore((state) =>
    state.items.some((i) => i.productId === product.id)
  );

  const [addedAnimation, setAddedAnimation] = React.useState(false);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItemToCart(product, 1);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1500);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  // Horizontal variant (ideal for search listings or cart suggestions)
  if (variant === "horizontal") {
    return (
      <div
        className={cn(
          "group relative flex flex-col sm:flex-row gap-4 p-4 bg-white border border-[#E0E0E0] rounded-sm hover:shadow-md transition-shadow duration-200",
          className
        )}
      >
        {/* Thumbnail Container */}
        <Link
          href={`/product/${product.slug}`}
          className="relative w-full sm:w-48 h-48 sm:h-auto shrink-0 flex items-center justify-center p-2 overflow-hidden bg-white"
        >
          <div className="relative w-full h-full min-h-[160px]">
            <Image
              src={product.thumbnail || product.images[0] || "/placeholder-product.svg"}
              alt={product.title}
              fill
              sizes="(max-width: 640px) 100vw, 200px"
              className="object-contain transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        </Link>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2">
              <Link href={`/product/${product.slug}`}>
                <h3 className="text-sm sm:text-base font-medium text-[#212121] group-hover:text-[#2874F0] line-clamp-2 transition-colors">
                  {product.title}
                </h3>
              </Link>
              {/* Wishlist Button */}
              <button
                onClick={handleToggleWishlist}
                className="p-2 min-w-[36px] min-h-[36px] rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors active:scale-90"
                aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
              >
                <Heart
                  size={18}
                  className={cn(
                    "transition-colors",
                    isInWishlist ? "fill-red-500 text-red-500" : ""
                  )}
                />
              </button>
            </div>

            {/* Ratings & Flipkart Assured */}
            <div className="flex items-center gap-2 mt-2">
              <RatingStars rating={product.rating} totalRatings={product.ratingCount} size="sm" />
              {product.isAssured && (
                <Badge variant="assured" className="text-xs">
                  ✦ Assured
                </Badge>
              )}
            </div>

            {/* Highlights */}
            {product.highlights && product.highlights.length > 0 && (
              <ul className="mt-2 space-y-1 text-xs text-[#878787] hidden md:block">
                {product.highlights.slice(0, 3).map((highlight, idx) => (
                  <li key={idx} className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-gray-400" />
                    <span className="line-clamp-1">{highlight}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Pricing & CTA */}
          <div className="flex items-end justify-between mt-4 pt-2 border-t border-[#F0F0F0]">
            <div>
              <PriceDisplay
                price={product.price}
                mrp={product.mrp}
                discountPercentage={product.discountPercentage}
                size="lg"
              />
              {product.isFreeDelivery && (
                <p className="text-[11px] text-[#388E3C] font-medium mt-0.5">Free delivery</p>
              )}
            </div>

            {showQuickAdd && (
              <button
                onClick={handleQuickAdd}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-semibold transition-all active:scale-95 min-h-[36px]",
                  addedAnimation || isInCart
                    ? "bg-[#388E3C] text-white"
                    : "bg-[#2874F0] text-white hover:bg-[#1259c7]"
                )}
              >
                {addedAnimation ? (
                  <>
                    <Check size={14} /> Added
                  </>
                ) : isInCart ? (
                  <>
                    <Check size={14} /> In Cart
                  </>
                ) : (
                  <>
                    <ShoppingCart size={14} /> Add to Cart
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Standard Vertical Flipkart-Style Card
  return (
    <div
      className={cn(
        "group relative flex flex-col bg-white border border-[#E0E0E0] rounded-sm p-3 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.99] transition-all duration-200 hover:border-gray-300",
        className
      )}
    >
      {/* Top Badges / Wishlist */}
      <div className="flex items-center justify-between mb-2">
        {product.tags && product.tags[0] ? (
          <span className="bg-[#FFF3ED] text-[#FB641B] text-[10px] font-bold px-2 py-0.5 rounded-xs uppercase tracking-wide">
            {product.tags[0]}
          </span>
        ) : (
          <span />
        )}

        <button
          onClick={handleToggleWishlist}
          className="p-1.5 min-w-[32px] min-h-[32px] rounded-full text-gray-300 hover:text-red-500 hover:bg-gray-100 transition-colors z-10 active:scale-90"
          aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart
            size={18}
            className={cn(
              "transition-colors",
              isInWishlist ? "fill-red-500 text-red-500" : ""
            )}
          />
        </button>
      </div>

      {/* Product Image */}
      <Link
        href={`/product/${product.slug}`}
        className="relative block w-full aspect-square mb-3 overflow-hidden"
      >
        <Image
          src={product.thumbnail || product.images[0] || "/placeholder-product.svg"}
          alt={product.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
        />
      </Link>

      {/* Content */}
      <div className="flex flex-col flex-1 justify-between">
        <div>
          {/* Title */}
          <Link href={`/product/${product.slug}`}>
            <h3 className="text-xs sm:text-sm font-medium text-[#212121] group-hover:text-[#2874F0] line-clamp-2 leading-snug transition-colors min-h-[2.5rem]">
              {product.title}
            </h3>
          </Link>

          {/* Rating + Assured */}
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <RatingStars rating={product.rating} totalRatings={product.ratingCount} size="sm" />
            {product.isAssured && (
              <span className="text-[11px] font-bold text-[#2874F0] italic">
                ✦ Assured
              </span>
            )}
          </div>
        </div>

        {/* Price & Action */}
        <div className="mt-3 pt-2 border-t border-[#F0F0F0]">
          <PriceDisplay
            price={product.price}
            mrp={product.mrp}
            discountPercentage={product.discountPercentage}
            size="md"
          />

          <div className="flex items-center justify-between mt-2 flex-wrap gap-1.5">
            <span className="text-[11px] text-[#388E3C] font-medium">
              {product.isFreeDelivery ? "Free Delivery" : "Standard Delivery"}
            </span>

            {showQuickAdd && (
              <button
                onClick={handleQuickAdd}
                className={cn(
                  "p-2 rounded-sm min-w-[32px] min-h-[32px] transition-colors cursor-pointer active:scale-90",
                  addedAnimation || isInCart
                    ? "bg-[#388E3C] text-white"
                    : "bg-[#2874F0] text-white hover:bg-[#1259c7]"
                )}
                title={isInCart ? "Already in Cart" : "Add to Cart"}
                aria-label="Add to cart"
              >
                {addedAnimation || isInCart ? <Check size={14} /> : <ShoppingCart size={14} />}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

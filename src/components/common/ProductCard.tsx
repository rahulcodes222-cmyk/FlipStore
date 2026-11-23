"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingCart, Check, Minus, Plus } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { Product } from "@/types";
import { PriceDisplay } from "@/components/common/PriceDisplay";
import { RatingStars } from "@/components/common/RatingStars";
import { LoginModal } from "@/components/common/LoginModal";
import { Badge } from "@/components/ui/badge";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import { formatPrice } from "@/utils/formatters";
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
  const router = useRouter();
  const currentPath = usePathname();
  const isInWishlist = useWishlistStore((state) => state.isInWishlist(product.id));
  const toggleWishlist = useWishlistStore((state) => state.toggleItem);
  const addItemToCart = useCartStore((state) => state.addItem);
  const updateCartQty = useCartStore((state) => state.updateQuantity);
  const cartItems = useCartStore((state) => state.items);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const isInCart = cartItems.some((i) => i.productId === product.id);
  const cartItem = cartItems.find((i) => i.productId === product.id);
  const [cartQty, setCartQty] = useState<number>(cartItem?.quantity || 1);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [addedAnimation, setAddedAnimation] = React.useState(false);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) return;
    if (cartQty >= Number(product.stock || 0)) return;
    addItemToCart(product, 1);
    setCartQty(isInCart ? cartQty + 1 : 1);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1500);
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const productUrl = `/product/${product.slug}`;
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    if (!isInCart) {
      addItemToCart(product, 1);
    }
    router.push(productUrl);
  };

  const handleDecreaseCartQty = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (cartQty <= 1) {
      updateCartQty(product.id, 0);
      setCartQty(0);
      return;
    }
    setCartQty((prev) => prev - 1);
    updateCartQty(product.id, cartQty - 1);
  };

  const handleIncreaseCartQty = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = cartQty + 1;
    if (next > Number(product.stock || 0)) return;
    setCartQty(next);
    updateCartQty(product.id, next);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
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
              <div className="flex items-center gap-2">
                {!isAuthenticated ? null : isInCart ? (
                  <div className="flex items-center border border-[#E0E0E0] rounded-xs bg-white w-fit">
                    <button
                      type="button"
                      onClick={handleDecreaseCartQty}
                      disabled={cartQty <= 1}
                      className="px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="px-2 py-1 text-xs font-bold text-[#212121] min-w-[24px] text-center">
                      {cartQty}
                    </span>
                    <button
                      type="button"
                      onClick={handleIncreaseCartQty}
                      className="px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                ) : (
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
                <button
                  onClick={handleBuyNow}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-semibold transition-all active:scale-95 min-h-[36px] bg-[#FB641B] text-white hover:bg-[#e65a17]"
                >
                  Buy Now
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Standard Vertical Flipkart-Style Card
  const discount = product.discountPercentage ?? (product.mrp > product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0);
  return (
    <>
    <div
      className={cn(
        "group relative flex flex-col bg-white border border-[#E0E0E0] rounded-sm overflow-hidden hover:shadow-[0_2px_12px_rgba(0,0,0,0.12)] transition-shadow duration-200",
        className
      )}
    >
      {/* Wishlist */}
      <button
        onClick={handleToggleWishlist}
        className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-white/90 text-gray-300 hover:text-red-500 shadow-sm transition-colors active:scale-90"
        aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
      >
        <Heart
          size={16}
          className={cn("transition-colors", isInWishlist ? "fill-red-500 text-red-500" : "")}
        />
      </button>

      {/* Product Image */}
      <Link
        href={`/product/${product.slug}`}
        className="relative block w-full aspect-[4/5] sm:aspect-square bg-white p-3"
      >
        <Image
          src={product.thumbnail || product.images[0] || "/placeholder-product.svg"}
          alt={product.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-contain p-1 transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </Link>

      {/* Content */}
      <div className="flex flex-col flex-1 px-2.5 pb-2.5 pt-1">
        {/* Title */}
        <Link href={`/product/${product.slug}`}>
          <h3 className="text-[13px] sm:text-sm font-medium text-[#212121] group-hover:text-[#2874F0] line-clamp-2 leading-[1.35] transition-colors h-[2.45em]">
            {product.title}
          </h3>
        </Link>

        {/* Rating + Assured */}
        <div className="flex items-center gap-1.5 mt-1">
          <span className="inline-flex items-center gap-0.5 bg-[#388E3C] text-white text-[11px] font-bold px-1.5 py-[1px] rounded-[2px] leading-none">
            {Number(product.rating || 0).toFixed(1)} ★
          </span>
          <span className="text-[11px] text-[#878787] font-medium">({(product.ratingCount || 0).toLocaleString("en-IN")})</span>
          {product.isAssured && (
            <span className="text-[10px] font-bold text-[#2874F0] italic ml-0.5">Assured</span>
          )}
        </div>

        {/* Price row */}
        <div className="mt-1.5 flex items-baseline flex-wrap gap-x-1.5 gap-y-0.5">
          <span className="text-[15px] sm:text-base font-semibold text-[#212121] leading-none">{formatPrice(product.price)}</span>
          {product.mrp > product.price && (
            <span className="text-xs text-[#878787] line-through">{formatPrice(product.mrp)}</span>
          )}
          {discount > 0 && (
            <span className="text-xs font-semibold text-[#388E3C]">{discount}% off</span>
          )}
        </div>

        {/* Delivery / stock hint */}
        <p className="text-[11px] text-[#212121] mt-1">
          {product.isFreeDelivery ? <span className="text-[#388E3C] font-medium">Free delivery</span> : "Delivery charges apply"}
        </p>

        {/* Actions */}
        {showQuickAdd && (
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            {!isAuthenticated ? null : isInCart ? (
              <div className="flex items-center border border-[#E0E0E0] rounded-xs bg-white">
                <button
                  type="button"
                  onClick={handleDecreaseCartQty}
                  className="px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                >
                  <Minus size={12} />
                </button>
                <span className="px-2 py-1.5 text-xs font-bold text-[#212121] min-w-[24px] text-center">
                  {cartQty}
                </span>
                <button
                  type="button"
                  onClick={handleIncreaseCartQty}
                  className="px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                >
                  <Plus size={12} />
                </button>
              </div>
            ) : (
              <button
                onClick={handleQuickAdd}
                className={cn(
                  "h-8 rounded-sm text-[11px] sm:text-xs font-semibold transition-colors active:scale-[0.99] flex items-center justify-center gap-1",
                  addedAnimation || isInCart
                    ? "bg-[#388E3C] text-white"
                    : "bg-white border border-[#2874F0] text-[#2874F0] hover:bg-[#eaf2ff]"
                )}
                title={isInCart ? "Already in Cart" : "Add to Cart"}
                aria-label="Add to cart"
              >
                {addedAnimation ? <><Check size={13} /> Added</> : isInCart ? <><Check size={13} /> In Cart</> : <><ShoppingCart size={13} /> Add</>}
              </button>
            )}
            <button
              onClick={handleBuyNow}
              className="h-8 rounded-sm text-[11px] sm:text-xs font-semibold bg-[#FB641B] text-white hover:bg-[#e65a17] transition-colors active:scale-[0.99]"
            >
              Buy Now
            </button>
          </div>
        )}
      </div>
    </div>
    <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} returnUrl={`/product/${product.slug}`} />
    </>
  );
}

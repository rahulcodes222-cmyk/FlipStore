"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useCartStore } from "@/store/useCartStore";
import { useHydration } from "@/hooks/useHydration";
import { EmptyState } from "@/components/common/EmptyState";
import { PriceDisplay } from "@/components/common/PriceDisplay";
import { RatingStars } from "@/components/common/RatingStars";
import { Button } from "@/components/ui/button";
import { Product } from "@/types";
import {
  Heart,
  ShoppingCart,
  Check,
  Trash2,
  ArrowUpDown,
  BadgeCheck,
  Truck,
  Share2,
  LayoutGrid,
  List,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Sort options ─────────────────────────────────────────────────────────────
type SortKey = "added" | "price_asc" | "price_desc" | "rating" | "discount";

const SORT_OPTIONS: { label: string; value: SortKey }[] = [
  { label: "Recently Added", value: "added" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "Highest Rated", value: "rating" },
  { label: "Biggest Discount", value: "discount" },
];

// ─── Single wishlist item card (list view) ────────────────────────────────────
interface WishlistItemCardProps {
  product: Product;
  addedAt: string;
  onRemove: (productId: string) => void;
  onMoveToCart: (product: Product) => void;
  isInCart: boolean;
  view: "grid" | "list";
}

function WishlistItemCard({
  product,
  onRemove,
  onMoveToCart,
  isInCart,
  view,
}: WishlistItemCardProps) {
  const [justAdded, setJustAdded] = useState(false);

  const handleAddToCart = () => {
    onMoveToCart(product);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1800);
  };

  const inStock = product.inStock && product.stock > 0;

  if (view === "list") {
    return (
      <div className="bg-white border border-[#E0E0E0] rounded-sm shadow-2xs overflow-hidden hover:shadow-md transition-shadow duration-200">
        <div className="flex gap-0 sm:gap-4">
          {/* Image */}
          <Link
            href={`/products/${product.slug}`}
            className="relative shrink-0 w-32 sm:w-44 bg-[#F9F9F9] border-r border-[#F0F0F0] flex items-center justify-center overflow-hidden"
          >
            <div className="relative w-full h-32 sm:h-40">
              <Image
                src={product.thumbnail || product.images[0] || "/placeholder-product.svg"}
                alt={product.title}
                fill
                sizes="(max-width: 640px) 128px, 176px"
                className="object-contain p-3 hover:scale-105 transition-transform duration-300"
              />
            </div>
            {/* Discount badge */}
            {product.discountPercentage > 0 && (
              <span className="absolute top-2 left-2 bg-[#388E3C] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-xs">
                {product.discountPercentage}% OFF
              </span>
            )}
          </Link>

          {/* Content */}
          <div className="flex-1 p-3 sm:p-4 flex flex-col justify-between min-w-0">
            <div>
              {/* Title + Badges */}
              <div className="flex items-start gap-2 justify-between">
                <Link
                  href={`/products/${product.slug}`}
                  className="text-sm sm:text-base font-semibold text-[#212121] hover:text-[#2874F0] line-clamp-2 transition-colors flex-1"
                >
                  {product.title}
                </Link>
                {product.isAssured && (
                  <span className="shrink-0 flex items-center gap-0.5 text-[10px] font-bold text-[#2874F0] bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-xs">
                    <BadgeCheck size={11} />
                    Assured
                  </span>
                )}
              </div>

              {/* Brand */}
              <p className="text-xs text-[#878787] mt-0.5">{product.brandName}</p>

              {/* Rating */}
              <div className="mt-2">
                <RatingStars
                  rating={product.rating}
                  totalRatings={product.ratingCount}
                  totalReviews={product.reviewCount}
                  size="sm"
                  variant="badge"
                />
              </div>

              {/* Highlights */}
              {product.highlights.length > 0 && (
                <ul className="mt-2 space-y-0.5 hidden sm:block">
                  {product.highlights.slice(0, 3).map((h, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-[11px] text-[#555]">
                      <span className="w-1 h-1 rounded-full bg-gray-400 mt-1.5 shrink-0" />
                      {h}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Price + Actions */}
            <div className="flex flex-wrap items-end justify-between gap-3 mt-3 pt-3 border-t border-[#F0F0F0]">
              <div>
                <PriceDisplay
                  price={product.price}
                  mrp={product.mrp}
                  discountPercentage={product.discountPercentage}
                  size="md"
                />
                <div className="flex items-center gap-1 mt-1 text-[11px]">
                  <Truck size={11} className="text-[#388E3C]" />
                  <span className={product.isFreeDelivery ? "text-[#388E3C] font-medium" : "text-[#878787]"}>
                    {product.isFreeDelivery ? "Free Delivery" : `Delivery in ${product.estimatedDeliveryDays} days`}
                  </span>
                </div>
                {!inStock && (
                  <p className="text-xs text-red-500 font-semibold mt-1">Out of Stock</p>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleAddToCart}
                  disabled={!inStock}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xs text-xs font-bold transition-all cursor-pointer",
                    !inStock
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : justAdded || isInCart
                      ? "bg-[#388E3C] text-white"
                      : "bg-[#2874F0] text-white hover:bg-[#1259c7]"
                  )}
                >
                  {justAdded ? (
                    <><Check size={13} /> Added!</>
                  ) : isInCart ? (
                    <><Check size={13} /> In Cart</>
                  ) : (
                    <><ShoppingCart size={13} /> Add to Cart</>
                  )}
                </button>

                <button
                  onClick={() => onRemove(product.id)}
                  className="flex items-center gap-1 text-xs text-red-500 font-semibold px-2 py-1.5 rounded-xs hover:bg-red-50 transition-colors cursor-pointer border border-red-200"
                >
                  <Trash2 size={13} />
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div className="group bg-white border border-[#E0E0E0] rounded-sm shadow-2xs overflow-hidden hover:shadow-lg hover:border-gray-300 transition-all duration-200 flex flex-col">
      {/* Image */}
      <Link
        href={`/products/${product.slug}`}
        className="relative block w-full aspect-square bg-[#F9F9F9] overflow-hidden"
      >
        <Image
          src={product.thumbnail || product.images[0] || "/placeholder-product.svg"}
          alt={product.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-contain p-3 group-hover:scale-105 transition-transform duration-300"
        />
        {product.discountPercentage > 0 && (
          <span className="absolute top-2 left-2 bg-[#388E3C] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-xs">
            {product.discountPercentage}% OFF
          </span>
        )}
        {/* Remove button overlay */}
        <button
          onClick={(e) => { e.preventDefault(); onRemove(product.id); }}
          className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-sm border border-gray-100 text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
          aria-label="Remove from wishlist"
        >
          <Heart size={15} className="fill-red-500 text-red-500" />
        </button>
      </Link>

      {/* Content */}
      <div className="flex flex-col flex-1 p-3">
        <Link
          href={`/products/${product.slug}`}
          className="text-xs sm:text-sm font-semibold text-[#212121] hover:text-[#2874F0] line-clamp-2 leading-snug transition-colors min-h-[2.5rem]"
        >
          {product.title}
        </Link>

        <p className="text-[11px] text-[#878787] mt-0.5">{product.brandName}</p>

        <div className="mt-1.5">
          <RatingStars rating={product.rating} totalRatings={product.ratingCount} size="sm" variant="badge" />
        </div>

        <div className="mt-auto pt-2 border-t border-[#F0F0F0] mt-3">
          <PriceDisplay
            price={product.price}
            mrp={product.mrp}
            discountPercentage={product.discountPercentage}
            size="sm"
          />

          {!inStock && (
            <p className="text-[11px] text-red-500 font-semibold mt-1">Out of Stock</p>
          )}

          {/* Actions */}
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleAddToCart}
              disabled={!inStock}
              className={cn(
                "flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xs text-[11px] font-bold transition-all cursor-pointer",
                !inStock
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : justAdded || isInCart
                  ? "bg-[#388E3C] text-white"
                  : "bg-[#2874F0] text-white hover:bg-[#1259c7]"
              )}
            >
              {justAdded ? (
                <><Check size={12} />Added</>
              ) : isInCart ? (
                <><Check size={12} />In Cart</>
              ) : (
                <><ShoppingCart size={12} />Add to Cart</>
              )}
            </button>

            <button
              onClick={() => onRemove(product.id)}
              className="p-1.5 rounded-xs border border-[#E0E0E0] text-red-400 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors cursor-pointer"
              aria-label="Remove"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function WishlistPage() {
  const router = useRouter();
  const isHydrated = useHydration();

  const wishlistItems = useWishlistStore((state) => state.items);
  const removeFromWishlist = useWishlistStore((state) => state.removeItem);
  const clearWishlist = useWishlistStore((state) => state.clearWishlist);

  const addToCart = useCartStore((state) => state.addItem);
  const cartItems = useCartStore((state) => state.items);

  const [sortKey, setSortKey] = useState<SortKey>("added");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [showSortMenu, setShowSortMenu] = useState(false);

  const isInCart = (productId: string) =>
    cartItems.some((i) => i.productId === productId);

  const handleRemove = (productId: string) => {
    removeFromWishlist(productId);
  };

  const handleMoveToCart = (product: Product) => {
    addToCart(product, 1);
  };

  const handleMoveAllToCart = () => {
    wishlistItems.forEach(({ product }) => {
      if (product.inStock && !isInCart(product.id)) {
        addToCart(product, 1);
      }
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My Wishlist — FlipStore India",
          text: `Check out my wishlist with ${wishlistItems.length} items!`,
          url: window.location.href,
        });
      } catch {
        // user cancelled share
      }
    } else {
      navigator.clipboard.writeText(window.location.href).catch(() => {});
    }
  };

  // Sorted items
  const sortedItems = useMemo(() => {
    const copy = [...wishlistItems];
    switch (sortKey) {
      case "price_asc":
        return copy.sort((a, b) => a.product.price - b.product.price);
      case "price_desc":
        return copy.sort((a, b) => b.product.price - a.product.price);
      case "rating":
        return copy.sort((a, b) => b.product.rating - a.product.rating);
      case "discount":
        return copy.sort(
          (a, b) => b.product.discountPercentage - a.product.discountPercentage
        );
      case "added":
      default:
        return copy.sort(
          (a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
        );
    }
  }, [wishlistItems, sortKey]);

  const availableCount = wishlistItems.filter(
    (i) => i.product.inStock
  ).length;
  const inCartCount = wishlistItems.filter((i) => isInCart(i.product.id)).length;

  // ── Loading state ──────────────────────────────────────────────────────────
  if (!isHydrated) {
    return (
      <div className="bg-[#F1F3F6] min-h-screen py-6">
        <div className="max-w-[1280px] mx-auto px-3 sm:px-4 space-y-4">
          <div className="animate-pulse h-16 bg-white rounded-sm border border-[#E0E0E0]" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse h-64 bg-white rounded-sm border border-[#E0E0E0]" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Empty state ────────────────────────────────────────────────────────────
  if (wishlistItems.length === 0) {
    return (
      <div className="bg-[#F1F3F6] min-h-screen py-8">
        <div className="max-w-[1280px] mx-auto px-3 sm:px-4">
          <EmptyState
            preset="wishlist"
            title="Your Wishlist is Empty"
            description="Save items you love to your wishlist. Review them anytime and move them to your cart."
            actionText="Discover Products"
            actionHref="/products"
            secondaryActionText="View Trending"
            secondaryActionHref="/"
          />
        </div>
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div className="bg-[#F1F3F6] min-h-screen py-5">
      <div className="max-w-[1280px] mx-auto px-3 sm:px-4 space-y-4">

        {/* ── Header Card ─────────────────────────────────────────────────── */}
        <div className="bg-white border border-[#E0E0E0] rounded-sm shadow-2xs px-4 sm:px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Title */}
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-[#212121]">
                My Wishlist
                <span className="ml-2 text-sm font-normal text-[#878787]">
                  ({wishlistItems.length} {wishlistItems.length === 1 ? "item" : "items"})
                </span>
              </h1>
              {inCartCount > 0 && (
                <p className="text-xs text-[#388E3C] mt-0.5">
                  {inCartCount} item{inCartCount > 1 ? "s" : ""} already in your cart
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Move all in-stock to cart */}
              {availableCount > 0 && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleMoveAllToCart}
                  className="flex items-center gap-1.5 text-xs"
                >
                  <ShoppingCart size={13} />
                  Add All to Cart
                  {availableCount < wishlistItems.length && (
                    <span className="opacity-70">({availableCount})</span>
                  )}
                </Button>
              )}

              {/* Share */}
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#2874F0] px-2.5 py-1.5 rounded-xs hover:bg-blue-50 border border-blue-200 transition-colors cursor-pointer"
              >
                <Share2 size={13} />
                Share
              </button>

              {/* Clear all */}
              <button
                onClick={() => {
                  if (window.confirm(`Remove all ${wishlistItems.length} items from wishlist?`)) {
                    clearWishlist();
                  }
                }}
                className="flex items-center gap-1.5 text-xs font-semibold text-red-500 px-2.5 py-1.5 rounded-xs hover:bg-red-50 border border-red-200 transition-colors cursor-pointer"
              >
                <Trash2 size={13} />
                Clear All
              </button>
            </div>
          </div>

          {/* Summary pills */}
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-[#F0F0F0]">
            <span className="text-[11px] bg-[#F1F3F6] text-[#555] px-2.5 py-1 rounded-full border border-[#E0E0E0]">
              {availableCount} In Stock
            </span>
            {wishlistItems.length - availableCount > 0 && (
              <span className="text-[11px] bg-red-50 text-red-500 px-2.5 py-1 rounded-full border border-red-100">
                {wishlistItems.length - availableCount} Out of Stock
              </span>
            )}
            {inCartCount > 0 && (
              <span className="text-[11px] bg-green-50 text-[#388E3C] px-2.5 py-1 rounded-full border border-green-200">
                {inCartCount} In Cart
              </span>
            )}
            <button
              onClick={() => router.push("/cart")}
              className="text-[11px] text-[#2874F0] font-semibold underline-offset-2 hover:underline cursor-pointer ml-auto"
            >
              View Cart →
            </button>
          </div>
        </div>

        {/* ── Toolbar: Sort + View Toggle ──────────────────────────────────── */}
        <div className="flex items-center justify-between gap-3 bg-white border border-[#E0E0E0] rounded-sm shadow-2xs px-4 py-2.5">
          {/* Sort dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSortMenu((p) => !p)}
              className="flex items-center gap-2 text-xs font-semibold text-[#212121] hover:text-[#2874F0] transition-colors cursor-pointer"
            >
              <ArrowUpDown size={14} />
              Sort: {SORT_OPTIONS.find((o) => o.value === sortKey)?.label}
            </button>
            {showSortMenu && (
              <>
                {/* backdrop */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowSortMenu(false)}
                />
                <div className="absolute left-0 top-full mt-1 z-20 bg-white border border-[#E0E0E0] rounded-sm shadow-lg min-w-[200px] py-1">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { setSortKey(opt.value); setShowSortMenu(false); }}
                      className={cn(
                        "w-full text-left px-3 py-2 text-xs hover:bg-[#F1F3F6] transition-colors cursor-pointer",
                        sortKey === opt.value
                          ? "text-[#2874F0] font-bold bg-blue-50"
                          : "text-[#212121]"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-1 border border-[#E0E0E0] rounded-xs overflow-hidden">
            <button
              onClick={() => setView("grid")}
              className={cn(
                "p-1.5 transition-colors cursor-pointer",
                view === "grid" ? "bg-[#2874F0] text-white" : "text-[#878787] hover:bg-gray-100"
              )}
              aria-label="Grid view"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setView("list")}
              className={cn(
                "p-1.5 transition-colors cursor-pointer",
                view === "list" ? "bg-[#2874F0] text-white" : "text-[#878787] hover:bg-gray-100"
              )}
              aria-label="List view"
            >
              <List size={15} />
            </button>
          </div>
        </div>

        {/* ── Product Grid / List ──────────────────────────────────────────── */}
        {view === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {sortedItems.map(({ id, product, addedAt }) => (
              <WishlistItemCard
                key={id}
                product={product}
                addedAt={addedAt}
                onRemove={handleRemove}
                onMoveToCart={handleMoveToCart}
                isInCart={isInCart(product.id)}
                view="grid"
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {sortedItems.map(({ id, product, addedAt }) => (
              <WishlistItemCard
                key={id}
                product={product}
                addedAt={addedAt}
                onRemove={handleRemove}
                onMoveToCart={handleMoveToCart}
                isInCart={isInCart(product.id)}
                view="list"
              />
            ))}
          </div>
        )}

        {/* ── Bottom CTA strip ─────────────────────────────────────────────── */}
        <div className="bg-white border border-[#E0E0E0] rounded-sm shadow-2xs px-4 py-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[#212121] font-semibold">
            Continue shopping to find more great deals!
          </p>
          <div className="flex gap-2">
            <Link href="/products">
              <Button variant="outline" size="sm" className="text-xs">
                Browse Products
              </Button>
            </Link>
            <Link href="/">
              <Button variant="primary" size="sm" className="text-xs">
                View Deals
              </Button>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}

"use client";

import React, { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/useCartStore";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useHydration } from "@/hooks/useHydration";
import { EmptyState } from "@/components/common/EmptyState";
import { PriceDisplay } from "@/components/common/PriceDisplay";
import { Button } from "@/components/ui/button";
import { CartItem, Coupon, Product } from "@/types";
import { couponService, CouponValidationResult } from "@/services/couponService";
import {
  Trash2,
  Tag,
  Check,
  X,
  ShieldCheck,
  ArrowRight,
  Heart,
  Bookmark,
  ShoppingCart,
  Truck,
  BadgeCheck,
  RefreshCw,
} from "lucide-react";

// ─── Saved‑for‑Later storage key ────────────────────────────────────────────
const SAVED_KEY = "my_ecommerce_saved_for_later";

function readSaved(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function writeSaved(items: CartItem[]) {
  try {
    localStorage.setItem(SAVED_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getDeliveryLabel(product: Product): string {
  if (product.isFreeDelivery) {
    if (product.estimatedDeliveryDays <= 1) return "Free Delivery by Tomorrow";
    return `Free Delivery in ${product.estimatedDeliveryDays} days`;
  }
  if (product.estimatedDeliveryDays <= 1) return "Delivery by Tomorrow · ₹40";
  return `Delivery in ${product.estimatedDeliveryDays} days · ₹40`;
}

// ─── Cart Item Card ───────────────────────────────────────────────────────────
interface CartItemCardProps {
  item: CartItem;
  onRemove: (productId: string) => void;
  onUpdateQty: (productId: string, qty: number) => void;
  onSaveForLater: (item: CartItem) => void;
  onMoveToWishlist: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
}

function CartItemCard({
  item,
  onRemove,
  onUpdateQty,
  onSaveForLater,
  onMoveToWishlist,
  isInWishlist,
}: CartItemCardProps) {
  const { product, quantity, selectedVariants } = item;
  const wishlisted = isInWishlist(product.id);

  return (
    <div className="bg-white border border-[#E0E0E0] rounded-sm shadow-2xs overflow-hidden transition-all duration-200">
      {/* Top section */}
      <div className="flex gap-4 p-4">
        {/* Thumbnail */}
        <Link href={`/products/${product.slug}`} className="shrink-0">
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 bg-[#F9F9F9] border border-gray-100 rounded-xs overflow-hidden">
            <Image
              src={product.thumbnail || product.images[0] || "/placeholder-product.svg"}
              alt={product.title}
              fill
              sizes="112px"
              className="object-contain p-2"
            />
          </div>
        </Link>

        {/* Info */}
        <div className="flex-1 min-w-0">
          {/* Title + Assured */}
          <div className="flex items-start gap-2">
            <Link
              href={`/products/${product.slug}`}
              className="text-sm font-semibold text-[#212121] hover:text-[#2874F0] line-clamp-2 flex-1"
            >
              {product.title}
            </Link>
            {product.isAssured && (
              <span className="shrink-0 flex items-center gap-0.5 text-[10px] font-bold text-[#2874F0] bg-blue-50 px-1.5 py-0.5 rounded-xs border border-blue-100">
                <BadgeCheck size={11} />
                Assured
              </span>
            )}
          </div>

          {/* Brand + Seller */}
          <p className="text-xs text-[#878787] mt-0.5">
            {product.brandName} &middot; Sold by{" "}
            <span className="font-medium text-[#555]">{product.seller.name}</span>
          </p>

          {/* Variant chips */}
          {selectedVariants && Object.keys(selectedVariants).length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {Object.entries(selectedVariants).map(([k, v]) => (
                <span
                  key={k}
                  className="text-[11px] bg-gray-100 text-[#555] px-2 py-0.5 rounded-full border border-gray-200"
                >
                  {k}: <strong>{v}</strong>
                </span>
              ))}
            </div>
          )}

          {/* Price */}
          <div className="mt-2">
            <PriceDisplay
              price={product.price}
              mrp={product.mrp}
              discountPercentage={product.discountPercentage}
              size="sm"
            />
          </div>

          {/* Delivery */}
          <div className="flex items-center gap-1 mt-1.5 text-[11px] text-[#878787]">
            <Truck size={12} className="text-[#388E3C]" />
            <span className={product.isFreeDelivery ? "text-[#388E3C] font-medium" : ""}>
              {getDeliveryLabel(product)}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-[#FAFAFA] border-t border-[#F0F0F0]">
        {/* Quantity controls */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[#878787] font-medium">Qty:</span>
          <div className="flex items-center border border-[#E0E0E0] rounded-xs overflow-hidden">
            <button
              onClick={() => {
                if (quantity <= 1) {
                  onRemove(product.id);
                  return;
                }
                onUpdateQty(product.id, quantity - 1);
              }}
              disabled={quantity <= 1}
              className="px-2.5 py-1 text-sm font-bold text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors min-h-[32px] min-w-[32px]"
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="px-3 py-1 text-xs font-bold text-[#212121] border-x border-[#E0E0E0] min-w-[32px] text-center">
              {quantity}
            </span>
            <button
              onClick={() => onUpdateQty(product.id, quantity + 1)}
              disabled={quantity >= product.stock}
              className="px-2.5 py-1 text-sm font-bold text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
          {quantity >= product.stock && (
            <span className="text-[10px] text-orange-500 font-medium">Max stock</span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 flex-wrap">
          {/* Save for Later */}
          <button
            onClick={() => onSaveForLater(item)}
            className="flex items-center gap-1 text-xs text-[#2874F0] font-semibold px-2 py-1 rounded-xs hover:bg-blue-50 transition-colors cursor-pointer"
          >
            <Bookmark size={13} />
            <span className="hidden sm:inline">Save for Later</span>
            <span className="sm:hidden">Save</span>
          </button>

          <span className="text-[#E0E0E0]">|</span>

          {/* Move to Wishlist */}
          <button
            onClick={() => onMoveToWishlist(product)}
            className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-xs transition-colors cursor-pointer ${
              wishlisted
                ? "text-red-500 hover:bg-red-50"
                : "text-[#878787] hover:bg-gray-100"
            }`}
          >
            <Heart size={13} className={wishlisted ? "fill-red-500" : ""} />
            <span className="hidden sm:inline">{wishlisted ? "Wishlisted" : "Wishlist"}</span>
          </button>

          <span className="text-[#E0E0E0]">|</span>

          {/* Remove */}
          <button
            onClick={() => onRemove(product.id)}
            className="flex items-center gap-1 text-xs text-red-500 font-semibold px-2 py-1 rounded-xs hover:bg-red-50 transition-colors cursor-pointer"
          >
            <Trash2 size={13} />
            <span>Remove</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Saved Item Card ──────────────────────────────────────────────────────────
interface SavedItemCardProps {
  item: CartItem;
  onMoveToCart: (item: CartItem) => void;
  onRemoveSaved: (productId: string) => void;
}

function SavedItemCard({ item, onMoveToCart, onRemoveSaved }: SavedItemCardProps) {
  const { product } = item;
  return (
    <div className="bg-white border border-[#E0E0E0] rounded-sm shadow-2xs flex gap-3 p-3 items-start">
      <Link href={`/products/${product.slug}`} className="shrink-0">
        <div className="relative w-16 h-16 bg-[#F9F9F9] border border-gray-100 rounded-xs overflow-hidden">
          <Image
            src={product.thumbnail || product.images[0] || "/placeholder-product.svg"}
            alt={product.title}
            fill
            sizes="64px"
            className="object-contain p-1"
          />
        </div>
      </Link>

      <div className="flex-1 min-w-0">
        <Link
          href={`/products/${product.slug}`}
          className="text-xs font-semibold text-[#212121] hover:text-[#2874F0] line-clamp-2"
        >
          {product.title}
        </Link>
        <div className="mt-1">
          <PriceDisplay price={product.price} mrp={product.mrp} size="sm" />
        </div>
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={() => onMoveToCart(item)}
            className="flex items-center gap-1 text-xs text-white bg-[#2874F0] font-semibold px-2.5 py-1 rounded-xs hover:bg-blue-700 transition-colors cursor-pointer"
          >
            <ShoppingCart size={12} />
            Move to Cart
          </button>
          <button
            onClick={() => onRemoveSaved(product.id)}
            className="text-xs text-red-500 font-medium hover:underline cursor-pointer"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CartPage() {
  const router = useRouter();
  const isHydrated = useHydration();

  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const getSummary = useCartStore((state) => state.getSummary);
  const clearCart = useCartStore((state) => state.clearCart);
  const addItem = useCartStore((state) => state.addItem);

  const toggleWishlist = useWishlistStore((state) => state.toggleItem);
  const isInWishlist = useWishlistStore((state) => state.isInWishlist);

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponDiscount, setCouponDiscount] = useState<number>(0);
  const [couponResult, setCouponResult] = useState<CouponValidationResult | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [deliverySettings, setDeliverySettings] = useState<{ standardFee?: number; freeThreshold?: number } | null>(null);
  const [realTimeDeliveryRate, setRealTimeDeliveryRate] = useState<number | null>(null);
  const [isFetchingDeliveryRate, setIsFetchingDeliveryRate] = useState(false);

  // Saved‑for‑Later (session + localStorage)
  const [savedItems, setSavedItems] = useState<CartItem[]>(() => readSaved());

  // ── Fetch delivery settings from backend ─────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const fetchDeliverySettings = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/admin/settings`, {
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });
        if (res.ok) {
          const json = await res.json().catch(() => ({}));
          const data = json?.data || {};
          setDeliverySettings({
            standardFee: data.standardDeliveryCharge,
            freeThreshold: data.freeDeliveryAboveAmount,
          });
        }
      } catch {
        // Silently fall back to APP_CONFIG defaults
      }
    };
    fetchDeliverySettings();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Fetch real-time Shiprocket delivery rate ─────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const fetchRealTimeRate = async () => {
      try {
        setIsFetchingDeliveryRate(true);
        // Get user's default address pincode
        const addrRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/users/addresses`, {
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });
        let deliveryPincode = "";
        if (addrRes.ok) {
          const addrJson = await addrRes.json().catch(() => ({}));
          const addresses = addrJson?.data || addrJson?.addresses || [];
          const defaultAddr = Array.isArray(addresses) ? addresses.find((a: any) => a.isDefault) : null;
          deliveryPincode = defaultAddr?.pincode || "";
        }
        if (!deliveryPincode) return;

        const rateRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/checkout/delivery-rate?pincode=${encodeURIComponent(deliveryPincode)}`,
          { credentials: "include", headers: { "Content-Type": "application/json" } },
        );
        if (rateRes.ok) {
          const rateJson = await rateJsonParse(rateRes);
          if (rateJson?.data?.charge != null) {
            setRealTimeDeliveryRate(Number(rateJson.data.charge));
          }
        }
      } catch {
        // Silently fall back to admin delivery settings
      } finally {
        setIsFetchingDeliveryRate(false);
      }
    };
    fetchRealTimeRate();
    return () => {
      cancelled = true;
    };
  }, []);

  async function rateJsonParse(res: Response): Promise<any> {
    try { return await res.json(); } catch { return {}; }
  }

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleSaveForLater = useCallback(
    (item: CartItem) => {
      removeItem(item.product.id);
      setSavedItems((prev) => {
        const already = prev.some((s) => s.productId === item.productId);
        const next = already ? prev : [...prev, item];
        writeSaved(next);
        return next;
      });
    },
    [removeItem]
  );

  const handleMoveToCart = useCallback(
    (item: CartItem) => {
      addItem(item.product, item.quantity, item.selectedVariants);
      setSavedItems((prev) => {
        const next = prev.filter((s) => s.productId !== item.productId);
        writeSaved(next);
        return next;
      });
    },
    [addItem]
  );

  const handleRemoveSaved = useCallback((productId: string) => {
    setSavedItems((prev) => {
      const next = prev.filter((s) => s.productId !== productId);
      writeSaved(next);
      return next;
    });
  }, []);

  const handleMoveToWishlist = useCallback(
    (product: Product) => {
      toggleWishlist(product);
    },
    [toggleWishlist]
  );

  const handleApplyCoupon = async (codeToApply?: string) => {
    const code = (codeToApply || couponCode).trim().toUpperCase();
    if (!code) return;
    setIsApplyingCoupon(true);
    setCouponResult(null);
    try {
      const res = await couponService.validateCoupon(code, summary.subtotal);
      setCouponResult(res);
      if (res.valid && res.coupon && res.discountAmount) {
        setAppliedCoupon(res.coupon);
        setCouponDiscount(res.discountAmount);
        setCouponCode(res.coupon.code);
        try { localStorage.setItem("checkout_coupon_code_v1", res.coupon.code); } catch {}
      }
    } catch {
      setCouponResult({ valid: false, message: "Failed to validate coupon. Please try again." });
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponResult(null);
    setCouponCode("");
    try { localStorage.removeItem("checkout_coupon_code_v1"); } catch {}
  };

  const handleProceedToCheckout = () => {
    if (!isAuthenticated) {
      router.push("/login");
    } else {
      const code = (appliedCoupon?.code || couponCode || "").trim().toUpperCase();
      if (code) {
        try { localStorage.setItem("checkout_coupon_code_v1", code); } catch {}
        router.push(`/checkout?coupon=${encodeURIComponent(code)}`);
      } else {
        router.push("/checkout");
      }
    }
  };

  // ── Render guards ───────────────────────────────────────────────────────────
  if (!isHydrated) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 py-16 text-center">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-48 mx-auto" />
          <div className="h-32 bg-gray-100 rounded" />
          <div className="h-32 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  if (items.length === 0 && savedItems.length === 0) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 py-8">
        <EmptyState
          preset="cart"
          title="Your Shopping Cart is Empty"
          description="Looks like you haven't added anything yet. Explore our top deals now!"
          actionText="Shop Trending Deals"
          actionHref="/"
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 py-16 text-center">
        <EmptyState
          preset="cart"
          title="Please Log In to View Your Cart"
          description="Your cart items are private to your account. Log in to see your saved items and proceed to checkout."
          actionText="Sign In"
          actionHref="/login?redirect=/cart"
        />
      </div>
    );
  }

  const summary = getSummary(deliverySettings || undefined);
  const finalPayable = Math.max(0, summary.subtotal - couponDiscount + summary.deliveryCharges + summary.taxAmount + (realTimeDeliveryRate ?? 0));
  const totalSavingsWithCoupon = summary.totalSavings + couponDiscount;

  return (
    <div className="bg-[#F1F3F6] min-h-screen py-5">
      <div className="max-w-[1280px] mx-auto px-3 sm:px-4">

        {/* Page Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg sm:text-xl font-bold text-[#212121]">
            Shopping Cart
            {items.length > 0 && (
              <span className="ml-2 text-sm font-normal text-[#878787]">
                ({items.length} {items.length === 1 ? "item" : "items"})
              </span>
            )}
          </h1>
          {items.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm("Clear all items from your cart?")) clearCart();
              }}
              className="flex items-center gap-1 text-xs text-red-500 font-semibold hover:text-red-700 transition-colors cursor-pointer"
            >
              <RefreshCw size={12} />
              Clear Cart
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* ── Left Column ─────────────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-3">

            {/* Cart Items */}
            {items.length > 0 && (
              <div className="space-y-3">
                {items.map((item) => (
                  <CartItemCard
                    key={item.id}
                    item={item}
                    onRemove={removeItem}
                    onUpdateQty={updateQuantity}
                    onSaveForLater={handleSaveForLater}
                    onMoveToWishlist={handleMoveToWishlist}
                    isInWishlist={isInWishlist}
                  />
                ))}
              </div>
            )}

            {/* Empty cart but has saved items */}
            {items.length === 0 && savedItems.length > 0 && (
              <div className="bg-white border border-[#E0E0E0] rounded-sm shadow-2xs p-6 text-center">
                <ShoppingCart size={40} className="mx-auto text-gray-300 mb-3" />
                <p className="text-sm font-semibold text-[#212121]">Your cart is empty</p>
                <p className="text-xs text-[#878787] mt-1">
                  You have {savedItems.length} item{savedItems.length > 1 ? "s" : ""} saved for later.
                </p>
              </div>
            )}

            {/* ── Coupon Box ───────────────────────────────────────────────── */}
            {items.length > 0 && (
              <div className="bg-white border border-[#E0E0E0] rounded-sm p-4 shadow-2xs">
                <div className="flex items-center gap-2 mb-3">
                  <Tag size={16} className="text-[#2874F0]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#212121]">
                    Apply Coupon / Promo Code
                  </h3>
                </div>

                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-xs">
                    <div className="flex items-center gap-2">
                      <Check size={16} className="text-[#388E3C] shrink-0" />
                      <div>
                        <span className="text-xs font-bold text-[#388E3C] uppercase">
                          {appliedCoupon.code}
                        </span>{" "}
                        <span className="text-xs text-[#212121]">applied</span>
                        <p className="text-[11px] text-[#388E3C]">
                          You saved ₹{couponDiscount.toLocaleString("en-IN")} with this coupon
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-xs text-red-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <X size={14} /> Remove
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter Coupon Code (e.g. WELCOME100)"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        className="flex-1 px-3 py-2 text-xs border border-[#E0E0E0] rounded-xs uppercase tracking-wider focus:outline-none focus:border-[#2874F0]"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleApplyCoupon()}
                        isLoading={isApplyingCoupon}
                        disabled={!couponCode.trim()}
                      >
                        Apply
                      </Button>
                    </div>

                    {couponResult && !couponResult.valid && (
                      <p className="text-xs text-red-600">{couponResult.message}</p>
                    )}

                    <div className="flex items-center gap-2 pt-1 flex-wrap text-xs text-[#878787]">
                      <span>Try:</span>
                      {["WELCOME100", "FESTIVE20"].map((code) => (
                        <button
                          key={code}
                          type="button"
                          onClick={() => {
                            setCouponCode(code);
                            handleApplyCoupon(code);
                          }}
                          className="px-2 py-0.5 bg-blue-50 text-[#2874F0] border border-blue-200 rounded-xs font-semibold cursor-pointer hover:bg-blue-100 transition-colors"
                        >
                          {code === "WELCOME100" ? "WELCOME100 (₹100 Off)" : "FESTIVE20 (20% Off)"}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Saved for Later Section ───────────────────────────────────── */}
            {savedItems.length > 0 && (
              <div className="bg-white border border-[#E0E0E0] rounded-sm shadow-2xs overflow-hidden transition-all duration-200">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-[#F0F0F0] bg-[#FAFAFA]">
                  <Bookmark size={15} className="text-[#2874F0]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#212121]">
                    Saved for Later ({savedItems.length})
                  </h3>
                </div>
                <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {savedItems.map((item) => (
                    <SavedItemCard
                      key={item.id}
                      item={item}
                      onMoveToCart={handleMoveToCart}
                      onRemoveSaved={handleRemoveSaved}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Right Column: Price Summary ─────────────────────────────────── */}
          {items.length > 0 && (
            <div className="space-y-3 lg:sticky lg:top-20 h-fit">
              <div className="bg-white border border-[#E0E0E0] rounded-sm p-5 shadow-2xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#878787] pb-3 border-b border-[#F0F0F0]">
                  Price Details
                </h3>

                <div className="space-y-3 py-3 text-sm border-b border-[#F0F0F0]">
                  <div className="flex justify-between">
                    <span className="text-[#878787]">
                      Price ({summary.itemsCount} {summary.itemsCount === 1 ? "item" : "items"})
                    </span>
                    <span className="font-medium">₹{summary.totalMrp.toLocaleString("en-IN")}</span>
                  </div>

                  <div className="flex justify-between text-[#388E3C]">
                    <span>Discount</span>
                    <span className="font-semibold">
                      −₹{summary.discountOnMrp.toLocaleString("en-IN")}
                    </span>
                  </div>

                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-[#388E3C] font-semibold">
                      <span>Coupon ({appliedCoupon?.code})</span>
                      <span>−₹{couponDiscount.toLocaleString("en-IN")}</span>
                    </div>
                  )}

                  {summary.taxAmount > 0 && (
                    <div className="flex justify-between text-xs text-[#666]">
                      <span>Tax ({summary.taxAmount > 0 ? 'GST' : ''})</span>
                      <span>₹{summary.taxAmount.toLocaleString("en-IN")}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-[#878787]">Delivery Charges</span>
                    <span className="font-medium">
                      {realTimeDeliveryRate != null
                        ? realTimeDeliveryRate === 0
                          ? <span className="text-[#388E3C] font-semibold">FREE</span>
                          : `₹${realTimeDeliveryRate}`
                        : summary.deliveryCharges === 0
                          ? <span className="text-[#388E3C] font-semibold">FREE</span>
                          : `₹${summary.deliveryCharges}`}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center py-3 text-base font-bold text-[#212121] border-b border-[#F0F0F0]">
                  <span>Total Amount</span>
                  <span>₹{finalPayable.toLocaleString("en-IN")}</span>
                </div>

                {totalSavingsWithCoupon > 0 && (
                  <p className="text-xs text-[#388E3C] font-semibold py-2">
                    🎉 You will save ₹{totalSavingsWithCoupon.toLocaleString("en-IN")} on this order
                  </p>
                )}

                <Button
                  variant="buyNow"
                  size="lg"
                  fullWidth
                  onClick={handleProceedToCheckout}
                  className="mt-3 text-sm font-bold tracking-wide flex items-center justify-center gap-2"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight size={16} />
                </Button>

                <div className="flex items-center justify-center gap-1.5 pt-3 text-[11px] text-[#878787]">
                  <ShieldCheck size={13} className="text-[#388E3C]" />
                  <span>Safe &amp; Secure Payments · 100% Authentic Products</span>
                </div>
              </div>

              {/* Offers teaser */}
              <div className="bg-white border border-[#E0E0E0] rounded-sm p-3 shadow-2xs text-xs text-[#212121] space-y-2">
                <p className="font-bold text-[#2874F0] uppercase tracking-wider text-[11px]">
                  Available Offers
                </p>
                <div className="space-y-1.5 text-[#555]">
                  <p className="flex items-start gap-2">
                    <Tag size={12} className="text-[#388E3C] mt-0.5 shrink-0" />
                    Use code <strong className="text-[#2874F0]">WELCOME100</strong> and get ₹100 off
                    on your first order.
                  </p>
                  <p className="flex items-start gap-2">
                    <Tag size={12} className="text-[#388E3C] mt-0.5 shrink-0" />
                    Use code <strong className="text-[#2874F0]">FESTIVE20</strong> for 20% off (up to
                    ₹500) on orders above ₹999.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Product } from "@/types";
import { useCartStore } from "@/store/useCartStore";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useToast } from "@/components/common/Toast";
import { Button } from "@/components/ui/button";
import { LoginModal } from "@/components/common/LoginModal";
import {
  ShoppingCart,
  Zap,
  Heart,
  Check,
  MapPin,
  Truck,
  CheckCircle2,
  RotateCcw,
  Minus,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductActionsProps {
  product: Product;
}

export function ProductActions({ product }: ProductActionsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const addItem = useCartStore((state) => state.addItem);
  const updateCartQty = useCartStore((state) => state.updateQuantity);
  const cartItems = useCartStore((state) => state.items);
  const { toggleItem, isInWishlist } = useWishlistStore();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const isFavorited = isInWishlist(product.id);
  const isInCart = cartItems.some((i) => i.productId === product.id);
  const cartItem = cartItems.find((i) => i.productId === product.id);
  const [cartQty, setCartQty] = useState<number>(cartItem?.quantity || 1);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Variant selections
  const [selectedStorage, setSelectedStorage] = useState<string | undefined>(
    product.variants?.storage?.[0]
  );
  const [selectedColor, setSelectedColor] = useState<string | undefined>(
    product.variants?.color?.[0]
  );
  const [selectedSize, setSelectedSize] = useState<string | undefined>(
    product.variants?.size?.[0]
  );

  // Quantity selection
  const [quantity, setQuantity] = useState<number>(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // Delivery Pincode state
  const [pincode, setPincode] = useState("560001");
  const [pincodeStatus, setPincodeStatus] = useState<{
    checked: boolean;
    valid: boolean;
    message?: string;
    deliveryDate?: string;
    codAvailable?: boolean;
  }>({
    checked: true,
    valid: true,
    message: "Delivery available to your location",
    deliveryDate: "Tomorrow by 9:00 PM",
    codAvailable: true,
  });

  const selectedVariants: Record<string, string> = {};
  if (selectedStorage) selectedVariants["Storage"] = selectedStorage;
  if (selectedColor) selectedVariants["Color"] = selectedColor;
  if (selectedSize) selectedVariants["Size"] = selectedSize;

  const handleDecreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const handleIncreaseQuantity = () => {
    if (quantity < (product.stock || 10)) {
      setQuantity((prev) => prev + 1);
    } else {
      toast({
        type: "warning",
        message: `Maximum stock limit of ${product.stock} items reached.`,
      });
    }
  };

  const handleCheckPincode = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pincode.trim().replace(/\D/g, "");
    if (cleanPin.length !== 6) {
      setPincodeStatus({
        checked: true,
        valid: false,
        message: "Please enter a valid 6-digit Indian PIN code",
      });
      return;
    }

    // Mock Delivery logic
    const isNextDayPin = ["560001", "110001", "400001", "700001", "600001"].includes(cleanPin);
    setPincodeStatus({
      checked: true,
      valid: true,
      deliveryDate: isNextDayPin ? "Tomorrow by 9:00 PM" : "Within 2-3 business days",
      codAvailable: true,
      message: `Delivery available for PIN ${cleanPin}`,
    });
  };

  const handleAddToCart = () => {
    if (!isAuthenticated) return;
    if (cartQty >= Number(product.stock || 0)) return;
    setIsAddingToCart(true);
    addItem(
      product,
      1,
      Object.keys(selectedVariants).length > 0 ? selectedVariants : undefined
    );
    setCartQty(isInCart ? cartQty + 1 : 1);

    toast({
      type: "success",
      title: "Added to Cart",
      message: `${quantity} × ${product.title} added to your cart.`,
    });
    setTimeout(() => setIsAddingToCart(false), 500);
  };

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    addItem(
      product,
      quantity,
      Object.keys(selectedVariants).length > 0 ? selectedVariants : undefined
    );
    router.push("/checkout");
  };

  const handleToggleWishlist = () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    toggleItem(product);
    if (!isFavorited) {
      toast({
        type: "success",
        title: "Added to Wishlist",
        message: `${product.title} saved to your wishlist.`,
      });
    } else {
      toast({
        type: "info",
        title: "Removed from Wishlist",
        message: `${product.title} removed from your wishlist.`,
      });
    }
  };

  return (
    <>
    <div className="space-y-5 pt-1">
      {/* 1. Variant Selector - Size */}
      {product.variants?.size && product.variants.size.length > 0 && (
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#878787] mb-1.5">
            Size: <span className="text-[#212121]">{selectedSize}</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {product.variants.size.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setSelectedSize(size)}
                className={cn(
                  "px-3.5 py-1.5 text-xs font-semibold rounded-xs border transition-colors cursor-pointer min-w-9 text-center",
                  selectedSize === size
                    ? "border-[#2874F0] bg-blue-50 text-[#2874F0] ring-1 ring-[#2874F0]"
                    : "border-[#E0E0E0] text-[#212121] hover:border-gray-400"
                )}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 2. Variant Selector - Color */}
      {product.variants?.color && product.variants.color.length > 0 && (
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#878787] mb-1.5">
            Color: <span className="text-[#212121]">{selectedColor}</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {product.variants.color.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setSelectedColor(color)}
                className={cn(
                  "px-3.5 py-1.5 text-xs font-semibold rounded-xs border transition-colors cursor-pointer flex items-center gap-1.5",
                  selectedColor === color
                    ? "border-[#2874F0] bg-blue-50 text-[#2874F0] ring-1 ring-[#2874F0]"
                    : "border-[#E0E0E0] text-[#212121] hover:border-gray-400"
                )}
              >
                <span
                  className="w-3 h-3 rounded-full border border-gray-300 inline-block"
                  style={{
                    backgroundColor:
                      color.toLowerCase().includes("black")
                        ? "#111"
                        : color.toLowerCase().includes("blue")
                        ? "#2874F0"
                        : color.toLowerCase().includes("gold") || color.toLowerCase().includes("yellow")
                        ? "#E5A93C"
                        : color.toLowerCase().includes("silver") || color.toLowerCase().includes("white")
                        ? "#E5E7EB"
                        : color.toLowerCase().includes("red")
                        ? "#E53E3E"
                        : color.toLowerCase().includes("green")
                        ? "#388E3C"
                        : "#718096",
                  }}
                />
                <span>{color}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3. Variant Selector - Storage */}
      {product.variants?.storage && product.variants.storage.length > 0 && (
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#878787] mb-1.5">
            Storage: <span className="text-[#212121]">{selectedStorage}</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {product.variants.storage.map((storage) => (
              <button
                key={storage}
                type="button"
                onClick={() => setSelectedStorage(storage)}
                className={cn(
                  "px-3 py-1.5 text-xs font-semibold rounded-xs border transition-colors cursor-pointer",
                  selectedStorage === storage
                    ? "border-[#2874F0] bg-blue-50 text-[#2874F0] ring-1 ring-[#2874F0]"
                    : "border-[#E0E0E0] text-[#212121] hover:border-gray-400"
                )}
              >
                {storage}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 4. Quantity Selection & Stock Status */}
      <div className="flex flex-wrap items-center gap-4 pt-1">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#878787] mb-1.5">
            Quantity
          </label>
          <div className="flex items-center border border-[#E0E0E0] rounded-xs bg-white w-fit">
            <button
              type="button"
              onClick={handleDecreaseQuantity}
              disabled={quantity <= 1}
              className={cn(
                "px-3 py-2 min-h-[36px] min-w-[36px] text-sm font-bold transition-colors",
                quantity <= 1 ? "text-gray-300 cursor-not-allowed" : "text-gray-700 hover:bg-gray-100 cursor-pointer"
              )}
              aria-label="Decrease quantity"
            >
              -
            </button>
            <span className="px-4 py-2 text-xs font-bold text-[#212121] min-w-10 text-center">
              {quantity}
            </span>
            <button
              type="button"
              onClick={handleIncreaseQuantity}
              disabled={quantity >= (product.stock || 10)}
              className="px-3 py-2 min-h-[36px] min-w-[36px] text-sm font-bold text-gray-700 hover:bg-gray-100 cursor-pointer transition-colors"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
        </div>

        {/* Stock Status Indicator */}
        <div className="mt-4">
          {!product.inStock ? (
            <span className="text-red-600 font-bold text-xs">Currently Out of Stock</span>
          ) : product.stock < 10 ? (
            <span className="text-[#FB641B] font-semibold text-xs">
              Hurry, only {product.stock} units left!
            </span>
          ) : (
            <span className="text-[#388E3C] font-semibold text-xs flex items-center gap-1">
              <Check size={14} /> In Stock ({product.stock} available)
            </span>
          )}
        </div>
      </div>

      {/* 5. Action Buttons Row */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        {!isAuthenticated ? null : isInCart ? (
          <div className="flex items-center border border-[#E0E0E0] rounded-xs bg-white w-fit flex-1">
            <button
              type="button"
              onClick={() => {
                if (cartQty <= 1) {
                  updateCartQty(product.id, 0);
                  setCartQty(0);
                  return;
                }
                setCartQty((prev) => prev - 1);
                updateCartQty(product.id, cartQty - 1);
              }}
              className="px-4 py-2 min-h-[48px] min-w-[48px] text-sm font-bold text-gray-700 hover:bg-gray-100"
              aria-label="Decrease quantity"
            >
              <Minus size={16} />
            </button>
            <span className="px-4 py-2 text-xs font-bold text-[#212121] min-w-10 text-center">
              {cartQty}
            </span>
            <button
              type="button"
              onClick={() => {
                const next = cartQty + 1;
                if (next > Number(product.stock || 0)) return;
                setCartQty(next);
                updateCartQty(product.id, next);
              }}
              className="px-4 py-2 min-h-[48px] min-w-[48px] text-sm font-bold text-gray-700 hover:bg-gray-100"
              aria-label="Increase quantity"
            >
              <Plus size={16} />
            </button>
          </div>
        ) : (
          <Button
            type="button"
            variant="addToCart"
            size="lg"
            onClick={handleAddToCart}
            disabled={!product.inStock || isAddingToCart}
            className="flex-1 font-bold text-sm tracking-wide min-h-[48px]"
          >
            <ShoppingCart size={18} className="mr-2" />
            {isAddingToCart ? "Adding..." : "Add to Cart"}
          </Button>
        )}

        <Button
          type="button"
          variant="buyNow"
          size="lg"
          onClick={handleBuyNow}
          disabled={!product.inStock}
          className="flex-1 font-bold text-sm tracking-wide min-h-[48px]"
        >
          <Zap size={18} className="mr-2" />
          Buy Now
        </Button>

        <button
          type="button"
          onClick={handleToggleWishlist}
          className={cn(
            "p-3 rounded-xs border flex items-center justify-center transition-colors cursor-pointer shrink-0",
            isFavorited
              ? "border-[#FB641B] text-[#FB641B] bg-orange-50/50"
              : "border-[#E0E0E0] text-gray-500 hover:text-[#FB641B] hover:border-gray-400"
          )}
          aria-label={isFavorited ? "Remove from wishlist" : "Add to wishlist"}
          title={isFavorited ? "Remove from wishlist" : "Save for later"}
        >
          <Heart size={20} className={isFavorited ? "fill-current" : ""} />
        </button>
      </div>

      {/* 6. Delivery PIN Code Checker */}
      <div className="pt-4 border-t border-[#F0F0F0] space-y-2.5">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#212121]">
          <MapPin size={15} className="text-[#2874F0]" />
          <span>Delivery Details &amp; PIN Code Check</span>
        </div>

        <form onSubmit={handleCheckPincode} className="flex gap-2 max-w-sm">
          <input
            type="text"
            maxLength={6}
            placeholder="Enter 6-digit PIN code"
            value={pincode}
            onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
            className="flex-1 px-3 py-1.5 text-xs border border-[#E0E0E0] rounded-xs focus:outline-none focus:border-[#2874F0]"
          />
          <button
            type="submit"
            className="px-4 py-1.5 bg-[#2874F0] text-white text-xs font-bold rounded-xs cursor-pointer hover:bg-blue-600 transition-colors"
          >
            Check
          </button>
        </form>

        {pincodeStatus.checked && (
          <div className="text-xs space-y-1.5 pt-1">
            {pincodeStatus.valid ? (
              <>
                <div className="flex items-center gap-2 text-[#212121] font-semibold">
                  <Truck size={14} className="text-[#388E3C]" />
                  <span>
                    Delivery: <span className="text-[#388E3C]">{pincodeStatus.deliveryDate}</span> | FREE
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 text-[11px]">
                  <CheckCircle2 size={13} className="text-[#2874F0]" />
                  <span>Cash on Delivery is available for this PIN code.</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 text-[11px]">
                  <RotateCcw size={13} className="text-[#FB641B]" />
                  <span>7 Days Replacement Policy &amp; Brand Warranty applicable.</span>
                </div>
              </>
            ) : (
              <p className="text-red-600 text-xs font-medium">{pincodeStatus.message}</p>
            )}
          </div>
        )}
      </div>
    </div>
    <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </>
  );
}

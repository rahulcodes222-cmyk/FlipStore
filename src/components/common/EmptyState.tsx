import React from "react";
import Link from "next/link";
import { ShoppingBag, Heart, Search, PackageOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  preset?: "cart" | "wishlist" | "search" | "orders";
  title: string;
  description?: string;
  actionText?: string;
  actionHref?: string;
  onAction?: () => void;
  secondaryActionText?: string;
  secondaryActionHref?: string;
  className?: string;
}

export function EmptyState({
  icon,
  preset,
  title,
  description,
  actionText,
  actionHref,
  onAction,
  secondaryActionText,
  secondaryActionHref,
  className,
}: EmptyStateProps) {
  // Preset Icon and default messaging
  const presets = {
    cart: {
      icon: <ShoppingBag size={48} className="text-[#2874F0]" />,
      defaultTitle: "Your Cart is Empty!",
      defaultDesc: "Explore our top deals and add items to your cart now.",
      defaultAction: "Shop Now",
    },
    wishlist: {
      icon: <Heart size={48} className="text-[#FB641B]" />,
      defaultTitle: "Empty Wishlist",
      defaultDesc: "You have no items in your wishlist. Start adding items you love!",
      defaultAction: "Discover Products",
    },
    search: {
      icon: <Search size={48} className="text-gray-400" />,
      defaultTitle: "No Products Found",
      defaultDesc: "Try checking your spelling or use more general keywords.",
      defaultAction: "Clear Search",
    },
    orders: {
      icon: <PackageOpen size={48} className="text-[#2874F0]" />,
      defaultTitle: "No Orders Yet",
      defaultDesc: "You haven't placed any orders with us yet.",
      defaultAction: "Start Shopping",
    },
  };

  const activePreset = preset ? presets[preset] : null;
  const displayIcon = icon ?? activePreset?.icon ?? <ShoppingBag size={48} className="text-gray-400" />;
  const displayTitle = title ?? activePreset?.defaultTitle ?? "No Items Found";
  const displayDesc = description ?? activePreset?.defaultDesc;
  const displayAction = actionText ?? activePreset?.defaultAction;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 sm:p-12 bg-white rounded-sm border border-[#E0E0E0] shadow-2xs max-w-lg mx-auto my-6",
        className
      )}
    >
      {/* Icon Circle */}
      <div className="w-20 h-20 rounded-full bg-[#F1F3F6] flex items-center justify-center mb-5 animate-in zoom-in-75 duration-300">
        {displayIcon}
      </div>

      {/* Title */}
      <h3 className="text-lg sm:text-xl font-bold text-[#212121] mb-2">{displayTitle}</h3>

      {/* Description */}
      {displayDesc && (
        <p className="text-sm text-[#878787] max-w-sm mb-6 leading-relaxed">
          {displayDesc}
        </p>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {displayAction && (
          actionHref ? (
            <Link href={actionHref}>
              <Button variant="primary" size="default">
                {displayAction}
              </Button>
            </Link>
          ) : (
            <Button variant="primary" size="default" onClick={onAction}>
              {displayAction}
            </Button>
          )
        )}

        {secondaryActionText && secondaryActionHref && (
          <Link href={secondaryActionHref}>
            <Button variant="outline" size="default">
              {secondaryActionText}
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}

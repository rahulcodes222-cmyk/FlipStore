"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Product } from "@/types";
import { productService } from "@/services/productService";
import { useCartStore } from "@/store/useCartStore";
import { useToast } from "@/components/common/Toast";
import { Button } from "@/components/ui/button";
import { Plus, Check, ShoppingBag } from "lucide-react";
import { formatPrice } from "@/utils/formatters";

interface FrequentlyBoughtTogetherProps {
  currentProduct: Product;
}

export function FrequentlyBoughtTogether({
  currentProduct,
}: FrequentlyBoughtTogetherProps) {
  const [bundleItems, setBundleItems] = useState<Product[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([currentProduct.id]);
  const [isAdding, setIsAdding] = useState(false);

  const addItem = useCartStore((state) => state.addItem);
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;
    async function loadComplementary() {
      try {
        const related = await productService.getRelatedProducts(currentProduct.id, 2);
        if (isMounted && related.length > 0) {
          setBundleItems(related);
          setSelectedItemIds([currentProduct.id, ...related.map((r) => r.id)]);
        }
      } catch (e) {
        console.error("Failed to load bundle products:", e);
      }
    }
    loadComplementary();
    return () => {
      isMounted = false;
    };
  }, [currentProduct.id]);

  if (bundleItems.length === 0) return null;

  const allItems = [currentProduct, ...bundleItems];
  const activeItems = allItems.filter((item) => selectedItemIds.includes(item.id));

  const totalSellingPrice = activeItems.reduce((acc, item) => acc + item.price, 0);
  const totalMrp = activeItems.reduce((acc, item) => acc + item.mrp, 0);
  const totalSavings = totalMrp - totalSellingPrice;

  const toggleItem = (id: string) => {
    // Current product cannot be unselected from its own page
    if (id === currentProduct.id) return;
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleAddBundleToCart = () => {
    setIsAdding(true);
    activeItems.forEach((item) => {
      addItem(item, 1);
    });

    toast({
      type: "success",
      title: "Bundle Added to Cart",
      message: `${activeItems.length} items added to your shopping cart with savings of ${formatPrice(totalSavings)}.`,
    });

    setTimeout(() => setIsAdding(false), 600);
  };

  return (
    <div className="bg-white border border-[#E0E0E0] rounded-sm p-4 sm:p-6 shadow-2xs space-y-5">
      <div className="flex items-center gap-2 pb-3 border-b border-[#F0F0F0]">
        <ShoppingBag size={18} className="text-[#2874F0]" />
        <h2 className="text-base sm:text-lg font-bold text-[#212121]">
          Frequently Bought Together
        </h2>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
        {/* Thumbnails visually connected by '+' */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 justify-center">
          {allItems.map((item, idx) => {
            const isChecked = selectedItemIds.includes(item.id);
            return (
              <React.Fragment key={item.id}>
                {idx > 0 && <Plus size={18} className="text-gray-400 shrink-0" />}

                <div className="flex flex-col items-center text-center max-w-[130px]">
                  <Link
                    href={`/products/${item.slug}`}
                    className="relative w-24 h-24 sm:w-28 sm:h-28 bg-white border border-[#E0E0E0] rounded-sm p-2 flex items-center justify-center overflow-hidden hover:border-[#2874F0] transition-colors"
                  >
                    <Image
                      src={item.thumbnail || item.images[0]}
                      alt={item.title}
                      fill
                      sizes="112px"
                      className="object-contain p-1"
                    />
                  </Link>

                  <div className="mt-2 text-xs">
                    <label className="flex items-start gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleItem(item.id)}
                        disabled={item.id === currentProduct.id}
                        className="mt-0.5 accent-[#2874F0]"
                      />
                      <span className="line-clamp-1 font-semibold text-[#212121] text-[11px] text-left">
                        {item.title}
                      </span>
                    </label>
                    <p className="font-bold text-[#212121] text-xs mt-0.5">
                      {formatPrice(item.price)}
                    </p>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {/* Pricing Summary & Bundle Action */}
        <div className="bg-[#F9FAFB] border border-[#F0F0F0] rounded-xs p-4 w-full lg:w-72 shrink-0 space-y-3 text-center lg:text-left">
          <div className="text-xs text-[#878787]">
            Total price for ({activeItems.length} items):
          </div>
          <div className="text-xl font-bold text-[#212121]">
            {formatPrice(totalSellingPrice)}
            <span className="text-xs text-[#878787] line-through ml-2 font-normal">
              {formatPrice(totalMrp)}
            </span>
          </div>

          {totalSavings > 0 && (
            <p className="text-xs text-[#388E3C] font-semibold">
              You save {formatPrice(totalSavings)} with this combo!
            </p>
          )}

          <Button
            type="button"
            variant="buyNow"
            size="default"
            fullWidth
            onClick={handleAddBundleToCart}
            isLoading={isAdding}
            className="text-xs font-bold"
          >
            <Check size={14} className="mr-1.5" />
            Add Both to Cart
          </Button>
        </div>
      </div>
    </div>
  );
}

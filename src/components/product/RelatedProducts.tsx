"use client";

import React, { useEffect, useState } from "react";
import { Product } from "@/types";
import { productService } from "@/services/productService";
import { ProductCard } from "@/components/common/ProductCard";

interface RelatedProductsProps {
  productId: string;
}

export function RelatedProducts({ productId }: RelatedProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadRelated() {
      try {
        const data = await productService.getRelatedProducts(productId, 4);
        if (isMounted) setProducts(data);
      } catch (err) {
        console.error("Failed to load related products:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadRelated();
    return () => {
      isMounted = false;
    };
  }, [productId]);

  if (!isLoading && products.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border border-[#E0E0E0] rounded-sm p-4 sm:p-6 shadow-2xs">
      <div className="pb-3 border-b border-[#F0F0F0] mb-4">
        <h2 className="text-base sm:text-lg font-bold text-[#212121]">
          Similar Products
        </h2>
        <p className="text-xs text-[#878787]">Customers who viewed this also considered</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
        {products.map((item) => (
          <ProductCard key={item.id} product={item} variant="vertical" />
        ))}
      </div>
    </div>
  );
}

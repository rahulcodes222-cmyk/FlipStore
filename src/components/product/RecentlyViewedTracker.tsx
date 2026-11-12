"use client";

import { useEffect } from "react";
import { Product } from "@/types";
import { useRecentlyViewedStore } from "@/store/useRecentlyViewedStore";

interface RecentlyViewedTrackerProps {
  product: Product;
}

export function RecentlyViewedTracker({ product }: RecentlyViewedTrackerProps) {
  const addProduct = useRecentlyViewedStore((state) => state.addProduct);

  useEffect(() => {
    if (product) {
      addProduct(product);
    }
  }, [product, addProduct]);

  return null;
}

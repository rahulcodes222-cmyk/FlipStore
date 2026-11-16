"use client";

import React from "react";
import Link from "next/link";
import { Product } from "@/types";
import { ImageGallery } from "./ImageGallery";
import { ProductActions } from "./ProductActions";
import { ProductHighlights } from "./ProductHighlights";
import { ProductSpecsTable } from "./ProductSpecsTable";
import { ProductReviews } from "./ProductReviews";
import { RelatedProducts } from "./RelatedProducts";
import { FrequentlyBoughtTogether } from "./FrequentlyBoughtTogether";
import { RecentlyViewedTracker } from "./RecentlyViewedTracker";
import { PriceDisplay } from "@/components/common/PriceDisplay";
import { RatingStars } from "@/components/common/RatingStars";
import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";

interface ProductDetailsViewProps {
  product: Product;
}

export function ProductDetailsView({ product }: ProductDetailsViewProps) {
  return (
    <div className="space-y-6">
      {/* 1. Track recently viewed in client store */}
      <RecentlyViewedTracker product={product} />

      {/* 2. Main Product Hero Card */}
      <div className="bg-white border border-[#E0E0E0] rounded-sm p-4 sm:p-8 shadow-2xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Left Column: Interactive Image Gallery with Zoom */}
          <div className="md:sticky md:top-24">
            <ImageGallery images={product.images} title={product.title} />
          </div>

          {/* Right Column: Product Information & Options */}
          <div className="space-y-4">
            {/* Breadcrumb row & Assured badge */}
            <div className="flex items-center justify-between text-xs text-[#878787] flex-wrap gap-2">
              <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 flex-wrap">
                <Link href="/" className="hover:text-[#2874F0] transition-colors">
                  Home
                </Link>
                <ChevronRight size={12} />
                <Link
                  href={`/category/${product.categorySlug}`}
                  className="hover:text-[#2874F0] transition-colors"
                >
                  {product.categoryName}
                </Link>
                <ChevronRight size={12} />
                <span className="text-[#212121] font-medium">{product.brandName}</span>
              </nav>

              {product.isAssured && (
                <Badge variant="assured" className="text-xs">
                  ✦ Assured
                </Badge>
              )}
            </div>

            {/* Product Title */}
            <h1 className="text-xl sm:text-2xl font-bold text-[#212121] leading-tight">
              {product.title}
            </h1>

            {/* Rating & Review Counts */}
            <div className="flex items-center gap-3">
              <RatingStars
                rating={product.rating}
                totalRatings={product.ratingCount}
                totalReviews={product.reviewCount}
                size="md"
              />
            </div>

            {/* Price Details with Savings & EMI */}
            <div className="pt-2 border-t border-[#F0F0F0]">
              <PriceDisplay
                price={product.price}
                mrp={product.mrp}
                discountPercentage={product.discountPercentage}
                size="2xl"
                showSavings
                showEmi
              />
            </div>

            {/* Interactive Options: Size, Color, Quantity, PIN checker, Add to Cart, Buy Now */}
            <ProductActions product={product} />

            {/* Product Description */}
            {product.description && (
              <div className="pt-3 border-t border-[#F0F0F0]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#878787] mb-1.5">
                  Description
                </h3>
                <p className="text-xs sm:text-sm text-[#424242] leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}

            {/* Product Highlights & Trust Badges */}
            <div className="pt-3 border-t border-[#F0F0F0]">
              <ProductHighlights
                highlights={product.highlights}
                isAssured={product.isAssured}
                sellerName={product.seller?.name}
                sellerRating={product.seller?.rating}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Frequently Bought Together */}
      <FrequentlyBoughtTogether currentProduct={product} />

      {/* 4. Technical Specifications Table */}
      <ProductSpecsTable
        specifications={product.specifications}
        brand={product.brandName}
      />

      {/* 5. Customer Ratings & Reviews */}
      <ProductReviews
        productId={product.id}
        rating={product.rating}
        ratingCount={product.ratingCount}
        reviewCount={product.reviewCount}
      />

      {/* 6. Related / Similar Products */}
      <RelatedProducts productId={product.id} />
    </div>
  );
}

import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  TrendingUp,
  Award,
  Home as HomeIcon,
  Grid,
  ArrowRight,
} from "lucide-react";
import { categoryService } from "@/services/categoryService";
import { productService } from "@/services/productService";
import { MOCK_BANNERS } from "@/data/banners";
import { HeroSlider } from "@/components/home/HeroSlider";
import { QuickCategoryBar } from "@/components/home/QuickCategoryBar";
import { DealsSection } from "@/components/home/DealsSection";
import { ProductSectionRow } from "@/components/home/ProductSectionRow";
import { PromoBanner } from "@/components/home/PromoBanner";
import { RecentlyViewedSection } from "@/components/home/RecentlyViewedSection";
import { NewsletterSection } from "@/components/home/NewsletterSection";
import { ShopByCategoryStrip } from "@/components/home/ShopByCategoryStrip";

export const instant = false;

export const metadata: Metadata = {
  title: "FlipStore India – Online Shopping for Mobiles, Electronics, Fashion & Home",
  description:
    "India's ultimate online shopping destination. Shop best deals on smartphones, 4K TVs, laptops, fashion sneakers, home furniture and daily essentials with fast delivery.",
};

function normCat(v: any) {
  return String(v || "").toLowerCase().trim().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function matchesCategory(product: any, category: { id?: string; slug?: string; name?: string } | null | undefined) {
  if (!category) return false;
  const catId = String((category as any).id || "").trim();
  const catSlug = normCat((category as any).slug);
  const catName = normCat((category as any).name);
  const pId = String(product?.categoryId || "").trim();
  const pSlug = normCat(product?.categorySlug);
  const pName = normCat(product?.categoryName || product?.category);
  if (catId && pId && catId === pId) return true;
  if (catSlug && pSlug && catSlug === pSlug) return true;
  if (catName && pName && catName === pName) return true;
  if (catSlug && pName && pName.includes(catSlug)) return true;
  if (catSlug && pSlug && pSlug.includes(catSlug)) return true;
  if (catName && pSlug && pSlug.includes(catName)) return true;
  return false;
}

export default async function HomePage() {
  // Parallel asynchronous data loading via services
  const [
    categories,
    bestDeals,
    trendingProducts,
    bestSellers,
    homeProducts,
    featuredProducts,
    latestProducts,
    electronicsProductsRaw,
  ] = await Promise.all([
    categoryService.getCategories(),
    productService.getDealsOfTheDay(5),
    productService.getTrendingProducts(5),
    productService.getBestSellingProducts(5),
    productService.getHomeLifestyleProducts(5),
    productService.getFeaturedProducts(5),
    productService.getProducts({ limit: 12, sortBy: "newest" } as any).then(r => r.data).catch(() => []),
    productService.getProducts({ category: "electronics", limit: 10, sortBy: "newest" } as any).then(r => r.data).catch(() => []),
  ]);

  const safeDeals = bestDeals.length ? bestDeals : latestProducts.slice(0, 5);
  const safeTrending = trendingProducts.length ? trendingProducts : latestProducts.slice(0, 5);
  const safeBestSellers = bestSellers.length ? bestSellers : latestProducts.slice(0, 5);
  const electronicsCategory = (categories || []).find((c: any) => normCat(c.slug) === "electronics" || normCat(c.name).includes("electronic")) || { slug: "electronics", name: "Electronics" } as any;
  const safeElectronics = (electronicsProductsRaw || []).filter((p: any) => matchesCategory(p, electronicsCategory)).slice(0, 10);

  // Promotional Banners
  const heroBanners = MOCK_BANNERS.filter((b) => b.position === "hero");
  const electronicsPromo = MOCK_BANNERS.find((b) => b.id === "promo-electronics") || heroBanners[0];
  const fashionPromo = MOCK_BANNERS.find((b) => b.id === "promo-fashion") || heroBanners[2];

  return (
    <div className="w-full pb-10">
      {/* SECTION 2: Top Quick Category Circular Bar */}
      <QuickCategoryBar categories={categories} />

      {/* Main Container */}
      <div className="max-w-[1280px] mx-auto px-3 sm:px-4">
        {/* SECTION 3: Hero Promotional Slider */}
        <div className="mb-6 rounded-sm overflow-hidden border border-[#E0E0E0] shadow-2xs">
          <HeroSlider banners={heroBanners} autoSlideInterval={4500} />
        </div>

        {/* SECTION 4: Shop by Category (Interactive Grid) */}
        <section className="w-full bg-white border border-[#E0E0E0] rounded-sm p-4 sm:p-5 shadow-2xs mb-6">
          <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-[#F0F0F0]">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-full bg-blue-50 text-[#2874F0]">
                <Grid size={18} />
              </div>
              <div>
                <h2 className="text-base sm:text-xl font-bold text-[#212121] tracking-tight">
                  Shop by Category
                </h2>
                <p className="text-xs text-[#878787] mt-0.5">
                  Browse millions of products across curated departments
                </p>
              </div>
            </div>
            <Link
              href="/category/electronics"
              className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-[#2874F0] hover:text-[#1259c7] transition-colors"
            >
              <span>Explore All</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Category Cards - auto moving single row */}
          <ShopByCategoryStrip categories={categories} />
        </section>

        {/* SECTION 5: Best Deals (Deal of the Day with Countdown Timer) */}
        <DealsSection
          products={safeDeals}
          title="Deals of the Day"
          subtitle="Top discounts ending tonight – grab them before stock runs out"
          viewAllHref="/offers"
        />

        {/* SECTION 6: Trending Products */}
        <ProductSectionRow
          title="Trending Products"
          subtitle="Most popular items Indian shoppers are loving right now"
          icon={
            <div className="p-1.5 rounded-full bg-[#FFF3ED] text-[#FB641B]">
              <TrendingUp size={18} />
            </div>
          }
          products={safeTrending}
          viewAllHref="/search?q=trending"
        />

        {/* SECTION 8: Electronics Promotional Banner */}
        <PromoBanner banner={electronicsPromo} />

        {safeElectronics.length > 0 && (
          <ProductSectionRow
            title="Electronics & Gadgets"
            subtitle="Latest electronics from our store"
            icon={
              <div className="p-1.5 rounded-full bg-blue-50 text-[#2874F0]">
                <TrendingUp size={18} />
              </div>
            }
            products={safeElectronics}
            viewAllHref="/category/electronics"
          />
        )}

        {/* SECTION 7: Best-Selling Products */}
        <ProductSectionRow
          title="Best-Selling Products"
          subtitle="Customer favorites with 4.5+ star ratings and Flipkart Assured badge"
          icon={
            <div className="p-1.5 rounded-full bg-[#E8F5E9] text-[#388E3C]">
              <Award size={18} />
            </div>
          }
          products={safeBestSellers}
          viewAllHref="/search?q=bestseller"
        />

        {/* SECTION 9: Fashion Promotional Banner */}
        <PromoBanner banner={fashionPromo} />

        {/* SECTION 10: Home & Lifestyle Products */}
        <ProductSectionRow
          title="Home & Lifestyle Essentials"
          subtitle="Transform your space with modern furniture, appliances & kitchen gear"
          icon={
            <div className="p-1.5 rounded-full bg-purple-50 text-purple-600">
              <HomeIcon size={18} />
            </div>
          }
          products={homeProducts}
          viewAllHref="/category/home-furniture"
        />

        {/* SECTION 11: Recently Viewed Products (Zustand persistent + Curated Fallback) */}
        <RecentlyViewedSection fallbackProducts={featuredProducts.length ? featuredProducts : latestProducts} />

        {/* SECTION 12: Newsletter Subscription with Instant Coupon */}
        <NewsletterSection />
      </div>
    </div>
  );
}

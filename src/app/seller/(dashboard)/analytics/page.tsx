"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useHydration } from "@/hooks/useHydration";
import { useSellerStore } from "@/store/useSellerStore";
import { sellerAnalyticsService } from "@/services";
import { useToast } from "@/components/common/Toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RevenueAnalytics } from "@/components/seller/RevenueAnalytics";
import { SalesByCategoryChart } from "@/components/seller/SalesByCategoryChart";
import { ProductPerformanceChart } from "@/components/seller/ProductPerformanceChart";
import { ReportExportButton } from "@/components/seller/ReportExportButton";
import type { AnalyticsDataPoint, CategorySalesData, ProductPerformanceData } from "@/types";
import { cn } from "@/lib/utils";

const DATE_FILTERS = [
  { label: "Today", value: "today" },
  { label: "Last 7 Days", value: "7d" },
  { label: "Last 30 Days", value: "30d" },
  { label: "Last 90 Days", value: "90d" },
  { label: "This Year", value: "ytd" },
];

export default function SellerAnalyticsPage() {
  const isHydrated = useHydration();
  const { seller } = useSellerStore();
  const { toast, success, error } = useToast();
  const currentSeller = isHydrated ? seller : null;
  const sellerId = currentSeller?.id || "slr-001";

  const [analyticsData, setAnalyticsData] = useState<AnalyticsDataPoint[]>([]);
  const [categorySales, setCategorySales] = useState<CategorySalesData[]>([]);
  const [productPerformance, setProductPerformance] = useState<ProductPerformanceData[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("30d");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const [data, categories, products, sum] = await Promise.all([
          sellerAnalyticsService.getAnalyticsData(sellerId),
          sellerAnalyticsService.getCategorySales(sellerId),
          sellerAnalyticsService.getProductPerformance(sellerId),
          sellerAnalyticsService.getAnalyticsSummary(sellerId),
        ]);
        if (mounted) {
          setAnalyticsData(data);
          setCategorySales(categories);
          setProductPerformance(products);
          setSummary(sum);
        }
      } catch {
        error("Failed to load analytics");
      } finally {
        if (mounted) setLoading(false);
    }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [sellerId, error]);

  const handleDownload = (type: string) => {
    success(`${type} report downloaded`);
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 space-y-6">
        <h1 className="text-lg font-bold text-[#212121]">Analytics</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 rounded-sm bg-[#E8E8E8] animate-skeleton" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-[#212121]">Analytics</h1>
          <p className="text-xs text-[#878787]">Track your store performance and growth</p>
        </div>
        <div className="flex items-center gap-2">
          <ReportExportButton type="SALES" onDownload={() => handleDownload("Sales")} />
          <ReportExportButton type="ORDERS" onDownload={() => handleDownload("Orders")} />
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-sm border border-[#E0E0E0] bg-white p-4 shadow-sm">
            <div className="text-xs text-[#878787] uppercase tracking-wider font-bold">Total Revenue</div>
            <div className="text-lg font-bold text-[#212121]">₹{summary.totalRevenue.toLocaleString("en-IN")}</div>
          </div>
          <div className="rounded-sm border border-[#E0E0E0] bg-white p-4 shadow-sm">
            <div className="text-xs text-[#878787] uppercase tracking-wider font-bold">Total Orders</div>
            <div className="text-lg font-bold text-[#212121]">{summary.totalOrders}</div>
          </div>
          <div className="rounded-sm border border-[#E0E0E0] bg-white p-4 shadow-sm">
            <div className="text-xs text-[#878787] uppercase tracking-wider font-bold">Total Customers</div>
            <div className="text-lg font-bold text-[#212121]">{summary.totalCustomers}</div>
          </div>
          <div className="rounded-sm border border-[#E0E0E0] bg-white p-4 shadow-sm">
            <div className="text-xs text-[#878787] uppercase tracking-wider font-bold">Avg. Conversion</div>
            <div className="text-lg font-bold text-[#212121]">{summary.avgConversion}%</div>
          </div>
        </div>
      )}

      <div className="flex gap-2 text-xs mb-3">
        {DATE_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setDateFilter(f.value)}
            className={cn(
              "px-3 py-1.5 rounded-sm border font-medium transition-colors",
              dateFilter === f.value
                ? "bg-[#2874F0] border-[#2874F0] text-white"
                : "bg-white border-[#E0E0E0] text-[#212121] hover:bg-[#F1F3F6]"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-sm border border-[#E0E0E0] bg-white p-4 shadow-sm">
          <h3 className="text-sm font-bold text-[#212121] mb-3">Revenue Trend</h3>
          <RevenueAnalytics data={analyticsData} dataKey="revenue" />
        </div>
        <div className="rounded-sm border border-[#E0E0E0] bg-white p-4 shadow-sm">
          <h3 className="text-sm font-bold text-[#212121] mb-3">Sales by Category</h3>
          <SalesByCategoryChart data={categorySales} />
        </div>
      </div>

      <div className="rounded-sm border border-[#E0E0E0] bg-white p-4 shadow-sm">
        <h3 className="text-sm font-bold text-[#212121] mb-3">Product Performance</h3>
        <ProductPerformanceChart data={productPerformance} />
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { useHydration } from "@/hooks/useHydration";
import { useSellerStore } from "@/store/useSellerStore";
import { sellerAnalyticsService } from "@/services";
import { useToast } from "@/components/common/Toast";
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
] as const;

function toIsoDate(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, "0");
  const day = String(x.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getRange(filter: string): { from: string; to: string } {
  const now = new Date();
  const to = toIsoDate(now);
  if (filter === "today") return { from: to, to };
  if (filter === "ytd") return { from: `${now.getFullYear()}-01-01`, to };
  const days = filter === "7d" ? 7 : filter === "90d" ? 90 : 30;
  const fromDate = new Date(now);
  fromDate.setDate(fromDate.getDate() - (days - 1));
  return { from: toIsoDate(fromDate), to };
}

export default function SellerAnalyticsPage() {
  const isHydrated = useHydration();
  const { seller } = useSellerStore();
  const { success, error } = useToast();
  const currentSeller = isHydrated ? seller : null;
  const sellerId = currentSeller?.id || "slr-001";

  const [analyticsData, setAnalyticsData] = useState<AnalyticsDataPoint[]>([]);
  const [categorySales, setCategorySales] = useState<CategorySalesData[]>([]);
  const [productPerformance, setProductPerformance] = useState<ProductPerformanceData[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<(typeof DATE_FILTERS)[number]["value"]>("30d");

  const range = useMemo(() => getRange(dateFilter), [dateFilter]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const [data, categories, products, sum] = await Promise.all([
          sellerAnalyticsService.getAnalyticsData(sellerId, range),
          sellerAnalyticsService.getCategorySales(sellerId, range),
          sellerAnalyticsService.getProductPerformance(sellerId, range),
          sellerAnalyticsService.getAnalyticsSummary(sellerId, range),
        ]);
        if (mounted) {
          setAnalyticsData(data);
          setCategorySales(categories);
          setProductPerformance(products);
          setSummary(sum);
        }
      } catch {
        if (mounted) error("Failed to load analytics");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [sellerId, range.from, range.to, error]);

  const handleDownload = (type: string) => {
    success(`${type} report downloaded`);
  };

  const hasTrend = analyticsData.length > 0;
  const hasCategories = categorySales.length > 0;
  const hasProducts = productPerformance.length > 0;

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
          <p className="text-xs text-[#878787]">Real store performance from your orders and earnings ({range.from} to {range.to})</p>
        </div>
        <div className="flex items-center gap-2">
          <ReportExportButton type="SALES" onDownload={() => handleDownload("Sales")} />
          <ReportExportButton type="ORDERS" onDownload={() => handleDownload("Orders")} />
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <div className="rounded-sm border border-[#E0E0E0] bg-white p-4 shadow-sm">
            <div className="text-xs text-[#878787] uppercase tracking-wider font-bold">Total Revenue</div>
            <div className="text-lg font-bold text-[#212121]">₹{Number(summary.totalRevenue || 0).toLocaleString("en-IN")}</div>
          </div>
          <div className="rounded-sm border border-[#E0E0E0] bg-white p-4 shadow-sm">
            <div className="text-xs text-[#878787] uppercase tracking-wider font-bold">Total Orders</div>
            <div className="text-lg font-bold text-[#212121]">{Number(summary.totalOrders || 0)}</div>
          </div>
          <div className="rounded-sm border border-[#E0E0E0] bg-white p-4 shadow-sm">
            <div className="text-xs text-[#878787] uppercase tracking-wider font-bold">Total Products</div>
            <div className="text-lg font-bold text-[#212121]">{Number(summary.totalProducts || 0)}</div>
          </div>
          <div className="rounded-sm border border-[#E0E0E0] bg-white p-4 shadow-sm">
            <div className="text-xs text-[#878787] uppercase tracking-wider font-bold">Total Customers</div>
            <div className="text-lg font-bold text-[#212121]">{Number(summary.totalCustomers || 0)}</div>
          </div>
          <div className="rounded-sm border border-[#E0E0E0] bg-white p-4 shadow-sm">
            <div className="text-xs text-[#878787] uppercase tracking-wider font-bold">Avg. Conversion</div>
            <div className="text-lg font-bold text-[#212121]">{Number(summary.avgConversion || 0)}%</div>
          </div>
          <div className="rounded-sm border border-[#E0E0E0] bg-white p-4 shadow-sm">
            <div className="text-xs text-[#878787] uppercase tracking-wider font-bold">Top Category</div>
            <div className="text-lg font-bold text-[#212121] truncate" title={String(summary.topCategory || "N/A")}>{String(summary.topCategory || "N/A")}</div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 text-xs mb-1">
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
          {hasTrend ? (
            <RevenueAnalytics data={analyticsData} dataKey="revenue" />
          ) : (
            <div className="h-[320px] flex items-center justify-center text-sm text-[#878787] border border-dashed border-[#E0E0E0] rounded-sm">
              No revenue/order trend data for this period.
            </div>
          )}
        </div>
        <div className="rounded-sm border border-[#E0E0E0] bg-white p-4 shadow-sm">
          <h3 className="text-sm font-bold text-[#212121] mb-3">Sales by Category</h3>
          {hasCategories ? (
            <SalesByCategoryChart data={categorySales} />
          ) : (
            <div className="h-[320px] flex items-center justify-center text-sm text-[#878787] border border-dashed border-[#E0E0E0] rounded-sm">
              No category sales data for this period.
            </div>
          )}
        </div>
      </div>

      <div className="rounded-sm border border-[#E0E0E0] bg-white p-4 shadow-sm">
        <h3 className="text-sm font-bold text-[#212121] mb-3">Product Performance</h3>
        {hasProducts ? (
          <ProductPerformanceChart data={productPerformance} />
        ) : (
          <div className="h-[320px] flex items-center justify-center text-sm text-[#878787] border border-dashed border-[#E0E0E0] rounded-sm">
            No product performance data for this period.
          </div>
        )}
      </div>
    </div>
  );
}

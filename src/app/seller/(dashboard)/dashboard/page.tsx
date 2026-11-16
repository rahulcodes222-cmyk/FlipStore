"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  DollarSign,
  Package,
  Users,
  Clock,
  TrendingUp,
  TrendingDown,
  LayoutDashboard,
} from "lucide-react";
import { useHydration } from "@/hooks/useHydration";
import { useSellerStore } from "@/store/useSellerStore";
import { sellerDashboardService } from "@/services";
import type { SellerStats, SellerOrder, TopProduct, LowStockProduct, SalesDataPoint, RevenueDataPoint } from "@/types";
import { SellerStatsCard } from "@/components/seller/SellerStatsCard";
import { SalesChart } from "@/components/seller/SalesChart";
import { RevenueChart } from "@/components/seller/RevenueChart";
import { RecentOrdersTable } from "@/components/seller/RecentOrdersTable";
import { TopProducts } from "@/components/seller/TopProducts";
import { LowStockAlerts } from "@/components/seller/LowStockAlerts";
import { cn } from "@/lib/utils";

const DATE_FILTERS = [
  { label: "Today", value: "today" },
  { label: "Last 7 Days", value: "7d" },
  { label: "Last 30 Days", value: "30d" },
  { label: "Last 90 Days", value: "90d" },
  { label: "This Year", value: "ytd" },
];

export default function SellerDashboardPage() {
  const isHydrated = useHydration();
  const { seller, setStats } = useSellerStore();
  const currentSeller = isHydrated ? seller : null;

  const [stats, setStatsLocal] = useState<SellerStats | null>(null);
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [lowStock, setLowStock] = useState<LowStockProduct[]>([]);
  const [salesData, setSalesData] = useState<SalesDataPoint[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueDataPoint[]>([]);
  const [dateFilter, setDateFilter] = useState("30d");
  const [loading, setLoading] = useState(true);

  const sellerId = currentSeller?.id || "slr-001";

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const [sStats, sOrders, sProducts, sLow, sSales, sRevenue] =
          await Promise.all([
            sellerDashboardService.getStats(sellerId),
            sellerDashboardService.getOrders(sellerId),
            sellerDashboardService.getTopProducts(sellerId),
            sellerDashboardService.getLowStock(sellerId),
            sellerDashboardService.getSalesData(sellerId),
            sellerDashboardService.getRevenueData(sellerId),
          ]);
        if (!mounted) return;
        setStats(sStats);
        setStatsLocal(sStats);
        setOrders(sOrders.slice(0, 5));
        setTopProducts(sProducts);
        setLowStock(sLow);
        setSalesData(sSales);
        setRevenueData(sRevenue);
      } catch {
        // ignore - mock data always available
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [sellerId, dateFilter]);

  if (loading || !stats) {
    return (
      <div className="p-4 sm:p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  const changeByVariant: Record<string, { value: number; positive: boolean } | undefined> = {
    revenue: { value: 12, positive: true },
    orders: { value: 8, positive: true },
    products: { value: 5, positive: true },
    customers: { value: 6, positive: true },
    pending: { value: 4, positive: false },
    cancelled: { value: 2, positive: true },
    balance: { value: 15, positive: true },
    earnings: { value: 10, positive: true },
  };

  const statRows = [
    { key: "revenue", title: "Total Revenue", value: `₹${stats.totalRevenue.toLocaleString("en-IN")}`, variant: "revenue" as const, subtitle: "This period" },
    { key: "orders", title: "Total Orders", value: stats.totalOrders, variant: "orders" as const, subtitle: "Lifetime" },
    { key: "products", title: "Total Products", value: stats.totalProducts, variant: "products" as const, subtitle: "Listed" },
    { key: "customers", title: "Total Customers", value: stats.totalCustomers, variant: "customers" as const, subtitle: "Unique buyers" },
    { key: "pending", title: "Pending Orders", value: stats.pendingOrders, variant: "pending" as const, subtitle: "To ship" },
    { key: "cancelled", title: "Cancelled Orders", value: stats.cancelledOrders, variant: "cancelled" as const, subtitle: "Refunded" },
    { key: "balance", title: "Available Balance", value: `₹${stats.availableBalance.toLocaleString("en-IN")}`, variant: "balance" as const, subtitle: "Payout ready" },
    { key: "earnings", title: "Total Earnings", value: `₹${stats.totalEarnings.toLocaleString("en-IN")}`, variant: "earnings" as const, subtitle: "Lifetime" },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-[#212121]">Dashboard</h1>
          <p className="text-xs text-[#878787]">
            Welcome back, {currentSeller?.name || "Seller"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
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
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statRows.map((row) => (
          <SellerStatsCard
            key={row.key}
            title={row.title}
            value={row.value}
            subtitle={row.subtitle}
            variant={row.variant}
            change={changeByVariant[row.key]}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <div className="lg:col-span-2">
          <div className="rounded-sm border border-[#E0E0E0] bg-white p-4 shadow-sm mb-4">
            <h3 className="text-sm font-bold text-[#212121] mb-3">Sales Overview</h3>
            <SalesChart data={salesData} />
          </div>
          <div className="rounded-sm border border-[#E0E0E0] bg-white p-4 shadow-sm">
            <h3 className="text-sm font-bold text-[#212121] mb-3">Monthly Revenue</h3>
            <RevenueChart data={revenueData} />
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-sm border border-[#E0E0E0] bg-white p-4 shadow-sm">
            <h3 className="text-sm font-bold text-[#212121] mb-3 flex items-center gap-2">
              <Package size={16} className="text-[#2874F0]" />
              Top Selling Products
            </h3>
            <TopProducts products={topProducts} />
          </div>
          <div className="rounded-sm border border-[#E0E0E0] bg-white p-4 shadow-sm">
            <h3 className="text-sm font-bold text-[#212121] mb-3 flex items-center gap-2">
              <Clock size={16} className="text-[#F9A825]" />
              Low Stock Alerts
            </h3>
            <LowStockAlerts products={lowStock} />
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="rounded-sm border border-[#E0E0E0] bg-white shadow-sm">
        <div className="px-4 py-3 border-b border-[#F0F0F0] flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#212121] flex items-center gap-2">
            <LayoutDashboard size={16} className="text-[#2874F0]" />
            Recent Orders
          </h3>
          <Link
            href="/seller/orders"
            className="text-[11px] font-semibold text-[#2874F0] hover:underline"
          >
            View All Orders
          </Link>
        </div>
        <RecentOrdersTable orders={orders} />
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="h-20 rounded-sm bg-[#E8E8E8] animate-skeleton"></div>
  );
}

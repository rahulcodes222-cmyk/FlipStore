"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  TrendingUp,
  Package,
  ShoppingBag,
  Users,
  IndianRupee,
  AlertTriangle,
  ArrowRight,
  Plus,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  Clock,
  Truck,
  RotateCcw,
} from "lucide-react";
import { adminService } from "@/services/adminService";
import { formatPrice } from "@/utils/formatters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function AdminDashboardClient() {
  const [metrics, setMetrics] = useState<Awaited<ReturnType<typeof adminService.getDashboardMetrics>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartMetric, setChartMetric] = useState<"revenue" | "orders">("revenue");
  const [updatingStockId, setUpdatingStockId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await adminService.getDashboardMetrics();
      setMetrics(data);
    } catch (err) {
      console.error("Failed to load dashboard metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleQuickRestock = async (productId: string, currentStock: number) => {
    setUpdatingStockId(productId);
    try {
      await adminService.updateProductStock(productId, currentStock + 10);
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingStockId(null);
    }
  };

  if (loading || !metrics) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] space-y-3">
        <RefreshCw className="w-8 h-8 text-[#2874F0] animate-spin" />
        <p className="text-sm text-gray-500 font-medium">Loading store metrics &amp; analytics...</p>
      </div>
    );
  }

  const maxChartValue = Math.max(
    ...metrics.salesChart.map((d) => (chartMetric === "revenue" ? d.revenue : d.orders))
  );

  return (
    <div className="space-y-6">
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-[#212121] tracking-tight">Admin Dashboard</h1>
            <span className="bg-blue-100 text-[#2874F0] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Live Mock Data
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Real-time management center for catalog inventory, orders, customer insights, and store metrics.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            className="h-9 text-xs font-semibold border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
          >
            <RefreshCw size={14} className="mr-1.5" />
            Refresh
          </Button>

          <Link href="/admin/products/add">
            <Button size="sm" className="h-9 text-xs font-bold bg-[#2874F0] hover:bg-[#1259c7] text-white">
              <Plus size={14} className="mr-1" />
              Add Product
            </Button>
          </Link>
        </div>
      </div>

      {/* ── 4 KPI Stat Cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Revenue */}
        <div className="bg-white rounded-md border border-gray-200 p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Total Revenue</p>
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <IndianRupee size={20} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-[#212121]">{formatPrice(metrics.totalRevenue)}</p>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] font-bold text-emerald-600">
              <TrendingUp size={13} />
              <span>+18.4% vs last week</span>
            </div>
          </div>
        </div>

        {/* Card 2: Orders */}
        <div className="bg-white rounded-md border border-gray-200 p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Total Orders</p>
            <div className="w-10 h-10 rounded-full bg-blue-50 text-[#2874F0] flex items-center justify-center">
              <ShoppingBag size={20} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-[#212121]">{metrics.totalOrders}</p>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] font-bold text-blue-600">
              <CheckCircle2 size={13} />
              <span>{metrics.recentOrders.length} placed recently</span>
            </div>
          </div>
        </div>

        {/* Card 3: Customers */}
        <div className="bg-white rounded-md border border-gray-200 p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Total Customers</p>
            <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users size={20} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-[#212121]">{metrics.totalCustomers.toLocaleString()}</p>
            <p className="text-[11px] font-semibold text-gray-500 mt-1">Verified shoppers across India</p>
          </div>
        </div>

        {/* Card 4: Products */}
        <div className="bg-white rounded-md border border-gray-200 p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Total Products</p>
            <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
              <Package size={20} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-[#212121]">{metrics.totalProducts}</p>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] font-bold text-amber-600">
              {metrics.lowStockProducts.length > 0 ? (
                <>
                  <AlertTriangle size={13} />
                  <span>{metrics.lowStockProducts.length} low stock alerts</span>
                </>
              ) : (
                <span>All stocks healthy</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Sales Chart & Low Stock Alert Grid ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart (2 columns) */}
        <div className="lg:col-span-2 bg-white rounded-md border border-gray-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-base font-bold text-[#212121]">Weekly Sales &amp; Revenue Trends</h2>
              <p className="text-xs text-gray-500">7-day performance overview for online transactions</p>
            </div>
            <div className="flex items-center bg-gray-100 p-1 rounded-sm text-xs font-semibold">
              <button
                onClick={() => setChartMetric("revenue")}
                className={`px-3 py-1 rounded-sm transition-all ${
                  chartMetric === "revenue"
                    ? "bg-white text-[#2874F0] font-bold shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Revenue (₹)
              </button>
              <button
                onClick={() => setChartMetric("orders")}
                className={`px-3 py-1 rounded-sm transition-all ${
                  chartMetric === "orders"
                    ? "bg-white text-[#2874F0] font-bold shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Order Volume
              </button>
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div className="space-y-2">
            <div className="h-56 flex items-end justify-between gap-2 sm:gap-4 pt-6 pb-2 border-b border-gray-100">
              {metrics.salesChart.map((item) => {
                const val = chartMetric === "revenue" ? item.revenue : item.orders;
                const heightPercent = Math.max(12, Math.round((val / maxChartValue) * 100));

                return (
                  <div key={item.day} className="flex-1 flex flex-col items-center h-full justify-end group">
                    {/* Tooltip value */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity mb-2 bg-[#212121] text-white text-[10px] font-bold py-1 px-2 rounded pointer-events-none whitespace-nowrap shadow-md">
                      {chartMetric === "revenue" ? formatPrice(item.revenue) : `${item.orders} orders`}
                    </div>
                    {/* Bar */}
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full max-w-[48px] rounded-t-sm transition-all duration-300 group-hover:brightness-110 ${
                        chartMetric === "revenue"
                          ? "bg-gradient-to-t from-[#2874F0] to-[#5b95f5]"
                          : "bg-gradient-to-t from-emerald-600 to-emerald-400"
                      }`}
                    />
                    <span className="text-xs font-bold text-gray-600 mt-2">{item.day}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between text-[11px] text-gray-400 font-medium px-1 pt-1">
              <span>Mon — Active sales start</span>
              <span>Weekend Peak Performance</span>
            </div>
          </div>
        </div>

        {/* Low Stock Alerts (1 column) */}
        <div className="bg-white rounded-md border border-gray-200 p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <AlertTriangle className="text-amber-500 w-5 h-5" />
              <h2 className="text-base font-bold text-[#212121]">Low Stock Items</h2>
            </div>
            <Link
              href="/admin/products"
              className="text-xs font-bold text-[#2874F0] hover:underline"
            >
              View All
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-100 py-2">
            {metrics.lowStockProducts.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-500">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                All products have healthy stock levels!
              </div>
            ) : (
              metrics.lowStockProducts.slice(0, 5).map((p) => (
                <div key={p.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="relative w-10 h-10 bg-gray-50 rounded border border-gray-200 shrink-0 overflow-hidden">
                    <Image
                      src={p.thumbnail || p.images[0] || "/placeholder.png"}
                      alt={p.title}
                      fill
                      className="object-contain p-1"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-[#212121] truncate">{p.title}</p>
                    <p className="text-[11px] text-gray-500">{p.brandName}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.2 rounded">
                        {p.stock === 0 ? "Out of Stock" : `Only ${p.stock} left`}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={updatingStockId === p.id}
                    onClick={() => handleQuickRestock(p.id, p.stock)}
                    className="h-7 text-[11px] px-2 text-[#2874F0] border-[#2874F0] hover:bg-blue-50 shrink-0"
                  >
                    +10 Restock
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Best Sellers & Recent Orders Grid ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders (2 columns) */}
        <div className="lg:col-span-2 bg-white rounded-md border border-gray-200 overflow-hidden shadow-xs">
          <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#212121]">Recent Customer Orders</h2>
              <p className="text-xs text-gray-500">Live order stream updated from storefront checkouts</p>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs font-bold text-[#2874F0] hover:underline flex items-center gap-1"
            >
              All Orders <ArrowRight size={13} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f9fafb] text-gray-500 uppercase text-[10px] font-bold tracking-wider border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Items</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {metrics.recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500">
                      No orders placed yet.
                    </td>
                  </tr>
                ) : (
                  metrics.recentOrders.map((order) => {
                    const statusColors: Record<string, string> = {
                      PLACED: "bg-blue-50 text-blue-700 border-blue-200",
                      CONFIRMED: "bg-indigo-50 text-indigo-700 border-indigo-200",
                      PROCESSING: "bg-amber-50 text-amber-700 border-amber-200",
                      SHIPPED: "bg-purple-50 text-purple-700 border-purple-200",
                      OUT_FOR_DELIVERY: "bg-cyan-50 text-cyan-700 border-cyan-200",
                      DELIVERED: "bg-emerald-50 text-emerald-700 border-emerald-200",
                      CANCELLED: "bg-red-50 text-red-700 border-red-200",
                    };

                    return (
                      <tr key={order.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-gray-900">
                          {order.orderNumber}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-semibold text-gray-900">{order.shippingAddress?.name || "Customer"}</p>
                          <p className="text-[10px] text-gray-400">{order.shippingAddress?.city}</p>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {order.items.length} {order.items.length === 1 ? "item" : "items"}
                        </td>
                        <td className="py-3 px-4 font-bold text-gray-900">
                          {formatPrice(order.pricing.totalAmount)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              statusColors[order.orderStatus] || "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {order.orderStatus.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            href="/admin/orders"
                            className="font-bold text-[#2874F0] hover:underline"
                          >
                            Manage
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Best-Selling Products (1 column) */}
        <div className="bg-white rounded-md border border-gray-200 p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h2 className="text-base font-bold text-[#212121]">Best Sellers</h2>
              <p className="text-xs text-gray-500">Top rated products in catalog</p>
            </div>
            <Link
              href="/admin/products"
              className="text-xs font-bold text-[#2874F0] hover:underline"
            >
              Catalog
            </Link>
          </div>

          <div className="divide-y divide-gray-100 flex-1">
            {metrics.bestSellingProducts.map((p, idx) => (
              <div key={p.id} className="py-3 flex items-center gap-3">
                <span className="w-5 text-center text-xs font-extrabold text-gray-400">
                  #{idx + 1}
                </span>
                <div className="relative w-11 h-11 bg-gray-50 rounded border border-gray-200 shrink-0 overflow-hidden">
                  <Image
                    src={p.thumbnail || p.images[0] || "/placeholder.png"}
                    alt={p.title}
                    fill
                    className="object-contain p-1"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-[#212121] truncate">{p.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-bold text-gray-900">{formatPrice(p.price)}</span>
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1 rounded">
                      ★ {p.rating}
                    </span>
                  </div>
                </div>
                <Link
                  href={`/admin/products/${p.id}/edit`}
                  className="text-gray-400 hover:text-[#2874F0] p-1"
                  title="Edit product"
                >
                  <ArrowRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

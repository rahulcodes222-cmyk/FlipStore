"use client";

import { useEffect, useState } from "react";
import { useHydration } from "@/hooks/useHydration";
import { useSellerStore } from "@/store/useSellerStore";
import { sellerEarningsService, sellerPerformanceService } from "@/services";
import { useToast } from "@/components/common/Toast";
import { Button } from "@/components/ui/button";
import { EarningsSummaryCard } from "@/components/seller/EarningsSummaryCard";
import { CommissionBreakdown } from "@/components/seller/CommissionBreakdown";
import { RevenueAnalytics } from "@/components/seller/RevenueAnalytics";
import { SalesByCategoryChart } from "@/components/seller/SalesByCategoryChart";
import { ProductPerformanceChart } from "@/components/seller/ProductPerformanceChart";
import { SellerPerformanceCard } from "@/components/seller/SellerPerformanceCard";
import { ReportExportButton } from "@/components/seller/ReportExportButton";
import type { EarningsSummary } from "@/types";
import { cn } from "@/lib/utils";

const DATE_FILTERS = [
  { label: "Last 7 Days", value: "7d" },
  { label: "Last 30 Days", value: "30d" },
  { label: "Last 90 Days", value: "90d" },
  { label: "Last 6 Months", value: "180d" },
];

export default function SellerEarningsPage() {
  const isHydrated = useHydration();
  const { seller } = useSellerStore();
  const { success, error } = useToast();
  const sellerId = (isHydrated ? seller?.id : null) || "slr-001";

  const [summary, setSummary] = useState<(EarningsSummary & { dateWise?: any[] }) | null>(null);
  const [performance, setPerformance] = useState<any>(null);
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("30d");
  const [period, setPeriod] = useState<"daily" | "monthly">("daily");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const [s, p, daily, monthly] = await Promise.all([
          sellerEarningsService.getEarningsSummary(sellerId),
          sellerPerformanceService.getPerformance(sellerId).catch(() => null),
          sellerEarningsService.getEarningsData(sellerId, "daily").catch(() => []),
          sellerEarningsService.getEarningsData(sellerId, "monthly").catch(() => []),
        ]);
        if (!mounted) return;
        setSummary(s as any);
        setPerformance(p);
        setDailyData(daily);
        setMonthlyData(monthly);
      } catch {
        error("Failed to load earnings data");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [sellerId, error]);

  const handleDownload = (type: string) => success(`${type} report downloaded`);

  if (loading || !summary) {
    return (
      <div className="p-4 sm:p-6 space-y-6">
        <h1 className="text-lg font-bold text-[#212121]">Earnings</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4,5,6,7,8].map((i) => <div key={i} className="h-20 rounded-sm bg-[#E8E8E8] animate-skeleton" />)}
        </div>
      </div>
    );
  }

  const commissionPct = summary.grossSales > 0 ? Number(((summary.platformCommission / summary.grossSales) * 100).toFixed(2)) : 0;
  const chartRows = period === "daily" ? dailyData : monthlyData;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-[#212121]">Earnings</h1>
          <p className="text-xs text-[#878787]">Server-calculated earnings, commissions, and payout-ready balance</p>
        </div>
        <div className="flex items-center gap-2"><ReportExportButton type="EARNINGS" onDownload={() => handleDownload("Earnings")} /></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <EarningsSummaryCard title="Total Sales" value={`₹${summary.grossSales.toLocaleString("en-IN")}`} variant="gross" subtitle="Gross sales" />
        <EarningsSummaryCard title="Gross Revenue" value={`₹${(summary.grossRevenue ?? summary.grossSales).toLocaleString("en-IN")}`} variant="revenue" subtitle="Before deductions" />
        <EarningsSummaryCard title="Commission Deductions" value={`₹${summary.platformCommission.toLocaleString("en-IN")}`} variant="commission" subtitle="Platform commission" />
        <EarningsSummaryCard title="Net Earnings" value={`₹${summary.netEarnings.toLocaleString("en-IN")}`} variant="net" subtitle="After commission & refunds" />
        <EarningsSummaryCard title="Pending Earnings" value={`₹${(summary.pendingEarnings ?? summary.pendingPayments).toLocaleString("en-IN")}`} variant="pending" subtitle="Awaiting settlement" />
        <EarningsSummaryCard title="Available Balance" value={`₹${summary.availableBalance.toLocaleString("en-IN")}`} variant="balance" subtitle="Ready for payout" />
        <EarningsSummaryCard title="Completed Payouts" value={`₹${(summary.completedPayouts ?? summary.totalPaid).toLocaleString("en-IN")}`} variant="paid" subtitle="Paid out" />
        <EarningsSummaryCard title="Refund Deductions" value={`₹${summary.refundDeductions.toLocaleString("en-IN")}`} variant="refund" subtitle="Returns/cancellations" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-sm border border-[#E0E0E0] bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-[#212121] flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#2874F0]" />Earnings Trend</h3>
              <div className="flex gap-2">
                <Button variant={period === "daily" ? "primary" : "outline"} size="sm" onClick={() => setPeriod("daily")}>Daily</Button>
                <Button variant={period === "monthly" ? "primary" : "outline"} size="sm" onClick={() => setPeriod("monthly")}>Monthly</Button>
              </div>
            </div>
            <RevenueAnalytics data={chartRows} />
          </div>

          <div className="rounded-sm border border-[#E0E0E0] bg-white p-4 shadow-sm">
            <h3 className="text-sm font-bold text-[#212121] mb-3">Date-wise Earnings Report</h3>
            {chartRows.length === 0 ? (
              <p className="text-sm text-[#878787]">No earnings records yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead className="border-b border-[#F0F0F0] bg-[#F9FAFB]">
                    <tr>
                      <th className="px-3 py-2 text-left text-[10px] font-bold text-[#878787] uppercase">Date</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold text-[#878787] uppercase">Gross Sales</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold text-[#878787] uppercase">Commission</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold text-[#878787] uppercase">Net Earnings</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0F0F0]">
                    {chartRows.map((r: any) => (
                      <tr key={r.date}>
                        <td className="px-3 py-2 text-[#212121]">{r.date}</td>
                        <td className="px-3 py-2 text-[#212121]">₹{Number(r.grossSales || 0).toLocaleString("en-IN")}</td>
                        <td className="px-3 py-2 text-[#E53935]">₹{Number(r.commission || 0).toLocaleString("en-IN")}</td>
                        <td className="px-3 py-2 font-medium text-[#212121]">₹{Number(r.netEarnings || 0).toLocaleString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-sm border border-[#E0E0E0] bg-white p-4 shadow-sm">
            <h3 className="text-sm font-bold text-[#212121] mb-3 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#388E3C]" />Commission Breakdown</h3>
            <CommissionBreakdown
              breakdown={{
                sellingPrice: summary.grossSales,
                commissionPercentage: commissionPct,
                commissionAmount: summary.platformCommission,
                applicableCharges: summary.shippingCharges || 0,
                refundDeductions: summary.refundDeductions,
                sellerNetAmount: summary.netEarnings,
              }}
            />
            <p className="text-[10px] text-[#878787] mt-2">Commission is calculated server-side per eligible order item using admin-configured rules.</p>
          </div>

          <div className="rounded-sm border border-[#E0E0E0] bg-white p-4 shadow-sm"><h3 className="text-sm font-bold text-[#212121] mb-3">Sales by Category</h3><SalesByCategoryChart data={[]} /></div>
          <div className="rounded-sm border border-[#E0E0E0] bg-white p-4 shadow-sm"><h3 className="text-sm font-bold text-[#212121] mb-3">Top Products</h3><ProductPerformanceChart data={[]} /></div>
        </div>
      </div>

      {performance ? <div className="rounded-sm border border-[#E0E0E0] bg-white shadow-sm"><SellerPerformanceCard performance={performance} /></div> : null}
    </div>
  );
}

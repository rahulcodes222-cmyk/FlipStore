"use client";

import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown, TrendingUp, DollarSign, Users, Package, Clock } from "lucide-react";

interface SellerStatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  variant: "revenue" | "orders" | "products" | "customers" | "pending" | "cancelled" | "balance" | "earnings";
  change?: { value: number; positive: boolean };
}

const statConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  revenue: { icon: <DollarSign size={20} />, color: "text-[#2874F0] bg-[#2874F0]/10" },
  orders: { icon: <Package size={20} />, color: "text-[#FB641B] bg-[#FB641B]/10" },
  products: { icon: <Package size={20} />, color: "text-[#388E3C] bg-[#388E3C]/10" },
  customers: { icon: <Users size={20} />, color: "text-[#878787] bg-[#878787]/10" },
  pending: { icon: <Clock size={20} />, color: "text-[#F9A825] bg-[#F9A825]/10" },
  cancelled: { icon: <ArrowDown size={20} />, color: "text-[#E53935] bg-[#E53935]/10" },
  balance: { icon: <DollarSign size={20} />, color: "text-[#2874F0] bg-[#2874F0]/10" },
  earnings: { icon: <TrendingUp size={20} />, color: "text-[#388E3C] bg-[#388E3C]/10" },
};

export function SellerStatsCard({
  title,
  value,
  subtitle,
  variant,
  change,
}: SellerStatsCardProps) {
  const config = statConfig[variant];
  return (
    <div className={cn("rounded-sm border border-[#E0E0E0] bg-white p-4 shadow-sm", "flex flex-col")}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs md:text-sm text-[#878787] font-medium">{title}</p>
        <div className={cn("p-1.5 rounded-sm", config.color)}>{config.icon}</div>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-lg font-bold text-[#212121]">{value}</span>
        {subtitle && <span className="text-xs text-[#878787]">{subtitle}</span>}
      </div>
      {change && (
        <div className="mt-1.5 flex items-center gap-1">
          {change.positive ? (
            <ArrowUp size={10} className="text-[#388E3C]" />
          ) : (
            <ArrowDown size={10} className="text-[#E53935]" />
          )}
          <span className={`text-xs font-medium ${change.positive ? "text-[#388E3C]" : "text-[#E53935]"}`}>
            {change.positive ? "+" : "-"}{change.value}%
          </span>
          <span className="text-xs text-[#878787]">vs last period</span>
        </div>
      )}
    </div>
  );
}

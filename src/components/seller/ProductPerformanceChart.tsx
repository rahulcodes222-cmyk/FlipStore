"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { ProductPerformanceData } from "@/types";
import { cn } from "@/lib/utils";

interface ProductPerformanceChartProps {
  data: ProductPerformanceData[];
  className?: string;
}

export function ProductPerformanceChart({ data, className }: ProductPerformanceChartProps) {
  const sorted = [...data].sort((a, b) => b.revenue - a.revenue).slice(0, 6);
  return (
    <div className={cn("rounded-sm border border-[#E0E0E0] bg-white p-4 shadow-sm", className)}>
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sorted}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
            <XAxis dataKey="productName" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={40} />
            <Tooltip
              contentStyle={{ backgroundColor: "#fff", border: "1px solid #E0E0E0", borderRadius: 4 }}
              itemStyle={{ color: "#212121" }}
              labelStyle={{ fontSize: 11, fontWeight: 600, color: "#878787" }}
            />
            <Bar dataKey="revenue" fill="#2874F0" radius={[4, 4, 0, 0]}>
              {sorted.map((entry, index) => (
                <Cell key={`cell-${index}`} fill="#2874F0" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

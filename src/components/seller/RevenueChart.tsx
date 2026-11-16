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
import type { RevenueDataPoint } from "@/types";
import { cn } from "@/lib/utils";

interface RevenueChartProps {
  data: RevenueDataPoint[];
  className?: string;
}

export function RevenueChart({ data, className }: RevenueChartProps) {
  return (
    <div className={cn("rounded-sm border border-[#E0E0E0] bg-white p-4 shadow-sm", className)}>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
            <Tooltip
              contentStyle={{ backgroundColor: "#fff", border: "1px solid #E0E0E0", borderRadius: 4 }}
              itemStyle={{ color: "#212121" }}
              labelStyle={{ fontSize: 11, fontWeight: 600, color: "#878787" }}
            />
            <Bar
              dataKey="revenue"
              fill="#2874F0"
              radius={[4, 4, 0, 0]}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill="#2874F0" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

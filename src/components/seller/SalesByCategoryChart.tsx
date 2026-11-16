"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { CategorySalesData } from "@/types";
import { cn } from "@/lib/utils";

const COLORS = ["#2874F0", "#FB641B", "#388E3C", "#F9A825", "#E53935", "#878787", "#6C63FF", "#00C49F"];

interface SalesByCategoryChartProps {
  data: CategorySalesData[];
  className?: string;
}

export function SalesByCategoryChart({ data, className }: SalesByCategoryChartProps) {
  return (
    <div className={cn("rounded-sm border border-[#E0E0E0] bg-white p-4 shadow-sm", className)}>
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              contentStyle={{ backgroundColor: "#fff", border: "1px solid #E0E0E0", borderRadius: 4 }}
              itemStyle={{ color: "#212121" }}
              labelStyle={{ fontSize: 11, fontWeight: 600, color: "#878787" }}
            />
            <Pie
              data={data}
              dataKey="revenue"
              nameKey="category"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              fill="#8884d8"
              labelLine={false}
              label={{ position: "outside", fontSize: 10, fill: "#878787" }}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

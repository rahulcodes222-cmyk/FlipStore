"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Users, Clock, RefreshCcw } from "lucide-react";
import { useHydration } from "@/hooks/useHydration";
import { useSellerStore } from "@/store/useSellerStore";
import { sellerCustomerService } from "@/services";
import { useToast } from "@/components/common/Toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { SellerCustomer } from "@/types";

export default function SellerCustomersPage() {
  const isHydrated = useHydration();
  const { seller } = useSellerStore();
  const { toast, success, error } = useToast();
  const router = useRouter();
  const currentSeller = isHydrated ? seller : null;
  const sellerId = currentSeller?.id || "slr-001";

  const [customers, setCustomers] = useState<SellerCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const items = await sellerCustomerService.getCustomers(sellerId);
        if (mounted) setCustomers(items);
      } catch {
        error("Failed to load customers");
      } finally {
        if (mounted) setLoading(false);
    }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [sellerId, toast]);

  const filteredCustomers = customers.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.phone?.toLowerCase().includes(q) ?? false) ||
      (c.location?.toLowerCase().includes(q) ?? false)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-[#212121]">Customers</h1>
          <p className="text-xs text-[#878787]">Manage your customers and their order history</p>
        </div>
        <Link
          href="/seller/dashboard"
          className="text-[11px] font-semibold text-[#2874F0] hover:underline flex items-center gap-1"
        >
          <span>← Back to Dashboard</span>
        </Link>
      </div>

      <div className="rounded-sm border border-[#E0E0E0] bg-white p-4 shadow-sm flex items-center gap-4">
        <div className="relative flex-1 min-w-[280px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#878787]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, phone or location…"
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="sm">
          <RefreshCcw size={16} /> Refresh
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 rounded-sm border border-[#E0E0E0] bg-white p-4 shadow-sm">
          <div className="text-xs text-[#878787] uppercase tracking-wider font-bold">Total Customers</div>
          <div className="text-lg font-bold text-[#212121]">{customers.length}</div>
        </div>
        <div className="flex-1 rounded-sm border border-[#E0E0E0] bg-white p-4 shadow-sm">
          <div className="text-xs text-[#878787] uppercase tracking-wider font-bold">Total Revenue</div>
          <div className="text-lg font-bold text-[#212121]">
            ₹{customers.reduce((sum, c) => sum + c.totalSpending, 0).toLocaleString("en-IN")}
          </div>
        </div>
        <div className="flex-1 rounded-sm border border-[#E0E0E0] bg-white p-4 shadow-sm">
          <div className="text-xs text-[#878787] uppercase tracking-wider font-bold">Total Orders</div>
          <div className="text-lg font-bold text-[#212121]">
            {customers.reduce((sum, c) => sum + c.totalOrders, 0)}
          </div>
        </div>
      </div>

      <div className={cn("rounded-sm border border-[#E0E0E0] bg-white shadow-sm", loading ? "pointer-events-none opacity-50" : "")}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="border-b border-[#F0F0F0] bg-[#F9FAFB]">
              <tr>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-[#878787] uppercase">Customer</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-[#878787] uppercase">Email</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-[#878787] uppercase">Phone</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-[#878787] uppercase">Total Orders</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-[#878787] uppercase">Total Spending</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-[#878787] uppercase">Last Order</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-[#878787] uppercase">Location</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-[#878787] uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F0F0]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center">
                    <div className="h-24 rounded-sm bg-[#E8E8E8] animate-skeleton w-3/4 mx-auto" />
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center">
                    <p className="text-sm text-[#878787]">No customers found.</p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-[#F1F3F6] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-[#eaf2ff] flex items-center justify-center text-[#2874F0] font-medium">
                          {customer.name.charAt(0)}
                        </div>
                        <div className="text-sm font-medium text-[#212121]">{customer.name}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#212121]">{customer.email}</td>
                    <td className="px-4 py-3 text-sm text-[#212121]">{customer.phone || "-"}</td>
                    <td className="px-4 py-3 text-sm font-medium text-[#212121]">{customer.totalOrders}</td>
                    <td className="px-4 py-3 text-sm font-medium text-[#212121]">
                      ₹{customer.totalSpending.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#212121]">
                      {new Date(customer.lastOrderDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#878787]">{customer.location || "-"}</td>
                    <td className="px-4 py-3">
                      <Button variant="outline" size="sm" onClick={() => router.push(`/seller/customers/${customer.id}`)}>
                        Details
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

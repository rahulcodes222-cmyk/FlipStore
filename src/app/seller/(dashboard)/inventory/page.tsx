"use client";

import { useEffect, useState } from "react";
import {
  Search,
  RefreshCcw,
  Clock,
} from "lucide-react";
import { useHydration } from "@/hooks/useHydration";
import { useSellerStore } from "@/store/useSellerStore";
import { sellerInventoryService } from "@/services";
import { useToast } from "@/components/common/Toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SellerStatsCard } from "@/components/seller/SellerStatsCard";
import { cn } from "@/lib/utils";
import type { InventoryItem, StockHistoryEntry, StockStatus } from "@/types";

const STOCK_STATUS_CONFIG: Record<StockStatus, { bg: string; text: string; border: string }> = {
  IN_STOCK: { bg: "bg-[#E8F5E9]", text: "text-[#2E7D32]", border: "border-[#C8E6C9]" },
  LOW_STOCK: { bg: "bg-[#FFF8E1]", text: "text-[#B26A00]", border: "border-[#FFE082]" },
  OUT_OF_STOCK: { bg: "bg-[#FFEBEE]", text: "text-[#C62828]", border: "border-[#FFCDD2]" },
};

export default function SellerInventoryPage() {
  const isHydrated = useHydration();
  const { seller } = useSellerStore();
  const { success, error } = useToast();
  const currentSeller = isHydrated ? seller : null;
  const sellerId = currentSeller?.id || "slr-001";

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [history, setHistory] = useState<StockHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState<StockStatus | "">("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStock, setEditStock] = useState("");

  const loadAll = async () => {
    const [items, s, hist] = await Promise.all([
      sellerInventoryService.getInventory(sellerId),
      sellerInventoryService.getInventoryStats(sellerId),
      sellerInventoryService.getStockHistory(sellerId).catch(() => [] as StockHistoryEntry[]),
    ]);
    setInventory(items);
    setStats(s);
    setHistory(Array.isArray(hist) ? hist : []);
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const [items, s, hist] = await Promise.all([
          sellerInventoryService.getInventory(sellerId),
          sellerInventoryService.getInventoryStats(sellerId),
          sellerInventoryService.getStockHistory(sellerId).catch(() => [] as StockHistoryEntry[]),
        ]);
        if (mounted) {
          setInventory(items);
          setStats(s);
          setHistory(Array.isArray(hist) ? hist : []);
        }
      } catch {
        error("Failed to load inventory");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [sellerId, error]);

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      item.productName.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase());
    const matchesStock = !stockFilter || item.status === stockFilter;
    return matchesSearch && matchesStock;
  });

  const handleUpdateStock = async (item: InventoryItem) => {
    const stock = parseInt(editStock, 10);
    if (isNaN(stock) || stock < 0) {
      error("Enter a valid stock quantity");
      return;
    }
    try {
      await sellerInventoryService.updateStock(
        sellerId,
        item.productId,
        stock,
        { variantId: (item as any).variantId, sku: item.sku }
      );
      setEditingId(null);
      setEditStock("");
      success("Stock updated");
      await loadAll();
    } catch (e: any) {
      error(e?.message || "Failed to update stock");
    }
  };

  const handleBulkUpdate = async () => {
    if (filteredInventory.length === 0) return;
    try {
      await sellerInventoryService.bulkUpdateStock(
        sellerId,
        filteredInventory.map((i: any) => ({ productId: i.productId, stock: i.stock + 10, variantId: i.variantId, sku: i.sku }))
      );
      success("Bulk stock updated");
      await loadAll();
    } catch (e: any) {
      error(e?.message || "Bulk update failed");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-[#212121]">Inventory</h1>
          <p className="text-xs text-[#878787]">Track and manage your stock levels</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleBulkUpdate}>
            <RefreshCcw size={16} /> Bulk Restock (+10)
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SellerStatsCard
            title="Total Products"
            value={stats.totalProducts}
            variant="products"
            subtitle="Listed items"
          />
          <SellerStatsCard
            title="Total Stock"
            value={stats.totalStock}
            variant="products"
            subtitle="Units available"
          />
          <SellerStatsCard
            title="Available Stock"
            value={stats.availableStock}
            variant="balance"
            subtitle="Ready to ship"
            change={{ value: 5, positive: true }}
          />
          <SellerStatsCard
            title="Low Stock"
            value={stats.lowStock}
            variant="pending"
            subtitle="Below threshold"
            change={{ value: 2, positive: false }}
          />
        </div>
      )}

      {/* Search & Filter */}
      <div className="rounded-sm border border-[#E0E0E0] bg-white p-4 shadow-sm flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[250px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#878787]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product name, SKU or category…"
            className="pl-10"
          />
        </div>
        <select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value as StockStatus | "")}
          className="flex h-9 w-32 rounded-sm border border-[#E0E0E0] bg-white px-2 py-1 text-xs focus-visible:ring-1 focus-visible:ring-[#2874F0]"
        >
          <option value="">All Stock Status</option>
          <option value="IN_STOCK">In Stock</option>
          <option value="LOW_STOCK">Low Stock</option>
          <option value="OUT_OF_STOCK">Out of Stock</option>
        </select>
      </div>

      {/* Inventory Table */}
      <div className={cn("rounded-sm border border-[#E0E0E0] bg-white shadow-sm", loading ? "pointer-events-none opacity-50" : "")}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="border-b border-[#F0F0F0] bg-[#F9FAFB]">
              <tr>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-[#878787] uppercase">Image</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-[#878787] uppercase">Product</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-[#878787] uppercase">SKU</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-[#878787] uppercase">Category</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-[#878787] uppercase">Stock</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-[#878787] uppercase">Threshold</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-[#878787] uppercase">Status</th>
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
              ) : filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center">
                    <p className="text-sm text-[#878787]">No inventory items found.</p>
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-[#F1F3F6] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="w-8 h-8 rounded-sm overflow-hidden border border-[#E0E0E0] flex-shrink-0">
                        {item.image ? (
                          <img src={item.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-[#F1F3F6] flex items-center justify-center text-[10px] text-[#878787]">
                            {item.productName.charAt(0)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-[#212121]">{item.productName}</div>
                      <div className="text-[10px] text-[#878787]">{item.id}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#212121]">{item.sku}</td>
                    <td className="px-4 py-3 text-sm text-[#212121]">{item.category}</td>
                    <td className="px-4 py-3 text-sm font-medium text-[#212121]">{item.stock}</td>
                    <td className="px-4 py-3 text-sm text-[#212121]">{item.lowStockThreshold}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold border",
                          STOCK_STATUS_CONFIG[item.status].bg,
                          STOCK_STATUS_CONFIG[item.status].text,
                          STOCK_STATUS_CONFIG[item.status].border
                        )}
                      >
                        {item.status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {editingId === item.id ? (
                        <div className="flex gap-2">
                          <Input
                            value={editStock}
                            onChange={(e) => setEditStock(e.target.value)}
                            className="h-8 w-16 text-xs border border-[#E0E0E0] rounded-sm px-2"
                          />
                          <Button variant="primary" size="sm" onClick={() => handleUpdateStock(item)}>
                            Save
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setEditingId(null)}>
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingId(item.id);
                            setEditStock(String(item.stock));
                          }}
                        >
                          Update Stock
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock History */}
      <div className="rounded-sm border border-[#E0E0E0] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-[#212121] flex items-center gap-2">
            <Clock size={16} className="text-[#2874F0]" />
            Recent Stock History
          </h3>
        </div>
        <div className="h-64 overflow-y-auto">
          {loading ? (
            <div className="h-24 rounded-sm bg-[#E8E8E8] animate-skeleton w-1/2" />
          ) : history.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-[#878787]">
              No stock history available yet.
            </div>
          ) : (
            <div className="space-y-3">
              {history.slice(0, 20).map((h) => (
                <div key={h.id} className="flex items-center justify-between py-2 border-b border-[#F0F0F0] last:border-0 gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">
                      {h.type === "IN" ? (
                        <span className="bg-[#E8F5E9] text-[#2E7D32] w-full h-full flex items-center justify-center rounded-full">+</span>
                      ) : h.type === "OUT" ? (
                        <span className="bg-[#FFEBEE] text-[#C62828] w-full h-full flex items-center justify-center rounded-full">-</span>
                      ) : (
                        <span className="bg-[#E3F2FD] text-[#1565C0] w-full h-full flex items-center justify-center rounded-full">~</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm text-[#212121] truncate">{h.productName}</div>
                      <div className="text-[10px] text-[#878787] truncate">{h.reason || (h.type === "IN" ? "Stock added" : h.type === "OUT" ? "Stock reduced" : "Stock adjusted")}</div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={cn("font-medium", h.type === "IN" ? "text-[#2E7D32]" : h.type === "OUT" ? "text-[#C62828]" : "text-[#1565C0]")}>
                      {h.type === "IN" ? "+" : h.type === "OUT" ? "-" : "±"}{Math.abs(Number(h.quantity || 0))}
                    </div>
                    <div className="text-[10px] text-[#878787]">{h.createdAt ? new Date(h.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

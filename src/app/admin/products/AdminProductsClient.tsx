"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Check,
  ChevronDown,
  Layers,
} from "lucide-react";
import { Product, Category } from "@/types";
import { adminService } from "@/services/adminService";
import { formatPrice } from "@/utils/formatters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AdminProductsClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [stockFilter, setStockFilter] = useState<"ALL" | "LOW_STOCK" | "OUT_OF_STOCK">("ALL");

  // Inline Stock Edit State
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [stockInputValue, setStockInputValue] = useState<number>(0);

  // Delete State
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prods, cats] = await Promise.all([
        adminService.getProducts({ adminView: true }),
        adminService.getCategories(),
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch (err) {
      console.error("Failed to load products:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Query search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = p.title.toLowerCase().includes(q);
        const matchBrand = p.brandName.toLowerCase().includes(q);
        const matchId = p.id.toLowerCase().includes(q);
        if (!matchTitle && !matchBrand && !matchId) return false;
      }

      // Category filter
      if (selectedCategory !== "ALL") {
        if (
          p.categorySlug.toLowerCase() !== selectedCategory.toLowerCase() &&
          p.categoryId.toLowerCase() !== selectedCategory.toLowerCase()
        ) {
          return false;
        }
      }

      // Stock filter
      if (stockFilter === "LOW_STOCK" && p.stock > 5) return false;
      if (stockFilter === "OUT_OF_STOCK" && p.stock > 0) return false;

      return true;
    });
  }, [products, searchQuery, selectedCategory, stockFilter]);

  const handleUpdateStock = async (id: string) => {
    try {
      await adminService.updateProductStock(id, stockInputValue);
      setProducts((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, stock: stockInputValue, inStock: stockInputValue > 0 } : p
        )
      );
      setEditingStockId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this product? This action cannot be undone.")) {
      return;
    }
    setDeletingId(id);
    try {
      await adminService.deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-[#212121] tracking-tight">Product Catalog</h1>
            <span className="bg-gray-200 text-gray-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {filteredProducts.length} of {products.length} Items
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Manage your e-commerce inventory, pricing, stock levels, and product specifications.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            className="h-9 text-xs font-semibold bg-white border-gray-300"
          >
            <RefreshCw size={13} className="mr-1.5" />
            Refresh
          </Button>

          <Link href="/admin/products/add">
            <Button size="sm" className="h-9 text-xs font-bold bg-[#2874F0] hover:bg-[#1259c7] text-white">
              <Plus size={14} className="mr-1" />
              Add New Product
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Filters & Search Controls ────────────────────────────────────────── */}
      <div className="bg-white rounded-md border border-gray-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex-1 min-w-[240px] max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products by title, brand, or SKU..."
            className="pl-9 h-9 text-xs bg-gray-50 border-gray-200 focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Category Dropdown */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-gray-500 font-medium">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-9 px-3 text-xs bg-white border border-gray-200 rounded font-semibold text-gray-700 focus:outline-none focus:border-[#2874F0]"
            >
              <option value="ALL">All Categories ({categories.length})</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Filter Dropdown */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-gray-500 font-medium">Stock:</span>
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as any)}
              className="h-9 px-3 text-xs bg-white border border-gray-200 rounded font-semibold text-gray-700 focus:outline-none focus:border-[#2874F0]"
            >
              <option value="ALL">All Stock Levels</option>
              <option value="LOW_STOCK">Low Stock (≤ 5)</option>
              <option value="OUT_OF_STOCK">Out of Stock (0)</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Products Table ───────────────────────────────────────────────────── */}
      <div className="bg-white rounded-md border border-gray-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-20 text-center text-gray-500 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin text-[#2874F0] mx-auto mb-2" />
            Loading catalog data...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-16 text-center text-gray-500 text-xs">
            <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="font-bold text-gray-700 text-sm">No products found</p>
            <p className="mt-1">Try adjusting your search criteria or category filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f9fafb] text-gray-500 uppercase text-[10px] font-bold tracking-wider border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Price / MRP</th>
                  <th className="py-3 px-4">Rating</th>
                  <th className="py-3 px-4">Stock Units</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((p) => {
                  const isEditingStock = editingStockId === p.id;
                  const isLowStock = p.stock <= 5 && p.stock > 0;
                  const isOutOfStock = p.stock === 0;

                  return (
                    <tr key={p.id} className="hover:bg-gray-50/70 transition-colors">
                      {/* Product Thumbnail & Title */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3 max-w-sm">
                          <div className="relative w-12 h-12 bg-gray-50 rounded border border-gray-200 shrink-0 overflow-hidden">
                            <Image
                              src={p.thumbnail || p.images[0] || "/placeholder.png"}
                              alt={p.title}
                              fill
                              className="object-contain p-1"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-gray-900 truncate" title={p.title}>
                              {p.title}
                            </p>
                            <p className="text-[11px] text-gray-500 font-medium">
                              Brand: <span className="font-semibold text-gray-700">{p.brandName}</span>
                            </p>
                            <span className="text-[10px] font-mono text-gray-400">SKU: {p.id}</span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-gray-100 text-gray-700 capitalize">
                          {p.categorySlug}
                        </span>
                      </td>

                      {/* Price / MRP */}
                      <td className="py-3.5 px-4 font-bold text-gray-900">
                        <div>{formatPrice(p.price)}</div>
                        <div className="text-[10px] text-gray-400 font-normal line-through">
                          {formatPrice(p.mrp)}
                        </div>
                      </td>

                      {/* Rating */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 font-bold text-emerald-700">
                          <span className="bg-emerald-50 px-1.5 py-0.5 rounded text-[11px]">
                            ★ {p.rating}
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-400">
                          ({p.ratingCount?.toLocaleString() || 0})
                        </span>
                      </td>

                      {/* Stock with inline quick edit */}
                      <td className="py-3.5 px-4">
                        {isEditingStock ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min={0}
                              value={stockInputValue}
                              onChange={(e) => setStockInputValue(Number(e.target.value))}
                              className="w-16 h-7 px-1.5 border border-[#2874F0] rounded text-xs text-center font-bold"
                              autoFocus
                            />
                            <button
                              onClick={() => handleUpdateStock(p.id)}
                              className="w-7 h-7 bg-emerald-600 hover:bg-emerald-700 text-white rounded flex items-center justify-center"
                              title="Save stock"
                            >
                              <Check size={12} />
                            </button>
                            <button
                              onClick={() => setEditingStockId(null)}
                              className="text-gray-400 hover:text-gray-600 text-xs px-1"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-bold ${
                                isOutOfStock
                                  ? "text-red-600 bg-red-50 px-1.5 py-0.5 rounded text-[11px]"
                                  : isLowStock
                                  ? "text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded text-[11px]"
                                  : "text-gray-900"
                              }`}
                            >
                              {p.stock} units
                            </span>
                            <button
                              onClick={() => {
                                setEditingStockId(p.id);
                                setStockInputValue(p.stock);
                              }}
                              className="text-[10px] text-[#2874F0] hover:underline font-semibold"
                            >
                              Edit
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/products/${p.id}/edit`}
                            className="p-1.5 text-gray-500 hover:text-[#2874F0] hover:bg-blue-50 rounded"
                            title="Edit Product"
                          >
                            <Edit2 size={14} />
                          </Link>

                          <Link
                            href={`/product/${p.slug || p.id}`}
                            target="_blank"
                            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded"
                            title="View on Storefront"
                          >
                            <ExternalLink size={14} />
                          </Link>

                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            disabled={deletingId === p.id}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                            title="Delete Product"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Filter,
  Plus,
  Trash2,
  Copy,
  Edit3,
  Download,
  AlertCircle,
  Package,
  Tag as TagIcon,
  RefreshCcw,
} from "lucide-react";
import { useHydration } from "@/hooks/useHydration";
import { useSellerStore } from "@/store/useSellerStore";
import { sellerProductService } from "@/services";
import { useToast } from "@/components/common/Toast";
import { SellerTable } from "@/components/seller/SellerTable";
import { ConfirmDialog } from "@/components/seller/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { SellerProduct, ProductFilters, ProductStatus } from "@/types";

const STATUS_CONFIG: Record<ProductStatus, { bg: string; text: string; border: string }> = {
  DRAFT: { bg: "bg-[#F5F5F5]", text: "text-[#616161]", border: "border-[#E0E0E0]" },
  PUBLISHED: { bg: "bg-[#E8F5E9]", text: "text-[#2E7D32]", border: "border-[#C8E6C9]" },
  OUT_OF_STOCK: { bg: "bg-[#FFEBEE]", text: "text-[#C62828]", border: "border-[#FFCDD2]" },
  REJECTED: { bg: "bg-[#F5F5F5]", text: "text-[#616161]", border: "border-[#E0E0E0]" },
};

export default function SellerProductsPage() {
  const router = useRouter();
  const isHydrated = useHydration();
  const { seller } = useSellerStore();
  const { toast, success, error } = useToast();
  const currentSeller = isHydrated ? seller : null;
  const sellerId = currentSeller?.id || "slr-001";

  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ProductFilters>({
    search: "",
    category: undefined,
    brand: undefined,
    status: undefined,
    stock: undefined,
    sortBy: "newest",
    page: 1,
    limit: 10,
  });
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [duplicateId, setDuplicateId] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const result = await sellerProductService.getProducts(sellerId, { ...filters, page, limit: filters.limit });
      setProducts(result.data);
      setTotal(result.total);
      setCategories(await sellerProductService.getCategories(sellerId));
      setBrands(await sellerProductService.getBrands(sellerId));
    } catch {
      error("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [sellerId, filters, page, toast]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleStatusChange = async (productId: string, status: ProductStatus) => {
    try {
      await sellerProductService.updateProduct(sellerId, productId, { status });
      success(`Product status updated to ${status}`);
      loadProducts();
    } catch {
      error("Failed to update status");
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await sellerProductService.deleteProduct(sellerId, deleteConfirmId);
      setSelectedIds(new Set());
      setDeleteConfirmId(null);
      success("Product deleted");
      loadProducts();
    } catch {
      error("Failed to delete product");
    }
  };

  const handleDuplicate = async () => {
    if (!duplicateId) return;
    try {
      await sellerProductService.duplicateProduct(sellerId, duplicateId);
      setDuplicateId(null);
      success("Product duplicated");
      loadProducts();
    } catch {
      error("Failed to duplicate product");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    try {
      for (const id of selectedIds) {
        await sellerProductService.deleteProduct(sellerId, id);
      }
      setSelectedIds(new Set());
      success(`${selectedIds.size} product(s) deleted`);
      loadProducts();
    } catch {
      error("Failed to delete products");
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, search: e.target.value, page: 1 });
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value || undefined, page: 1 });
  };

  const columns = [
    { key: "image", label: "Image", width: "60px" },
    { key: "name", label: "Product Name", sortable: true },
    { key: "sku", label: "SKU" },
    { key: "category", label: "Category" },
    { key: "price", label: "Selling Price" },
    { key: "mrp", label: "Original Price" },
    { key: "stock", label: "Stock" },
    { key: "unitsSold", label: "Units Sold" },
    { key: "status", label: "Status" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-[#212121]">Products</h1>
          <p className="text-xs text-[#878787]">Manage your product listings</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="primary" onClick={() => router.push("/seller/products/add")}>
            <Plus size={16} /> Add Product
          </Button>
          {selectedIds.size > 0 && (
            <Button variant="destructive" onClick={handleBulkDelete} size="sm">
              <Trash2 size={16} /> Delete {selectedIds.size}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => toast({ type: "info", message: "Export CSV feature coming soon" })}>
            <Download size={16} /> Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-sm border border-[#E0E0E0] bg-white p-4 shadow-sm flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#878787]" />
          <Input
            value={filters.search}
            onChange={handleSearch}
            placeholder="Search productsâ€¦"
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Category</label>
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange("category", e.target.value)}
            className="flex h-9 w-32 rounded-sm border border-[#E0E0E0] bg-white px-2 py-1 text-xs focus-visible:ring-1 focus-visible:ring-[#2874F0]"
          >
            <option value="">All</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={filters.status || ""}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            className="flex h-9 w-24 rounded-sm border border-[#E0E0E0] bg-white px-2 py-1 text-xs focus-visible:ring-1 focus-visible:ring-[#2874F0]"
          >
            <option value="">Status</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
          </select>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setFilters({ ...filters, page: 1 });
            loadProducts();
          }}
          leftIcon={<RefreshCcw size={14} />}
        >
          Apply
        </Button>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="rounded-sm bg-[#FFF8E1] px-4 py-3 border border-[#FFE082] flex items-center justify-between">
          <span className="text-sm text-[#B26A00]">
            {selectedIds.size} product(s) selected
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setSelectedIds(new Set())}>
              Clear
            </Button>
            <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <SellerTable<SellerProduct>
        columns={columns}
        data={products}
        loading={loading}
        selectedIds={selectedIds}
        onRowSelect={(id, checked) => {
          const next = new Set(selectedIds);
          if (checked) next.add(id);
          else next.delete(id);
          setSelectedIds(next);
        }}
        onSelectAll={(checked) => {
          const next = new Set<string>();
          if (checked) products.forEach((p) => next.add(p.id));
          setSelectedIds(next);
        }}
        getRowId={(row) => String(row?.id || "")}
        renderRowActions={(row) => {
          const id = String(row?.id || "").trim();
          const valid = !!id && id !== "undefined" && id !== "null";
          if (!valid) {
            return <span className="text-xs text-[#878787]">Unavailable</span>;
          }
          return (
            <div className="flex gap-1">
              <Link
                href={`/seller/products/${encodeURIComponent(id)}/edit`}
                className="p-2 text-[#878787] hover:text-[#2874F0] hover:bg-[#F1F3F6] rounded-sm transition-colors"
                title="Edit"
              >
                <Edit3 size={16} />
              </Link>
              <button
                type="button"
                onClick={() => setDuplicateId(id)}
                className="p-2 text-[#878787] hover:text-[#2874F0] hover:bg-[#F1F3F6] rounded-sm transition-colors"
                title="Duplicate"
              >
                <Copy size={16} />
              </button>
              <button
                type="button"
                onClick={() => setDeleteConfirmId(id)}
                className="p-2 text-[#878787] hover:text-[#E53935] hover:bg-[#FFEBEE] rounded-sm transition-colors"
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            </div>
          );
        }}
      />

      {/* Pagination */}
      {total > 0 && (
        <div className="flex items-center justify-between text-xs text-[#878787]">
          <span>Showing {(page - 1) * (filters.limit || 10) + 1} to {Math.min(page * (filters.limit || 10), total)} of {total}</span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page * (filters.limit || 10) >= total}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Confirm Dialogs */}
      <ConfirmDialog
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleDelete}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
        confirmLabel="Delete"
      />
      <ConfirmDialog
        isOpen={!!duplicateId}
        onClose={() => setDuplicateId(null)}
        onConfirm={handleDuplicate}
        title="Duplicate Product"
        message="Create a copy of this product as a draft?"
        confirmLabel="Duplicate"
      />
    </div>
  );
}


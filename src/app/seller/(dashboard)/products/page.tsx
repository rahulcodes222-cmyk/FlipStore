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
import type { SellerProduct, ProductFilters } from "@/types";

const APPROVAL_CONFIG: Record<string, { bg: string; text: string; border: string; label: string }> = {
  Draft: { bg: "bg-[#F5F5F5]", text: "text-[#616161]", border: "border-[#E0E0E0]", label: "Draft" },
  "Pending Approval": { bg: "bg-[#FFF8E1]", text: "text-[#B26A00]", border: "border-[#FFE082]", label: "Pending Approval" },
  "Under Review": { bg: "bg-[#E3F2FD]", text: "text-[#1565C0]", border: "border-[#BBDEFB]", label: "Under Review" },
  Approved: { bg: "bg-[#E8F5E9]", text: "text-[#2E7D32]", border: "border-[#C8E6C9]", label: "Approved" },
  Rejected: { bg: "bg-[#FFEBEE]", text: "text-[#C62828]", border: "border-[#FFCDD2]", label: "Rejected" },
  "Changes Requested": { bg: "bg-[#FFF3E0]", text: "text-[#E65100]", border: "border-[#FFE0B2]", label: "Changes Requested" },
  Active: { bg: "bg-[#E8F5E9]", text: "text-[#2E7D32]", border: "border-[#C8E6C9]", label: "Active" },
  Inactive: { bg: "bg-[#F5F5F5]", text: "text-[#616161]", border: "border-[#E0E0E0]", label: "Inactive" },
};

function getDisplayStatus(p: any): string {
  const approval = String(p?.approvalStatus || "Draft");
  const publication = String(p?.productStatus || "Inactive");
  if (approval === "Approved" && publication === "Active") return "Active";
  if (approval === "Approved" && publication === "Inactive") return "Approved";
  return approval;
}

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

  const handleSubmitForApproval = async (productId: string) => {
    try {
      await sellerProductService.submitProduct(sellerId, productId);
      success("Product submitted for approval");
      loadProducts();
    } catch (e: any) {
      error(e?.message || "Failed to submit for approval");
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
    {
      key: "image", label: "Image", width: "60px", render: (_: any, row: any) => (
        <div className="h-10 w-10 rounded-sm border border-[#E0E0E0] bg-[#F9FAFB] overflow-hidden flex items-center justify-center">
          {row.thumbnail ? <img src={row.thumbnail} alt={row.name} className="h-full w-full object-cover" /> : <Package size={14} className="text-[#9E9E9E]" />}
        </div>
      )
    },
    { key: "name", label: "Product Name", sortable: true, render: (_: any, row: any) => (
      <div className="min-w-[180px]">
        <p className="font-semibold text-[#212121] line-clamp-1">{row.name}</p>
        <p className="text-[10px] text-[#878787] line-clamp-1">{row.slug}</p>
        {(row.rejectionReason || row.adminComment) && <p className="text-[10px] text-[#C62828] line-clamp-1 mt-0.5" title={row.rejectionReason || row.adminComment}>{row.rejectionReason ? `Reason: ${row.rejectionReason}` : `Admin: ${row.adminComment}`}</p>}
      </div>
    )},
    { key: "sku", label: "SKU" },
    { key: "category", label: "Category" },
    { key: "price", label: "Selling Price", render: (v: any) => `₹${Number(v || 0).toLocaleString("en-IN")}` },
    { key: "mrp", label: "Original Price", render: (v: any) => `₹${Number(v || 0).toLocaleString("en-IN")}` },
    { key: "stock", label: "Stock" },
    { key: "unitsSold", label: "Units Sold" },
    { key: "approvalStatus", label: "Status", render: (_: any, row: any) => {
      const st = getDisplayStatus(row);
      const cfg = APPROVAL_CONFIG[st] || APPROVAL_CONFIG.Draft;
      return <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap", cfg.bg, cfg.text, cfg.border)}>{cfg.label}</span>;
    }},
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
            className="flex h-9 w-36 rounded-sm border border-[#E0E0E0] bg-white px-2 py-1 text-xs focus-visible:ring-1 focus-visible:ring-[#2874F0]"
          >
            <option value="">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Pending Approval">Pending Approval</option>
            <option value="Under Review">Under Review</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Changes Requested">Changes Requested</option>
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
          const approval = String(row?.approvalStatus || "Draft");
          const canSubmit = ["Draft", "Rejected", "Changes Requested", "Approved"].includes(approval);
          const submitLabel = ["Rejected", "Changes Requested", "Approved"].includes(approval) ? "Resubmit" : "Submit";
          return (
            <div className="flex gap-1 items-center">
              {canSubmit && (
                <button
                  type="button"
                  onClick={() => handleSubmitForApproval(id)}
                  className="px-2 py-1 text-[10px] font-semibold text-[#2874F0] hover:bg-[#E3F2FD] rounded-sm border border-[#BBDEFB]"
                  title="Submit for approval"
                >
                  {submitLabel}
                </button>
              )}
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


"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useHydration } from "@/hooks/useHydration";
import { useSellerStore } from "@/store/useSellerStore";
import { sellerCouponService } from "@/services";
import { useToast } from "@/components/common/Toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CouponForm } from "@/components/seller/CouponForm";
import { CouponTable } from "@/components/seller/CouponTable";
import { ReportExportButton } from "@/components/seller/ReportExportButton";
import { ConfirmDialog } from "@/components/seller/ConfirmDialog";
import type { SellerCoupon, CouponStatus } from "@/types";
import { cn } from "@/lib/utils";

const COUPON_FILTERS = [
  { label: "All Coupons", value: "" },
  { label: "Active", value: "ACTIVE" },
  { label: "Expired", value: "EXPIRED" },
  { label: "Disabled", value: "DISABLED" },
  { label: "Draft", value: "DRAFT" },
];

export default function SellerCouponsPage() {
  const isHydrated = useHydration();
  const { seller } = useSellerStore();
  const { toast, success, error } = useToast();
  const currentSeller = isHydrated ? seller : null;
  const sellerId = currentSeller?.id || "slr-001";

  const [coupons, setCoupons] = useState<SellerCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CouponStatus | "">("");
  const [openForm, setOpenForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const c = await sellerCouponService.getCoupons(sellerId);
        if (mounted) setCoupons(c);
      } catch {
        error("Failed to load coupons");
      } finally {
        if (mounted) setLoading(false);
    }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [sellerId, error]);

  const filteredCoupons = coupons.filter((c) => {
    const q = search.toLowerCase();
    const matchesSearch =
      c.code.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q);
    const matchesStatus = !statusFilter || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreate = async (values: any) => {
    setCreating(true);
    try {
      await sellerCouponService.createCoupon(sellerId, values);
      setOpenForm(false);
      success("Coupon created successfully");
      const c = await sellerCouponService.getCoupons(sellerId);
      setCoupons(c);
    } catch {
      error("Failed to create coupon");
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async (values: any) => {
    if (!editId) return;
    setCreating(true);
    try {
      await sellerCouponService.updateCoupon(sellerId, editId, values);
      setEditId(null);
      success("Coupon updated successfully");
      const c = await sellerCouponService.getCoupons(sellerId);
      setCoupons(c);
    } catch {
      error("Failed to update coupon");
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await sellerCouponService.toggleCouponStatus(sellerId, id);
      const c = await sellerCouponService.getCoupons(sellerId);
      setCoupons(c);
    } catch {
      error("Failed to toggle coupon status");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await sellerCouponService.deleteCoupon(sellerId, deleteId);
      setDeleteId(null);
      success("Coupon deleted successfully");
      const c = await sellerCouponService.getCoupons(sellerId);
      setCoupons(c);
    } catch {
      error("Failed to delete coupon");
    }
  };

  const handleDownload = () => {
    success("Coupons report downloaded");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-[#212121]">Coupons</h1>
          <p className="text-xs text-[#878787]">Create and manage store-specific coupons</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="primary" onClick={() => setOpenForm(true)} className="w-auto">
            Create Coupon
          </Button>
          <ReportExportButton type="SALES" onDownload={handleDownload} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-sm border border-[#E0E0E0] bg-white p-4 shadow-sm">
          <div className="text-xs text-[#878787] uppercase tracking-wider font-bold">Total Coupons</div>
          <div className="text-lg font-bold text-[#212121]">{coupons.length}</div>
        </div>
        <div className="rounded-sm border border-[#E0E0E0] bg-white p-4 shadow-sm">
          <div className="text-xs text-[#878787] uppercase tracking-wider font-bold">Active</div>
          <div className="text-lg font-bold text-[#212121]">{coupons.filter((c) => c.status === "ACTIVE").length}</div>
        </div>
        <div className="rounded-sm border border-[#E0E0E0] bg-white p-4 shadow-sm">
          <div className="text-xs text-[#878787] uppercase tracking-wider font-bold">Expired</div>
          <div className="text-lg font-bold text-[#212121]">{coupons.filter((c) => c.status === "EXPIRED").length}</div>
        </div>
        <div className="rounded-sm border border-[#E0E0E0] bg-white p-4 shadow-sm">
          <div className="text-xs text-[#878787] uppercase tracking-wider font-bold">Total Uses</div>
          <div className="text-lg font-bold text-[#212121]">
            {coupons.reduce((sum, c) => sum + c.usedCount, 0)}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-sm border border-[#E0E0E0] bg-white p-4 shadow-sm flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[280px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#878787] text-[12px]">🔍</span>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by coupon code…"
            className="pl-8"
          />
        </div>
        <div className="flex gap-2">
          {COUPON_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value as CouponStatus | "")}
              className={cn(
                "px-3 py-1.5 rounded-sm text-xs font-medium border transition-colors",
                statusFilter === f.value
                  ? "bg-[#2874F0] border-[#2874F0] text-white"
                  : "bg-white border-[#E0E0E0] text-[#212121] hover:bg-[#F1F3F6]"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <CouponTable
        coupons={filteredCoupons}
        onToggle={handleToggle}
        onDelete={(id) => setDeleteId(id)}
        onEdit={(id) => {
          const coupon = coupons.find((c) => c.id === id);
          if (coupon) {
            setEditId(id);
            setOpenForm(true);
          }
        }}
      />

      {/* Create/Edit Form */}
      {openForm && (
        <div className="rounded-sm border border-[#E0E0E0] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#212121]">
              {editId ? "Edit Coupon" : "Create Coupon"}
            </h3>
            <Button variant="outline" size="sm" onClick={() => setOpenForm(false)}>
              Cancel
            </Button>
          </div>
          <CouponForm
            initialValues={editId ? filteredCoupons.find((c) => c.id === editId) : undefined}
            onSubmit={editId ? handleUpdate : handleCreate}
            isLoading={creating}
          />
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Coupon"
        message="Are you sure you want to delete this coupon? This action cannot be undone."
        confirmLabel="Delete"
      />
    </div>
  );
}

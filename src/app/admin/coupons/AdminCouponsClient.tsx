"use client";

import React, { useState, useEffect } from "react";
import {
  Ticket,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  X,
  Check,
  AlertCircle,
  Calendar,
  Percent,
  IndianRupee,
} from "lucide-react";
import { Coupon } from "@/types";
import { adminService } from "@/services/adminService";
import { formatPrice } from "@/utils/formatters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AdminCouponsClient() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  // Form Fields
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FLAT">("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [minOrderValue, setMinOrderValue] = useState<number>(500);
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<number>(200);
  const [expiryDate, setExpiryDate] = useState("2026-12-31");
  const [isActive, setIsActive] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const data = await adminService.getCoupons();
      setCoupons(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const openCreateModal = () => {
    setEditingCoupon(null);
    setCode("");
    setDescription("");
    setDiscountType("PERCENTAGE");
    setDiscountValue(15);
    setMinOrderValue(499);
    setMaxDiscountAmount(300);
    setExpiryDate("2026-12-31");
    setIsActive(true);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (c: Coupon) => {
    setEditingCoupon(c);
    setCode(c.code);
    setDescription(c.description || "");
    setDiscountType(c.discountType);
    setDiscountValue(c.discountValue);
    setMinOrderValue(c.minOrderValue || 0);
    setMaxDiscountAmount(c.maxDiscount || 500);
    setExpiryDate(c.validTill ? c.validTill.split("T")[0] : "2026-12-31");
    setIsActive(c.isActive);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setErrorMsg("Coupon code is required.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      if (editingCoupon) {
        const updated = await adminService.updateCoupon(editingCoupon.id, {
          code: code.trim(),
          description: description.trim(),
          discountType,
          discountValue,
          minOrderValue,
          maxDiscount: discountType === "PERCENTAGE" ? maxDiscountAmount : undefined,
          validTill: new Date(expiryDate).toISOString(),
          isActive,
        });
        setCoupons((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      } else {
        const created = await adminService.createCoupon({
          code: code.trim(),
          description: description.trim(),
          discountType,
          discountValue,
          minOrderValue,
          maxDiscount: discountType === "PERCENTAGE" ? maxDiscountAmount : undefined,
          validTill: new Date(expiryDate).toISOString(),
          isActive,
        });
        setCoupons((prev) => [created, ...prev]);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to save coupon");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, codeName: string) => {
    if (!window.confirm(`Are you sure you want to delete coupon "${codeName}"?`)) {
      return;
    }
    try {
      await adminService.deleteCoupon(id);
      setCoupons((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleActive = async (coupon: Coupon) => {
    try {
      const updated = await adminService.updateCoupon(coupon.id, {
        isActive: !coupon.isActive,
      });
      setCoupons((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-[#212121] tracking-tight">Coupons &amp; Discounts</h1>
            <span className="bg-gray-200 text-gray-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {coupons.length} Active Vouchers
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Create promotional voucher codes with percentage discounts, minimum basket values, and caps.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadCoupons}
            className="h-9 text-xs font-semibold bg-white border-gray-300"
          >
            <RefreshCw size={13} className="mr-1.5" />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={openCreateModal}
            className="h-9 text-xs font-bold bg-[#2874F0] hover:bg-[#1259c7] text-white"
          >
            <Plus size={14} className="mr-1" />
            Create Coupon
          </Button>
        </div>
      </div>

      {/* ── Coupons Table ───────────────────────────────────────────────────── */}
      <div className="bg-white rounded-md border border-gray-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-20 text-center text-gray-500 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin text-[#2874F0] mx-auto mb-2" />
            Loading promotional coupons...
          </div>
        ) : coupons.length === 0 ? (
          <div className="py-16 text-center text-gray-500 text-xs">
            <Ticket className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="font-bold text-gray-700 text-sm">No promotional coupons</p>
            <p className="mt-1">Create your first coupon voucher code.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f9fafb] text-gray-500 uppercase text-[10px] font-bold tracking-wider border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">Coupon Code</th>
                  <th className="py-3 px-4">Discount Value</th>
                  <th className="py-3 px-4">Min. Basket</th>
                  <th className="py-3 px-4">Valid Until</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {coupons.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/70 transition-colors">
                    {/* Code & Description */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-xs bg-blue-50 text-[#2874F0] border border-blue-200 px-2 py-0.5 rounded">
                          {c.code}
                        </span>
                      </div>
                      {c.description && (
                        <p className="text-[11px] text-gray-500 mt-1 max-w-xs">{c.description}</p>
                      )}
                    </td>

                    {/* Value */}
                    <td className="py-3.5 px-4 font-bold text-gray-900">
                      {c.discountType === "PERCENTAGE" ? (
                        <div className="flex items-center gap-1 text-purple-700">
                          <Percent size={13} />
                          <span>{c.discountValue}% OFF</span>
                          {c.maxDiscount && (
                            <span className="text-[10px] text-gray-400 font-normal">
                              (Max {formatPrice(c.maxDiscount)})
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-emerald-700">
                          <IndianRupee size={13} />
                          <span>{formatPrice(c.discountValue)} FLAT</span>
                        </div>
                      )}
                    </td>

                    {/* Min Basket */}
                    <td className="py-3.5 px-4 text-gray-600 font-semibold">
                      {c.minOrderValue ? formatPrice(c.minOrderValue) : "No Min."}
                    </td>

                    {/* Valid Until */}
                    <td className="py-3.5 px-4 text-gray-500">
                      {c.validTill
                        ? new Date(c.validTill).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "No Expiry"}
                    </td>

                    {/* Status Toggle */}
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggleActive(c)}
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                          c.isActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                            : "bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200"
                        }`}
                      >
                        {c.isActive ? "Active (Enabled)" : "Disabled"}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditModal(c)}
                          className="h-7 text-xs px-2.5 text-gray-600 hover:text-[#2874F0] border-gray-200"
                        >
                          <Edit2 size={12} className="mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(c.id, c.code)}
                          className="h-7 text-xs px-2 text-gray-400 hover:text-red-600 hover:border-red-200"
                        >
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Create / Edit Coupon Modal ──────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => { if (!submitting) setIsModalOpen(false); }}>
          <div className="bg-white rounded-md max-w-md w-full p-5 shadow-2xl relative space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-base font-bold text-[#212121]">
                {editingCoupon ? "Edit Coupon" : "Create New Coupon"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            {errorMsg && (
              <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Coupon Code <span className="text-red-500">*</span>
                </label>
                <Input
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. FESTIVE20"
                  className="h-9 text-xs font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Discount Type
                  </label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full h-9 px-2.5 text-xs bg-white border border-gray-200 rounded font-semibold text-gray-800 focus:outline-none focus:border-[#2874F0]"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FLAT">Flat Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Value {discountType === "PERCENTAGE" ? "(%)" : "(₹)"} <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    min={1}
                    required
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="h-9 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Min. Basket Value (₹)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={minOrderValue}
                    onChange={(e) => setMinOrderValue(Number(e.target.value))}
                    className="h-9 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Max Discount Cap (₹)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    disabled={discountType === "FLAT"}
                    value={maxDiscountAmount}
                    onChange={(e) => setMaxDiscountAmount(Number(e.target.value))}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Expiry Date
                </label>
                <Input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Description / Terms
                </label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Valid on all orders above ₹499"
                  className="h-9 text-xs"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-800 pt-1">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded text-[#2874F0] focus:ring-[#2874F0] w-4 h-4"
                />
                <span>Active Voucher (Immediately usable by shoppers)</span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="h-8 text-xs font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="h-8 text-xs font-bold bg-[#2874F0] hover:bg-[#1259c7] text-white"
                >
                  {submitting ? "Saving..." : editingCoupon ? "Update Voucher" : "Create Voucher"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

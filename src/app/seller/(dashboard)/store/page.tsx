"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { useHydration } from "@/hooks/useHydration";
import { useSellerStore } from "@/store/useSellerStore";
import { sellerStoreService } from "@/services";
import type { Seller } from "@/types";
import { StoreProfileForm } from "@/components/seller/StoreProfileForm";
import { SellerStatusBadge } from "@/components/seller/SellerStatusBadge";

export default function SellerStorePage() {
  const isHydrated = useHydration();
  const { seller: storeSeller, updateSeller } = useSellerStore();
  const currentSeller = isHydrated ? storeSeller : null;
  const [seller, setSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await sellerStoreService.getStoreProfile();
        if (mounted) setSeller(data || currentSeller || null);
      } catch (err: any) {
        if (mounted) {
          setSeller(currentSeller || null);
          setError(err?.message || "Failed to load store profile.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [currentSeller]);

  const handleUploadImage = async (file: File) => {
    const res = await sellerStoreService.uploadStoreImage(file);
    return res.url;
  };

  const handleUpdate = async (data: any) => {
    setMessage("");
    setError("");
    try {
      const updated = await sellerStoreService.updateStore(data);
      setSeller(updated);
      updateSeller(updated);
      setMessage("Store information updated.");
      setIsEditing(false);
    } catch (err: any) {
      const msg = err?.message || "Update failed.";
      setError(msg);
      throw err;
    }
  };

  const handleToggleStatus = async () => {
    setMessage("");
    setError("");
    try {
      const updated = await sellerStoreService.toggleStoreStatus();
      setSeller(updated);
      updateSeller(updated);
      setMessage(`Store status changed to ${updated.storeStatus}.`);
    } catch (err: any) {
      setError(err?.message || "Failed to change status.");
    }
  };

  if (loading || !seller) {
    return (
      <div className="p-4 sm:p-6">
        <h1 className="text-lg font-bold text-[#212121]">Store Management</h1>
        <div className="h-64 rounded-sm bg-[#E8E8E8] animate-skeleton mt-4" />
        {error && <div className="mt-4 rounded-sm border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-lg font-bold text-[#212121]">Store Management</h1>
        <Link href="/seller/dashboard" className="text-[11px] font-semibold text-[#2874F0] hover:underline flex items-center gap-1">
          <span>← Back to Dashboard</span>
        </Link>
      </div>

      <div className="rounded-sm border border-[#E0E0E0] bg-white p-4 shadow-sm flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-[#212121] truncate">{seller.storeName}</h2>
          <p className="text-xs text-[#878787] truncate">flipstore.in/seller/{seller.storeSlug}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <SellerStatusBadge status={seller.storeStatus} size="sm" />
          <button onClick={handleToggleStatus} className="text-[10px] font-bold text-[#2874F0] hover:underline px-2 py-1">
            Toggle Status
          </button>
        </div>
      </div>

      {message && <div className="rounded-sm bg-[#E8F5E9] px-3 py-2 text-xs text-[#2E7D32] border border-[#C8E6C9]">{message}</div>}
      {error && <div className="rounded-sm border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}

      <div className="rounded-sm border border-[#E0E0E0] bg-white shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#F0F0F0]">
          <div>
            <h2 className="text-sm font-bold text-[#212121]">Store Profile</h2>
            <p className="text-xs text-[#878787] mt-0.5">View or edit your store details, description, and images.</p>
          </div>
          {!isEditing && (
            <button
              type="button"
              onClick={() => { setMessage(""); setError(""); setIsEditing(true); }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2874F0] hover:underline"
            >
              <Pencil size={14} /> Edit Store
            </button>
          )}
        </div>

        {!isEditing ? (
          <div className="p-5 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-1 space-y-3">
                <div>
                  <p className="text-[11px] font-bold text-[#878787] uppercase tracking-wider mb-1.5">Store Logo</p>
                  <div className="w-24 h-24 rounded-full border border-[#E0E0E0] bg-[#F9FAFB] overflow-hidden flex items-center justify-center">
                    {seller.storeLogo ? <img src={seller.storeLogo} alt="Store logo" className="w-full h-full object-cover" /> : <span className="text-xs text-[#878787]">No logo</span>}
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-[#878787] uppercase tracking-wider mb-1.5">Store Banner</p>
                  <div className="w-full h-24 rounded-sm border border-[#E0E0E0] bg-[#F9FAFB] overflow-hidden flex items-center justify-center">
                    {seller.storeBanner ? <img src={seller.storeBanner} alt="Store banner" className="w-full h-full object-cover" /> : <span className="text-xs text-[#878787]">No banner</span>}
                  </div>
                </div>
              </div>
              <div className="sm:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><p className="text-[11px] font-bold text-[#878787] uppercase tracking-wider">Store Name</p><p className="text-sm text-[#212121] mt-1">{seller.storeName || "—"}</p></div>
                <div><p className="text-[11px] font-bold text-[#878787] uppercase tracking-wider">Store URL / Slug</p><p className="text-sm text-[#212121] mt-1">{seller.storeSlug || "—"}</p></div>
                <div><p className="text-[11px] font-bold text-[#878787] uppercase tracking-wider">Business Category</p><p className="text-sm text-[#212121] mt-1">{seller.businessCategory || "—"}</p></div>
                <div><p className="text-[11px] font-bold text-[#878787] uppercase tracking-wider">Contact Email</p><p className="text-sm text-[#212121] mt-1 break-all">{seller.businessEmail || "—"}</p></div>
                <div><p className="text-[11px] font-bold text-[#878787] uppercase tracking-wider">Contact Phone</p><p className="text-sm text-[#212121] mt-1">{seller.businessPhone || "—"}</p></div>
                <div className="md:col-span-2">
                  <p className="text-[11px] font-bold text-[#878787] uppercase tracking-wider">Store Description</p>
                  <p className="text-sm text-[#212121] mt-1 whitespace-pre-wrap">{seller.storeDescription || "No description added yet."}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-5">
            <StoreProfileForm
              seller={seller}
              onUpdate={handleUpdate}
              onUploadImage={handleUploadImage}
              onCancel={() => { setError(""); setIsEditing(false); }}
              submitLabel="Save Changes"
            />
          </div>
        )}
      </div>
    </div>
  );
}

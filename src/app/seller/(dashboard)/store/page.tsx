"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useHydration } from "@/hooks/useHydration";
import { useSellerStore } from "@/store/useSellerStore";
import { sellerStoreService } from "@/services";
import type { Seller } from "@/types";
import { StoreProfileForm } from "@/components/seller/StoreProfileForm";
import { SellerStatusBadge } from "@/components/seller/SellerStatusBadge";

export default function SellerStorePage() {
  const isHydrated = useHydration();
  const { seller: storeSeller } = useSellerStore();
  const currentSeller = isHydrated ? storeSeller : null;
  const [seller, setSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const data = await sellerStoreService.getStoreProfile();
        if (mounted) setSeller(data || currentSeller || null);
      } catch {
        if (mounted) setSeller(currentSeller || null);
      } finally {
        if (mounted) setLoading(false);
    }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [currentSeller]);

  const handleUpdate = async (data: any) => {
    setMessage("");
    try {
      const updated = await sellerStoreService.updateStore(data);
      setSeller(updated);
      setMessage("Store information updated.");
    } catch (err: any) {
      setMessage(err.message || "Update failed.");
    }
  };

  const handleToggleStatus = async () => {
    setMessage("");
    try {
      const updated = await sellerStoreService.toggleStoreStatus();
      setSeller(updated);
      setMessage(`Store status changed to ${updated.storeStatus}.`);
    } catch (err: any) {
      setMessage(err.message || "Failed to change status.");
    }
  };

  if (loading || !seller) {
    return (
      <div className="p-4 sm:p-6">
        <h1 className="text-lg font-bold text-[#212121]">Store Management</h1>
        <div className="h-64 rounded-sm bg-[#E8E8E8] animate-skeleton mt-4" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-lg font-bold text-[#212121]">Store Management</h1>
        <Link
          href="/seller/dashboard"
          className="text-[11px] font-semibold text-[#2874F0] hover:underline flex items-center gap-1"
        >
          <span>← Back to Dashboard</span>
        </Link>
      </div>

      <div className="rounded-sm border border-[#E0E0E0] bg-white p-4 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-[#212121]">{seller.storeName}</h2>
          <p className="text-xs text-[#878787]">flipstore.in/seller/{seller.storeSlug}</p>
        </div>
        <div className="flex items-center gap-2">
          <SellerStatusBadge status={seller.storeStatus} size="sm" />
          <button
            onClick={handleToggleStatus}
            className="text-[10px] font-bold text-[#2874F0] hover:underline px-2 py-1"
          >
            Toggle Status
          </button>
        </div>
      </div>

      {message && (
        <div className="rounded-sm bg-[#E8F5E9] px-3 py-2 text-xs text-[#2E7D32] border border-[#C8E6C9]">
          {message}
        </div>
      )}

      <StoreProfileForm seller={seller} onUpdate={handleUpdate} />
    </div>
  );
}

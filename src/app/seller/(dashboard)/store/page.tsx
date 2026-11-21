"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Upload, Image as ImageIcon } from "lucide-react";
import { useHydration } from "@/hooks/useHydration";
import { useSellerStore } from "@/store/useSellerStore";
import { sellerStoreService } from "@/services";
import type { Seller } from "@/types";
import { SellerStatusBadge } from "@/components/seller/SellerStatusBadge";
import { Button } from "@/components/ui/button";

export default function SellerStorePage() {
  const isHydrated = useHydration();
  const { seller: storeSeller, updateSeller } = useSellerStore();
  const currentSeller = isHydrated ? storeSeller : null;
  const [seller, setSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const bannerInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await sellerStoreService.getStoreProfile();
        if (mounted) {
          setSeller(data || currentSeller || null);
          setLogoPreview((data || currentSeller)?.storeLogo || null);
          setBannerPreview((data || currentSeller)?.storeBanner || null);
        }
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

  const handleImageUpload = async (type: "logo" | "banner", e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (type === "logo") setUploadingLogo(true);
    else setUploadingBanner(true);
    setMessage("");
    setError("");
    try {
      const res = await sellerStoreService.uploadStoreImage(file);
      const url = res.url;
      if (type === "logo") {
        setLogoPreview(url);
        setSeller((prev: Seller | null) => prev ? { ...prev, storeLogo: url } : null);
        updateSeller({ storeLogo: url });
      } else {
        setBannerPreview(url);
        setSeller((prev: Seller | null) => prev ? { ...prev, storeBanner: url } : null);
        updateSeller({ storeBanner: url });
      }
      setMessage(type === "logo" ? "Store logo updated." : "Store banner updated.");
    } catch (err: any) {
      setError(err?.message || "Failed to upload image.");
    } finally {
      if (type === "logo") setUploadingLogo(false);
      else setUploadingBanner(false);
      e.target.value = "";
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
            <p className="text-xs text-[#878787] mt-0.5">View store details and update logo/banner images.</p>
          </div>
        </div>

        <div className="p-5 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1 space-y-3">
              <div>
                <p className="text-[11px] font-bold text-[#878787] uppercase tracking-wider mb-1.5">Store Logo</p>
                <div className="w-24 h-24 rounded-full border border-[#E0E0E0] bg-[#F9FAFB] overflow-hidden flex items-center justify-center relative group">
                  {seller.storeLogo ? <img src={seller.storeLogo} alt="Store logo" className="w-full h-full object-cover" /> : <span className="text-xs text-[#878787]">No logo</span>}
                  <input ref={logoInputRef} id="logo-input" type="file" accept="image/*" onChange={(e) => handleImageUpload("logo", e)} className="sr-only" />
                  <button type="button" onClick={() => logoInputRef.current?.click()} className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-24 h-24 flex items-center justify-center bg-white/80 backdrop-blur-sm">
                      <Upload size={16} className="text-[#2874F0]" />
                      <span className="text-[10px] font-bold text-[#2874F0] mt-1">{uploadingLogo ? "Uploading..." : "Change"}</span>
                    </div>
                  </button>
                  <button type="button" onClick={() => logoInputRef.current?.click()} className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[11px] font-medium text-[#2874F0] hover:underline pointer-events-none group-hover:pointer-events-auto">
                    Upload Store Logo
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-full h-24 rounded-sm border-2 border-dashed border-[#E0E0E0] bg-[#F9FAFB] overflow-hidden relative group">
                    {seller.storeBanner ? <img src={seller.storeBanner} alt="Store banner" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><ImageIcon size={20} className="text-[#878787]" /></div>}
                    <input ref={bannerInputRef} id="banner-input" type="file" accept="image/*" onChange={(e) => handleImageUpload("banner", e)} className="sr-only" />
                    <button type="button" onClick={() => bannerInputRef.current?.click()} className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-full h-full flex items-center justify-center bg-white/80 backdrop-blur-sm">
                        <Upload size={16} className="text-[#2874F0]" />
                        <span className="text-[10px] font-bold text-[#2874F0] mt-1">{uploadingBanner ? "Uploading..." : "Change"}</span>
                      </div>
                    </button>
                    <button type="button" onClick={() => bannerInputRef.current?.click()} className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[11px] font-medium text-[#2874F0] hover:underline pointer-events-none group-hover:pointer-events-auto">
                      Upload Store Banner
                    </button>
                  </div>
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
      </div>
    </div>
  );
}

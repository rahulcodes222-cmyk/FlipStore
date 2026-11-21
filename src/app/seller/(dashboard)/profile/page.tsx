"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Upload, User } from "lucide-react";
import { useHydration } from "@/hooks/useHydration";
import { useSellerStore } from "@/store/useSellerStore";
import { sellerProfileService } from "@/services";
import type { Seller } from "@/types";
import { SellerProfileCard } from "@/components/seller/SellerProfileCard";
import { Button } from "@/components/ui/button";

function DetailRow({ label, value }: { label: string; value?: string | number | null }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-[#F5F5F5] last:border-b-0">
      <span className="text-xs font-medium text-[#878787]">{label}</span>
      <span className="text-xs text-[#212121] text-right break-all">{String(value)}</span>
    </div>
  );
}

export default function SellerProfilePage() {
  const isHydrated = useHydration();
  const { seller, updateSeller } = useSellerStore();
  const currentSeller = isHydrated ? seller : null;
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [sellerData, setSellerData] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await sellerProfileService.getSellerProfile();
        if (mounted) {
          const merged = data || currentSeller || null;
          setSellerData(merged);
        }
      } catch (err: any) {
        if (mounted) {
          setSellerData(currentSeller || null);
          setError(err?.message || "Failed to load seller profile.");
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

  const sellerProfile = sellerData || currentSeller;
  const details = (sellerProfile as any) || {};
  const bank = details.bankDetails || details.bank || null;
  const business = details.businessDetails || {};
  const address = details.address || details.businessAddress || business.address || null;
  const docs = Array.isArray(details.documents) ? details.documents : [];

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    setMessage("");
    setError("");
    try {
      const url = await sellerProfileService.uploadProfileImage(file);
      const updated = await sellerProfileService.updateAvatar(url);
      setSellerData(updated);
      updateSeller(updated);
      setMessage("Profile image updated successfully.");
    } catch (err: any) {
      setError(err?.message || "Failed to upload profile image.");
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  };

  if (loading || !sellerProfile) {
    return (
      <div className="p-4 sm:p-6">
        <h1 className="text-lg font-bold text-[#212121]">Seller Profile</h1>
        <div className="h-64 rounded-sm bg-[#E8E8E8] animate-skeleton mt-4" />
        {error && <div className="mt-4 rounded-sm border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      </div>
    );
  }

  const avatar = (sellerProfile as any).avatar || (sellerProfile as any).storeLogo || "";

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-lg font-bold text-[#212121]">Seller Profile</h1>
        <Link href="/seller/dashboard" className="text-[11px] font-semibold text-[#2874F0] hover:underline flex items-center gap-1">
          <span>← Back to Dashboard</span>
        </Link>
      </div>

      <div className="rounded-sm border border-[#E0E0E0] bg-white p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="relative w-20 h-20 rounded-full bg-[#eaf2ff] border border-[#E0E0E0] overflow-hidden flex items-center justify-center">
            {avatar ? <img src={avatar} alt="Profile" className="w-full h-full object-cover" /> : <User size={28} className="text-[#2874F0]" />}
          </div>
          <div className="space-y-2">
            <h2 className="text-sm font-bold text-[#212121]">{sellerProfile.name || sellerProfile.storeName || "Seller"}</h2>
            <p className="text-xs text-[#878787]">Upload your profile image to Cloudinary (stored as image URL in your account).</p>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" className="hidden" onChange={handleAvatarUpload} />
            <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} isLoading={uploadingAvatar} leftIcon={<Upload size={14} />} className="w-auto h-8 text-xs">
              {uploadingAvatar ? "Uploading..." : "Change Profile Image"}
            </Button>
          </div>
        </div>
      </div>

      <SellerProfileCard seller={sellerProfile} />

      {message && <div className="rounded-sm bg-[#E8F5E9] px-3 py-2 text-xs text-[#2E7D32] border border-[#C8E6C9]">{message}</div>}
      {error && <div className="rounded-sm border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-sm border border-[#E0E0E0] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-[#212121]">Profile & Store Contact</h2>
          </div>
          <div>
            <DetailRow label="Seller ID" value={sellerProfile.sellerId || (sellerProfile as any).id} />
            <DetailRow label="Name" value={sellerProfile.name} />
            <DetailRow label="Email" value={sellerProfile.email} />
            <DetailRow label="Phone" value={sellerProfile.phone} />
            <DetailRow label="Store Name" value={sellerProfile.storeName} />
            <DetailRow label="Store Slug" value={sellerProfile.storeSlug} />
            <DetailRow label="Store Description" value={sellerProfile.storeDescription} />
            <DetailRow label="Business Email" value={(sellerProfile as any).businessEmail} />
            <DetailRow label="Business Phone" value={(sellerProfile as any).businessPhone} />
            <DetailRow label="Joined" value={sellerProfile.joinedAt ? new Date(sellerProfile.joinedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : undefined} />
            <DetailRow label="Application Status" value={(details.applicationStatus || sellerProfile.verificationStatus) as any} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-sm border border-[#E0E0E0] bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold text-[#212121] mb-4">Registration & Business Details</h2>
            <DetailRow label="Business Name" value={business.businessName || details.businessName} />
            <DetailRow label="Business Type" value={sellerProfile.businessType || business.businessType} />
            <DetailRow label="Business Category" value={sellerProfile.businessCategory || business.category} />
            <DetailRow label="GST Number" value={sellerProfile.gstNumber || details.gstNumber} />
            <DetailRow label="PAN Number" value={sellerProfile.panNumber || details.panNumber} />
            {address && (
              <div className="py-2 border-b border-[#F5F5F5]">
                <span className="text-xs font-medium text-[#878787] block mb-1">Business Address</span>
                <span className="text-xs text-[#212121]">
                  {[address.addressLine1 || address.houseNumber, address.addressLine2 || address.street, address.landmark, address.city, address.state, address.pincode].filter(Boolean).join(", ")}
                </span>
              </div>
            )}
            {bank && (
              <>
                <DetailRow label="Account Holder" value={bank.accountHolderName} />
                <DetailRow label="Bank Name" value={bank.bankName} />
                <DetailRow label="Account" value={bank.accountNumberMasked || (bank.accountLast4 ? `****${bank.accountLast4}` : undefined)} />
                <DetailRow label="IFSC" value={bank.ifscCode} />
              </>
            )}
            {!business.businessName && !sellerProfile.gstNumber && !sellerProfile.panNumber && !address && !bank && (
              <p className="text-xs text-[#878787]">Registration details will appear here once available from your seller application.</p>
            )}
          </div>

          <div className="rounded-sm border border-[#E0E0E0] bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold text-[#212121] mb-4">Documents</h2>
            {docs.length === 0 ? (
              <p className="text-xs text-[#878787]">No uploaded documents found.</p>
            ) : (
              <div className="space-y-2">
                {docs.map((doc: any, i: number) => (
                  <div key={doc.id || i} className="flex items-center justify-between gap-3 py-2 border-b border-[#F5F5F5] last:border-b-0">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-[#212121] truncate">{doc.type || "Document"}</p>
                      <p className="text-[11px] text-[#878787] truncate">{doc.fileName || doc.fileUrl || "—"}</p>
                    </div>
                    {doc.fileUrl && (
                      <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="text-[11px] font-semibold text-[#2874F0] hover:underline shrink-0">View</a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

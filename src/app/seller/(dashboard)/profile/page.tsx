"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useHydration } from "@/hooks/useHydration";
import { useSellerStore } from "@/store/useSellerStore";
import { sellerProfileService } from "@/services";
import type { Seller } from "@/types";
import { SellerProfileCard } from "@/components/seller/SellerProfileCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function SellerProfilePage() {
  const isHydrated = useHydration();
  const { seller, updateSeller } = useSellerStore();
  const router = useRouter();
  const currentSeller = isHydrated ? seller : null;
  const [sellerData, setSellerData] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    storeName: "",
    storeDescription: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const data = await sellerProfileService.getSellerProfile();
        if (mounted) {
          setSellerData(data || currentSeller || null);
          setForm({
            name: data?.name || currentSeller?.name || "",
            email: data?.email || currentSeller?.email || "",
            phone: data?.phone || currentSeller?.phone || "",
            storeName: data?.storeName || currentSeller?.storeName || "",
            storeDescription: data?.storeDescription || currentSeller?.storeDescription || "",
          });
        }
      } catch {
        if (mounted) setSellerData(currentSeller || null);
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const updated = await sellerProfileService.updateProfile({
        name: form.name,
        email: form.email,
        phone: form.phone,
        storeName: form.storeName,
        storeDescription: form.storeDescription,
      });
      updateSeller(updated);
      setSellerData(updated);
      setEditing(false);
      setMessage("Profile updated successfully.");
    } catch (err: any) {
      setMessage(err.message || "Update failed.");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !sellerProfile) {
    return (
      <div className="p-4 sm:p-6">
        <h1 className="text-lg font-bold text-[#212121]">Seller Profile</h1>
        <div className="h-64 rounded-sm bg-[#E8E8E8] animate-skeleton mt-4" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-lg font-bold text-[#212121]">Seller Profile</h1>
        <Link
          href="/seller/dashboard"
          className="text-[11px] font-semibold text-[#2874F0] hover:underline flex items-center gap-1"
        >
          <span>← Back to Dashboard</span>
        </Link>
      </div>

      <SellerProfileCard seller={sellerProfile} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-sm border border-[#E0E0E0] bg-white p-5 shadow-sm">
          {editing ? (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Full Name</label>
                <input
                  {...{ value: form.name, onChange: (e) => setForm({ ...form, name: e.target.value }) }}
                  className="flex h-10 w-full rounded-sm border border-[#E0E0E0] bg-white px-3 py-2 text-sm text-[#212121] focus-visible:ring-1 focus-visible:ring-[#2874F0]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Email</label>
                <input
                  {...{ value: form.email, onChange: (e) => setForm({ ...form, email: e.target.value }) }}
                  className="flex h-10 w-full rounded-sm border border-[#E0E0E0] bg-white px-3 py-2 text-sm text-[#212121] focus-visible:ring-1 focus-visible:ring-[#2874F0]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Mobile</label>
                <input
                  {...{ value: form.phone, onChange: (e) => setForm({ ...form, phone: e.target.value }) }}
                  className="flex h-10 w-full rounded-sm border border-[#E0E0E0] bg-white px-3 py-2 text-sm text-[#212121] focus-visible:ring-1 focus-visible:ring-[#2874F0]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Store Name</label>
                <input
                  {...{ value: form.storeName, onChange: (e) => setForm({ ...form, storeName: e.target.value }) }}
                  className="flex h-10 w-full rounded-sm border border-[#E0E0E0] bg-white px-3 py-2 text-sm text-[#212121] focus-visible:ring-1 focus-visible:ring-[#2874F0]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Store Description</label>
                <textarea
                  {...{ value: form.storeDescription, onChange: (e) => setForm({ ...form, storeDescription: e.target.value }) }}
                  rows={3}
                  className="flex h-24 w-full rounded-sm border border-[#E0E0E0] bg-white px-3 py-2 text-sm text-[#212121] focus-visible:ring-1 focus-visible:ring-[#2874F0]"
                />
              </div>
              {message && (
                <p className="text-xs text-[#2E7D32] bg-[#E8F5E9] px-2 py-1 rounded-sm">{message}</p>
              )}
              <div className="flex gap-2">
                <Button type="submit" variant="primary" isLoading={saving} className="w-auto">
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => setEditing(false)} className="w-auto">
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#212121]">Seller ID</span>
                <span className="text-sm text-[#878787]">{sellerProfile.sellerId}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#212121]">Registration Date</span>
                <span className="text-sm text-[#878787]">
                  {new Date(sellerProfile.joinedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#212121]">Verification Status</span>
                <span className="text-sm font-medium">
                  {sellerProfile.verificationStatus.charAt(0) + sellerProfile.verificationStatus.slice(1).toLowerCase()}
                </span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-[#F0F0F0]">
                <span className="text-sm text-[#212121]">Role</span>
                <span className="text-sm text-[#878787]">Seller</span>
              </div>
              <Button variant="outline" onClick={() => setEditing(true)} className="w-full mt-4">
                Edit Profile
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

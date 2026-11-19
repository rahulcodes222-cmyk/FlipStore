"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Plus, Upload, Trash2, Edit2, X, Image as ImageIcon, ExternalLink, AlertCircle, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/common/Toast";
import type { Banner } from "@/types";
import { MOCK_BANNERS } from "@/data/banners";

const STORAGE_KEY = "flipstore_admin_banners_v1";
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

function loadBanners(): Banner[] {
  if (typeof window === "undefined") return [...MOCK_BANNERS];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [...MOCK_BANNERS];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed as Banner[];
  } catch {}
  return [...MOCK_BANNERS];
}

function saveBanners(banners: Banner[]) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(banners)); } catch {}
}

async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  form.append("folder", "store");
  const res = await fetch(`${API_BASE}/api/v1/uploads`, { method: "POST", credentials: "include", body: form });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json?.success === false) throw new Error(json?.message || json?.error?.message || "Image upload failed.");
  const url = json?.data?.url;
  if (!url) throw new Error("Upload did not return an image URL.");
  return String(url);
}

const emptyBanner = (): Partial<Banner> => ({
  title: "",
  subtitle: "",
  description: "",
  discountText: "",
  badgeText: "",
  ctaText: "Shop Now",
  imageUrl: "",
  mobileImageUrl: "",
  targetUrl: "/",
  categorySlug: "",
  position: "hero",
  isActive: true,
});

export function AdminBannersClient() {
  const { success, error } = useToast();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [form, setForm] = useState<Partial<Banner>>(emptyBanner());
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"main" | "mobile" | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const mainInputRef = useRef<HTMLInputElement | null>(null);
  const mobileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => { setBanners(loadBanners()); }, []);

  const persist = (next: Banner[]) => {
    setBanners(next);
    saveBanners(next);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyBanner());
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEdit = (b: Banner) => {
    setEditing(b);
    setForm({ ...b });
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (saving || uploading) return;
    setIsModalOpen(false);
  };

  const setField = (k: keyof Banner, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const doUpload = async (file: File | null, target: "main" | "mobile") => {
    if (!file) return;
    setUploading(target);
    setErrorMsg(null);
    try {
      const url = await uploadImage(file);
      if (target === "main") setField("imageUrl", url);
      else setField("mobileImageUrl", url);
      success("Image uploaded.");
    } catch (e: any) {
      setErrorMsg(e?.message || "Upload failed.");
      error(e?.message || "Upload failed.");
    } finally {
      setUploading(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const title = String(form.title || "").trim();
    const imageUrl = String(form.imageUrl || "").trim();
    const targetUrl = String(form.targetUrl || "/").trim();
    if (!title) return setErrorMsg("Banner title is required.");
    if (!imageUrl) return setErrorMsg("Banner image is required. Upload an image or provide an image URL.");
    setSaving(true);
    try {
      const payload: Banner = {
        id: editing?.id || `banner-${Date.now()}`,
        title,
        subtitle: String(form.subtitle || "").trim() || undefined,
        description: String(form.description || "").trim() || undefined,
        discountText: String(form.discountText || "").trim() || undefined,
        badgeText: String(form.badgeText || "").trim() || undefined,
        ctaText: String(form.ctaText || "Shop Now").trim() || "Shop Now",
        bgColor: form.bgColor || undefined,
        imageUrl,
        mobileImageUrl: String(form.mobileImageUrl || "").trim() || undefined,
        targetUrl: targetUrl || "/",
        categorySlug: String(form.categorySlug || "").trim() || undefined,
        position: (form.position as Banner["position"]) || "hero",
        isActive: form.isActive !== false,
      };
      let next: Banner[];
      if (editing) next = banners.map((b) => (b.id === editing.id ? payload : b));
      else next = [payload, ...banners];
      persist(next);
      success(editing ? "Banner updated." : "Banner added.");
      setIsModalOpen(false);
    } catch (e: any) {
      setErrorMsg(e?.message || "Failed to save banner.");
      error("Failed to save banner.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string, title: string) => {
    if (!confirm(`Delete banner "${title}"?`)) return;
    const next = banners.filter((b) => b.id !== id);
    persist(next.length ? next : [...MOCK_BANNERS]);
    success("Banner deleted.");
  };

  const handleReset = () => {
    if (!confirm("Reset banners to default set? This will remove custom uploaded banners from this browser.")) return;
    if (typeof window !== "undefined") try { window.localStorage.removeItem(STORAGE_KEY); } catch {}
    setBanners([...MOCK_BANNERS]);
    success("Banners reset to defaults.");
  };

  const hero = banners.filter((b) => b.position === "hero");
  const promo = banners.filter((b) => b.position === "promo");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-[#212121]">Homepage Banners</h1>
          <p className="text-xs text-gray-500 mt-0.5">Upload and manage hero/promo banners shown on the storefront (saved in this browser for preview).</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleReset} className="text-xs h-9">Reset Defaults</Button>
          <Button size="sm" onClick={openCreate} className="text-xs h-9 bg-[#2874F0] hover:bg-[#1259c7] text-white">
            <Plus size={14} className="mr-1" /> Add Banner
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-4"><p className="text-xs text-gray-500">Total Banners</p><p className="text-2xl font-black text-[#212121] mt-1">{banners.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-gray-500">Hero Banners</p><p className="text-2xl font-black text-[#2874F0] mt-1">{hero.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-gray-500">Promo Banners</p><p className="text-2xl font-black text-[#388E3C] mt-1">{promo.length}</p></CardContent></Card>
      </div>

      <Card className="border-[#E0E0E0] shadow-xs">
        <CardHeader className="pb-3 border-b border-gray-100"><CardTitle className="text-sm font-bold text-[#212121]">All Banners</CardTitle></CardHeader>
        <CardContent className="p-0">
          {banners.length === 0 ? (
            <div className="p-10 text-center text-sm text-gray-500">No banners configured.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {banners.map((b) => (
                <div key={b.id} className="p-4 flex flex-col sm:flex-row gap-4 sm:items-center">
                  <div className="relative w-full sm:w-44 h-24 bg-gray-100 rounded border border-gray-200 overflow-hidden shrink-0">
                    {b.imageUrl ? <Image src={b.imageUrl} alt={b.title} fill className="object-cover" /> : <div className="h-full flex items-center justify-center text-gray-400"><ImageIcon size={24} /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="font-bold text-sm text-[#212121] truncate">{b.title}</p>
                      <Badge variant={b.position === "hero" ? "default" : "secondary"} className="text-[10px] uppercase">{b.position}</Badge>
                      <Badge variant={b.isActive ? "default" : "secondary"} className={`text-[10px] ${b.isActive ? "bg-green-100 text-green-700 border-green-200" : "bg-gray-100 text-gray-600"}`}>{b.isActive ? "Active" : "Inactive"}</Badge>
                    </div>
                    {b.description && <p className="text-xs text-gray-500 line-clamp-2">{b.description}</p>}
                    <p className="text-[11px] text-[#2874F0] mt-1 truncate">{b.targetUrl}</p>
                  </div>
                  <div className="flex items-center gap-2 sm:justify-end">
                    <Link href={b.targetUrl} target="_blank" className="h-8 px-2.5 inline-flex items-center justify-center text-xs border border-gray-200 rounded text-gray-600 hover:bg-gray-50"><ExternalLink size={13} /></Link>
                    <Button size="sm" variant="outline" onClick={() => openEdit(b)} className="h-8 text-xs px-2.5"><Edit2 size={13} className="mr-1" /> Edit</Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(b.id, b.title)} className="h-8 text-xs px-2.5 text-red-600 border-red-200 hover:bg-red-50"><Trash2 size={13} /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={closeModal}>
          <div className="bg-white rounded-md max-w-2xl w-full max-h-[92vh] overflow-y-auto p-5 shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-base font-bold text-[#212121]">{editing ? "Edit Banner" : "Add Banner"}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>

            {errorMsg && (
              <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" /><span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
                  <Input value={String(form.title || "")} onChange={(e) => setField("title", e.target.value)} className="h-9 text-xs" placeholder="Banner title" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Position</label>
                  <select value={String(form.position || "hero")} onChange={(e) => setField("position", e.target.value)} className="w-full h-9 px-2 text-xs border border-[#E0E0E0] rounded-sm bg-white">
                    <option value="hero">Hero (Slider)</option>
                    <option value="promo">Promo (Section banner)</option>
                    <option value="slider">Slider</option>
                    <option value="strip">Strip</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Target URL <span className="text-red-500">*</span></label>
                  <Input value={String(form.targetUrl || "")} onChange={(e) => setField("targetUrl", e.target.value)} className="h-9 text-xs" placeholder="/category/electronics" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">CTA Text</label>
                  <Input value={String(form.ctaText || "")} onChange={(e) => setField("ctaText", e.target.value)} className="h-9 text-xs" placeholder="Shop Now" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Badge Text</label>
                  <Input value={String(form.badgeText || "")} onChange={(e) => setField("badgeText", e.target.value)} className="h-9 text-xs" placeholder="MEGA SALE" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Discount Text</label>
                  <Input value={String(form.discountText || "")} onChange={(e) => setField("discountText", e.target.value)} className="h-9 text-xs" placeholder="UP TO 70% OFF" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Description / Subtitle</label>
                <Textarea value={String(form.description || form.subtitle || "")} onChange={(e) => setField("description", e.target.value)} rows={2} className="text-xs" placeholder="Short banner description" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-gray-700">Banner Image <span className="text-red-500">*</span></label>
                  <div className="border border-dashed border-gray-300 rounded-sm p-3 bg-gray-50 space-y-2">
                    {form.imageUrl ? (
                      <div className="relative w-full h-28 bg-white border border-gray-200 rounded overflow-hidden">
                        <Image src={String(form.imageUrl)} alt="Banner preview" fill className="object-cover" />
                      </div>
                    ) : (
                      <div className="h-28 flex items-center justify-center text-gray-400 text-xs">No image selected</div>
                    )}
                    <input ref={mainInputRef} type="file" accept="image/*" className="sr-only" onChange={(e) => void doUpload(e.target.files?.[0] || null, "main")} />
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="outline" size="sm" className="text-xs h-8" disabled={!!uploading} onClick={() => mainInputRef.current?.click()}>
                        {uploading === "main" ? <Loader2 size={13} className="animate-spin mr-1" /> : <Upload size={13} className="mr-1" />} Upload Image
                      </Button>
                    </div>
                    <Input value={String(form.imageUrl || "")} onChange={(e) => setField("imageUrl", e.target.value)} className="h-8 text-xs" placeholder="Or paste image URL" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-gray-700">Mobile Image (optional)</label>
                  <div className="border border-dashed border-gray-300 rounded-sm p-3 bg-gray-50 space-y-2">
                    {form.mobileImageUrl ? (
                      <div className="relative w-full h-28 bg-white border border-gray-200 rounded overflow-hidden">
                        <Image src={String(form.mobileImageUrl)} alt="Mobile preview" fill className="object-cover" />
                      </div>
                    ) : (
                      <div className="h-28 flex items-center justify-center text-gray-400 text-xs">No mobile image</div>
                    )}
                    <input ref={mobileInputRef} type="file" accept="image/*" className="sr-only" onChange={(e) => void doUpload(e.target.files?.[0] || null, "mobile")} />
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="outline" size="sm" className="text-xs h-8" disabled={!!uploading} onClick={() => mobileInputRef.current?.click()}>
                        {uploading === "mobile" ? <Loader2 size={13} className="animate-spin mr-1" /> : <Upload size={13} className="mr-1" />} Upload
                      </Button>
                    </div>
                    <Input value={String(form.mobileImageUrl || "")} onChange={(e) => setField("mobileImageUrl", e.target.value)} className="h-8 text-xs" placeholder="Or paste mobile image URL" />
                  </div>
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs font-medium text-gray-700">
                <input type="checkbox" checked={form.isActive !== false} onChange={(e) => setField("isActive", e.target.checked)} className="w-4 h-4" />
                Active (visible on storefront)
              </label>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <Button type="button" variant="outline" onClick={closeModal} disabled={saving || !!uploading}>Cancel</Button>
                <Button type="submit" disabled={saving || !!uploading} className="bg-[#2874F0] hover:bg-[#1259c7] text-white">
                  {saving ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Save size={14} className="mr-1.5" />}
                  {editing ? "Save Changes" : "Add Banner"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

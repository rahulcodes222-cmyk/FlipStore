"use client";

import React, { useState, useEffect } from "react";
import {
  Save,
  CheckCircle2,
  RefreshCw,
  Store,
  DollarSign,
  ShieldAlert,
  Megaphone,
  FileText,
  Layout,
} from "lucide-react";
import { adminService, StoreSettings } from "@/services/adminService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// ─── Tab definitions ──────────────────────────────────────────────────────────

const MAIN_TABS = [
  { slug: "general",  label: "General Identity & Contact", icon: Store },
  { slug: "shipping", label: "Taxes & Delivery Policies",  icon: DollarSign },
  { slug: "about",    label: "About",                       icon: FileText },
  { slug: "help",     label: "Help",                        icon: Layout },
  { slug: "policy",   label: "Policy",                      icon: ShieldAlert },
  { slug: "social",   label: "Social",                      icon: Megaphone },
];

const ABOUT_SUBTABS  = [
  { slug: "about-us",  label: "About Us" },
  { slug: "careers",   label: "Careers" },
  { slug: "press",     label: "Press & Media" },
  { slug: "corporate", label: "Corporate Information" },
];

const HELP_SUBTABS = [
  { slug: "payments", label: "Payments" },
  { slug: "shipping", label: "Shipping" },
  { slug: "returns",  label: "Returns" },
  { slug: "faq",      label: "FAQ" },
  { slug: "report",   label: "Report Infringement" },
];

const POLICY_SUBTABS = [
  { slug: "returns",  label: "Return Policy" },
  { slug: "terms",    label: "Terms of Use" },
  { slug: "security", label: "Security" },
  { slug: "privacy",  label: "Privacy" },
  { slug: "sitemap",  label: "Sitemap" },
];

const SOCIAL_SUBTABS = [
  { slug: "contact",   label: "Contact Us" },
  { slug: "sell",      label: "Sell on FlipStore" },
  { slug: "affiliate", label: "Become Affiliate" },
  { slug: "advertise", label: "Advertise" },
];

const DEFAULT_SUB_TAB: Record<string, string> = {
  about:  "about-us",
  help:   "payments",
  policy: "returns",
  social: "contact",
};

// ─── Reusable ContentEditor ───────────────────────────────────────────────────

interface ContentEditorProps {
  subtabs: { slug: string; label: string }[];
  activeSubTab: string;
  setActiveSubTab: (s: string) => void;
  pageContent: string;
  setPageContent: (s: string) => void;
  pageImage: string;
  setPageImage: (s: string) => void;
  pageImages: string[];
  setPageImages: React.Dispatch<React.SetStateAction<string[]>>;
  uploadingPageImage: boolean;
  onUploadImage: (files: File[], multiple?: boolean) => Promise<void>;
  isEditingPage: boolean;
  setIsEditingPage: (b: boolean) => void;
  savingPage: boolean;
  staticPagesLoading: boolean;
  staticPages: any[];
  currentPageContent: string;
  currentPageImage: string;
  currentPageImages: string[];
  onSave: (slug: string) => void;
}

function ContentEditor({
  subtabs,
  activeSubTab,
  setActiveSubTab,
  pageContent,
  setPageContent,
  pageImage,
  setPageImage,
  pageImages,
  setPageImages,
  uploadingPageImage,
  onUploadImage,
  isEditingPage,
  setIsEditingPage,
  savingPage,
  staticPagesLoading,
  staticPages,
  currentPageContent,
  currentPageImage,
  currentPageImages,
  onSave,
}: ContentEditorProps) {
  const activeLabel = subtabs.find((t) => t.slug === activeSubTab)?.label ?? activeSubTab;
  // Safe guard: staticPages might be undefined briefly
  const pages = staticPages ?? [];
  const pageRecord = pages.find((p: any) => p.slug === activeSubTab);

  return (
    <div className="space-y-4">

      {/* ── Sub-tab bar ── */}
      <div className="flex flex-wrap gap-1 border-b border-gray-200">
        {subtabs.map((tab) => (
          <button
            key={tab.slug}
            type="button"
            onClick={() => {
              setActiveSubTab(tab.slug);
              setIsEditingPage(false);
              setPageContent("");
              setPageImage("");
              setPageImages([]);
            }}
            className={`px-4 py-2 text-xs font-semibold rounded-t-md transition-colors border border-b-0
              ${activeSubTab === tab.slug
                ? "bg-[#2874F0] text-white border-[#2874F0]"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Content area ── */}
      <div className="space-y-3 pt-1">
        {/* Title row */}
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">{activeLabel}</h3>
          <span className="text-[10px] text-gray-400 font-mono uppercase">/{activeSubTab}</span>
        </div>

        {isEditingPage ? (
          /* ────── EDIT MODE ────── */
          <div className="space-y-2">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Page Image</label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  multiple={activeSubTab === "careers"}
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length) void onUploadImage(files, activeSubTab === "careers");
                    e.currentTarget.value = "";
                  }}
                  className="block text-xs text-gray-600 file:mr-3 file:rounded file:border-0 file:bg-[#2874F0] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-[#1259c7]"
                />
                {uploadingPageImage && <span className="text-[10px] text-gray-400">Uploading...</span>}
                {activeSubTab !== "careers" && pageImage ? (
                  <button type="button" onClick={() => setPageImage("")} className="text-[10px] text-red-500 hover:underline">Remove</button>
                ) : null}
                {activeSubTab === "careers" && pageImages.length > 0 ? (
                  <button type="button" onClick={() => setPageImages([])} className="text-[10px] text-red-500 hover:underline">Remove all</button>
                ) : null}
              </div>
              {activeSubTab === "careers" ? (
                pageImages.length > 0 ? (
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2 max-w-2xl">
                    {pageImages.map((img, idx) => (
                      <div key={`${img}-${idx}`} className="relative">
                        <img src={img} alt={`${activeLabel} ${idx + 1}`} className="h-24 w-full rounded object-cover border border-gray-200" />
                        <button type="button" onClick={() => setPageImages((prev) => prev.filter((_, i) => i !== idx))} className="absolute top-1 right-1 bg-white/90 text-[10px] px-1.5 py-0.5 rounded text-red-600 border">Remove</button>
                      </div>
                    ))}
                  </div>
                ) : null
              ) : pageImage ? (
                <img src={pageImage} alt={activeLabel} className="mt-2 h-28 w-full max-w-md rounded object-cover border border-gray-200" />
              ) : null}
              {activeSubTab === "careers" ? <p className="text-[10px] text-gray-400 mt-1">Careers page supports multiple images.</p> : null}
            </div>
            <label className="block text-xs font-semibold text-gray-700">Edit Page Content (HTML)</label>
            <Textarea
              rows={14}
              value={pageContent}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPageContent(e.target.value)}
              className="w-full text-xs font-mono p-3 border border-gray-200 rounded bg-white focus:outline-none focus:border-[#2874F0]"
              placeholder="Write your page content in HTML…"
            />
            <p className="text-[10px] text-gray-400">HTML is supported — content will appear on the public page.</p>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => onSave(activeSubTab)}
                disabled={savingPage || staticPagesLoading || uploadingPageImage}
                className="text-xs font-bold text-[#2874F0] hover:text-[#1259c7] disabled:opacity-40"
              >
                {savingPage ? "Saving…" : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={() => { setPageContent(currentPageContent); setPageImage(currentPageImage); setPageImages(currentPageImages); setIsEditingPage(false); }}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          /* ────── VIEW MODE ────── */
          <div>
            {activeSubTab === "careers" && currentPageImages.length > 0 ? (
              <div className="mb-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {currentPageImages.map((img, idx) => (
                  <img key={`${img}-${idx}`} src={img} alt={`${activeLabel} ${idx + 1}`} className="h-28 w-full rounded-md object-cover border border-gray-100" />
                ))}
              </div>
            ) : currentPageImage ? (
              <img src={currentPageImage} alt={activeLabel} className="mb-4 h-48 w-full rounded-md object-cover border border-gray-100" />
            ) : null}
            {currentPageContent?.trim() ? (
              <div
                className="text-sm text-gray-800 p-4 border border-gray-100 rounded-md bg-gray-50
                           [&_h1]:text-lg [&_h1]:font-bold [&_h1]:text-gray-900 [&_h1]:mb-2
                           [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-gray-800 [&_h2]:mb-2
                           [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-gray-800 [&_h3]:mb-1
                           [&_p]:mb-2 [&_p]:leading-relaxed [&_p]:text-gray-700
                           [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-2
                           [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-2
                           [&_li]:mb-0.5
                           [&_a]:text-[#2874F0] [&_a]:underline
                           [&_strong]:font-semibold [&_em]:italic"
                dangerouslySetInnerHTML={{ __html: currentPageContent }}
              />
            ) : (
              <div className="p-8 border border-dashed border-gray-200 rounded-md bg-gray-50 text-center">
                <p className="text-xs text-gray-400">
                  No content saved yet for{" "}
                  <span className="font-semibold text-gray-600">{activeLabel}</span>.
                </p>
                <p className="text-[10px] text-gray-400 mt-1">
                  Click &quot;Add Content&quot; below to get started.
                </p>
              </div>
            )}

            {/* Action row */}
            <div className="flex items-center gap-4 pt-3">
              <button
                type="button"
                onClick={() => { setPageContent(currentPageContent); setPageImage(currentPageImage); setPageImages(currentPageImages); setIsEditingPage(true); }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2874F0] hover:text-[#1259c7]"
              >
                {/* pencil icon */}
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                  <path d="m15 5 4 4"/>
                </svg>
                {currentPageContent?.trim() ? "Edit Content" : "Add Content"}
              </button>

              {pageRecord?.updatedAt && (
                <span className="text-[10px] text-gray-400">
                  Last saved: {new Date(pageRecord.updatedAt).toLocaleDateString("en-IN", {
                    day: "numeric", month: "short", year: "numeric",
                  })}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AdminSettingsClient() {
  const [settings, setSettings]         = useState<StoreSettings | null>(null);
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [successMsg, setSuccessMsg]     = useState(false);
  const [staticPages, setStaticPages]   = useState<any[]>([]);
  const [staticPagesLoading, setStaticPagesLoading] = useState(false);
  const [activeMainTab, setActiveMainTab] = useState("general");
  const [activeSubTab, setActiveSubTab]   = useState("about-us");
  const [isEditingPage, setIsEditingPage] = useState(false);
  const [pageContent, setPageContent]     = useState("");
  const [pageImage, setPageImage]         = useState("");
  const [pageImages, setPageImages]       = useState<string[]>([]);
  const [savingPage, setSavingPage]       = useState(false);
  const [uploadingPageImage, setUploadingPageImage] = useState(false);

  // ── Load ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    adminService.getSettings().then((s) => { setSettings(s); setLoading(false); });
    fetchStaticPages();
  }, []);

  const fetchStaticPages = async () => {
    setStaticPagesLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/admin/static-pages`,
        { credentials: "include" }
      );
      if (res.ok) {
        const json = await res.json().catch(() => ({}));
        if (json?.success && Array.isArray(json?.data)) setStaticPages(json.data);
      }
    } catch { /* silent */ }
    finally { setStaticPagesLoading(false); }
  };

  // ── Save store settings ──────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setSuccessMsg(false);
    try {
      await adminService.updateSettings(settings);
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 4000);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  // ── Save static page (DB) ─────────────────────────────────────────────────
  const saveStaticPage = async (slug: string) => {
    const contentToSave = pageContent.trim();
    const imageToSave = pageImage.trim();
    const imagesToSave = pageImages.map((x) => x.trim()).filter(Boolean);
    const existing = staticPages.find((p: any) => p.slug === slug);
    const finalContent = contentToSave || String(existing?.content || "").trim();
    if (!finalContent && !imageToSave && imagesToSave.length === 0) return;
    setSavingPage(true);
    try {
      const allSubtabs = [
        ...ABOUT_SUBTABS, ...HELP_SUBTABS, ...POLICY_SUBTABS, ...SOCIAL_SUBTABS,
      ];
      const label = allSubtabs.find((t) => t.slug === slug)?.label || slug;

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/admin/static-pages/${slug}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: label,
            content: finalContent || "<p></p>",
            image: imageToSave,
            images: imagesToSave,
            isActive: true,
          }),
        }
      );
      const json = await res.json().catch(() => ({}));
      if (res.ok && json?.success) {
        setIsEditingPage(false);
        await fetchStaticPages();
      }
    } catch (err) { console.error(err); }
    finally { setSavingPage(false); }
  };

  const uploadPageImage = async (files: File[], multiple = false) => {
    if (!files.length) return;
    setUploadingPageImage(true);
    try {
      const uploaded: string[] = [];
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("folder", "store");
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/uploads`, {
          method: "POST",
          credentials: "include",
          body: fd,
        });
        const json = await res.json().catch(() => ({}));
        const url = json?.data?.url || json?.url;
        if (res.ok && typeof url === "string" && url) uploaded.push(url);
      }
      if (uploaded.length) {
        if (multiple) setPageImages((prev) => [...prev, ...uploaded]);
        else setPageImage(uploaded[0]);
      }
    } catch (err) { console.error(err); }
    finally { setUploadingPageImage(false); }
  };

  // ── Switch main tab ──────────────────────────────────────────────────────
  const switchMainTab = (slug: string) => {
    setActiveMainTab(slug);
    setIsEditingPage(false);
    setPageContent("");
    setPageImage("");
    setPageImages([]);
    if (DEFAULT_SUB_TAB[slug]) setActiveSubTab(DEFAULT_SUB_TAB[slug]);
  };

  const currentPage = staticPages.find((p: any) => p.slug === activeSubTab);

  // ── Common props for ContentEditor ──────────────────────────────────────
  const editorProps = {
    activeSubTab,
    setActiveSubTab,
    pageContent,
    setPageContent,
    pageImage,
    setPageImage,
    pageImages,
    setPageImages,
    uploadingPageImage,
    onUploadImage: uploadPageImage,
    isEditingPage,
    setIsEditingPage,
    savingPage,
    staticPagesLoading,
    staticPages,                        // ← always passed
    currentPageContent: currentPage?.content ?? "",
    currentPageImage: currentPage?.image ?? "",
    currentPageImages: Array.isArray(currentPage?.images) ? currentPage.images : [],
    onSave: saveStaticPage,
  };

  if (loading || !settings) {
    return (
      <div className="py-20 text-center text-gray-500 text-xs">
        <RefreshCw className="w-6 h-6 animate-spin text-[#2874F0] mx-auto mb-2" />
        Loading store configuration…
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* ── Page header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-[#212121] tracking-tight">Store Settings</h1>
            <span className="bg-blue-100 text-[#2874F0] text-[10px] font-bold px-2 py-0.5 rounded uppercase">
              Configuration
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Manage store identity, delivery policies, and all public page content.
          </p>
        </div>
        <Button
          variant="outline" size="sm" type="button"
          onClick={() => adminService.getSettings().then((s) => setSettings(s))}
          className="h-9 text-xs font-bold bg-white border-gray-300"
        >
          <RefreshCw size={13} className="mr-1.5" /> Refresh
        </Button>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-md flex items-center gap-2">
          <CheckCircle2 size={16} className="shrink-0" />
          <span className="font-semibold">Store settings saved successfully!</span>
        </div>
      )}

      {/* ── Main tab bar ── */}
      <div className="bg-white rounded-md border border-gray-200 shadow-sm">
        <div className="flex flex-wrap">
          {MAIN_TABS.map(({ slug, label, icon: Icon }) => (
            <button
              key={slug}
              type="button"
              onClick={() => switchMainTab(slug)}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold transition-colors border-b-2
                ${activeMainTab === slug
                  ? "border-[#2874F0] text-[#2874F0] bg-blue-50"
                  : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"}`}
            >
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab panels ── */}
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* General */}
        {activeMainTab === "general" && (
          <div className="bg-white rounded-md border border-gray-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-2.5">
              <Store className="w-4 h-4 text-[#2874F0]" />
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                General Identity &amp; Contact
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Store Name</label>
                <Input value={settings.storeName}
                  onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                  className="h-9 text-xs" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Currency Code</label>
                <Input value={settings.currency} placeholder="INR"
                  onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                  className="h-9 text-xs font-mono font-bold" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Support Email</label>
                <Input type="email" value={settings.supportEmail}
                  onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                  className="h-9 text-xs" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Support Helpline</label>
                <Input value={settings.supportPhone}
                  onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
                  className="h-9 text-xs" />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={saving}
                className="h-9 text-xs font-bold bg-[#2874F0] hover:bg-[#1259c7] text-white px-6">
                <Save size={14} className="mr-1.5" />
                {saving ? "Saving…" : "Save Settings"}
              </Button>
            </div>
          </div>
        )}

        {/* Shipping */}
        {activeMainTab === "shipping" && (
          <div className="bg-white rounded-md border border-gray-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-2.5">
              <DollarSign className="w-4 h-4 text-[#2874F0]" />
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Taxes &amp; Delivery Policies
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Standard GST / Tax Rate (%)</label>
                <Input type="number" min={0} max={100} value={settings.taxPercentage}
                  onChange={(e) => setSettings({ ...settings, taxPercentage: Number(e.target.value) })}
                  className="h-9 text-xs font-bold" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Standard Delivery Charge (₹)</label>
                <Input type="number" min={0}
                  value={Number.isFinite(Number(settings.standardDeliveryCharge)) ? Number(settings.standardDeliveryCharge) : 40}
                  onChange={(e) => setSettings({ ...settings, standardDeliveryCharge: Number(e.target.value) })}
                  className="h-9 text-xs font-bold" />
                <p className="text-[10px] text-gray-400 mt-1">Fallback when Shiprocket rate is unavailable.</p>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">Free Delivery Threshold (₹)</label>
                <Input type="number" min={0} value={settings.freeDeliveryThreshold}
                  onChange={(e) => setSettings({ ...settings, freeDeliveryThreshold: Number(e.target.value) })}
                  className="h-9 text-xs font-bold max-w-xs" />
                <p className="text-[10px] text-gray-400 mt-1">Orders above this amount qualify for free shipping.</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={saving}
                className="h-9 text-xs font-bold bg-[#2874F0] hover:bg-[#1259c7] text-white px-6">
                <Save size={14} className="mr-1.5" />
                {saving ? "Saving…" : "Save Settings"}
              </Button>
            </div>
          </div>
        )}

        {/* About */}
        {activeMainTab === "about" && (
          <div className="bg-white rounded-md border border-gray-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-2.5">
              <FileText className="w-4 h-4 text-[#2874F0]" />
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">About — Page Content</h2>
            </div>
            <ContentEditor subtabs={ABOUT_SUBTABS} {...editorProps} />
          </div>
        )}

        {/* Help */}
        {activeMainTab === "help" && (
          <div className="bg-white rounded-md border border-gray-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-2.5">
              <Layout className="w-4 h-4 text-[#2874F0]" />
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Help — Page Content</h2>
            </div>
            <ContentEditor subtabs={HELP_SUBTABS} {...editorProps} />
          </div>
        )}

        {/* Policy */}
        {activeMainTab === "policy" && (
          <div className="bg-white rounded-md border border-gray-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-2.5">
              <ShieldAlert className="w-4 h-4 text-[#2874F0]" />
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Policy — Page Content</h2>
            </div>
            <ContentEditor subtabs={POLICY_SUBTABS} {...editorProps} />
          </div>
        )}

        {/* Social */}
        {activeMainTab === "social" && (
          <div className="bg-white rounded-md border border-gray-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-2.5">
              <Megaphone className="w-4 h-4 text-[#2874F0]" />
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Social — Page Content</h2>
            </div>
            <ContentEditor subtabs={SOCIAL_SUBTABS} {...editorProps} />
          </div>
        )}

      </form>
    </div>
  );
}

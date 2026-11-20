"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Store,
  DollarSign,
  Mail,
  Phone,
  ShieldAlert,
  Megaphone,
} from "lucide-react";
import { adminService, StoreSettings } from "@/services/adminService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function AdminSettingsClient() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  useEffect(() => {
    adminService.getSettings().then((s) => {
      setSettings(s);
      setLoading(false);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setSaving(true);
    setSuccessMsg(false);

    try {
      await adminService.updateSettings(settings);
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="py-20 text-center text-gray-500 text-xs">
        <RefreshCw className="w-6 h-6 animate-spin text-[#2874F0] mx-auto mb-2" />
        Loading store configuration...
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-[#212121] tracking-tight">Store Settings</h1>
            <span className="bg-blue-100 text-[#2874F0] text-[10px] font-bold px-2 py-0.5 rounded uppercase">
              Configuration
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Global store policies, currency, checkout delivery thresholds, and site-wide announcements.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-md flex items-center gap-2">
          <CheckCircle2 size={16} className="shrink-0" />
          <span className="font-semibold">Store settings successfully saved and synced to localStorage!</span>
        </div>
      )}

      {/* ── Settings Form ────────────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Store Profile */}
        <div className="bg-white rounded-md border border-gray-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-2.5">
            <Store className="w-4 h-4 text-[#2874F0]" />
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              General Identity &amp; Contact
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Store Name
              </label>
              <Input
                value={settings.storeName}
                onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                className="h-9 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Currency Code
              </label>
              <Input
                value={settings.currency}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                className="h-9 text-xs font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Support Email
              </label>
              <Input
                type="email"
                value={settings.supportEmail}
                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                className="h-9 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Support Helpline
              </label>
              <Input
                value={settings.supportPhone}
                onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
                className="h-9 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Pricing, Tax & Shipping Policy */}
        <div className="bg-white rounded-md border border-gray-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-2.5">
            <DollarSign className="w-4 h-4 text-[#2874F0]" />
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              Taxes &amp; Delivery Policies
            </h2>
          </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Standard GST / Tax Rate (%)
              </label>
              <Input
                type="number"
                min={0}
                max={100}
                value={settings.taxPercentage}
                onChange={(e) =>
                  setSettings({ ...settings, taxPercentage: Number(e.target.value) })
                }
                className="h-9 text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Standard Delivery Charge (₹)
              </label>
              <Input
                type="number"
                min={0}
                value={Number.isFinite(Number(settings.standardDeliveryCharge)) ? Number(settings.standardDeliveryCharge) : 40}
                onChange={(e) =>
                  setSettings({ ...settings, standardDeliveryCharge: Number(e.target.value) })
                }
                className="h-9 text-xs font-bold"
              />
              <p className="text-[10px] text-gray-400 mt-1">
                Used as fallback when Shiprocket rate is unavailable.
              </p>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Free Delivery Basket Threshold (₹)
              </label>
              <Input
                type="number"
                min={0}
                value={settings.freeDeliveryThreshold}
                onChange={(e) =>
                  setSettings({ ...settings, freeDeliveryThreshold: Number(e.target.value) })
                }
                className="h-9 text-xs font-bold max-w-xs"
              />
              <p className="text-[10px] text-gray-400 mt-1">
                Orders with subtotal above this qualify for free shipping.
              </p>
            </div>
          </div>
        </div>

        {/* Banner Announcement & Maintenance */}
        <div className="bg-white rounded-md border border-gray-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-2.5">
            <Megaphone className="w-4 h-4 text-[#2874F0]" />
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              Marketing &amp; System Maintenance
            </h2>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Storewide Announcement Strip
            </label>
            <Textarea
              rows={2}
              value={settings.announcementBanner}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSettings({ ...settings, announcementBanner: e.target.value })}
              className="text-xs"
            />
            <p className="text-[10px] text-gray-400 mt-1">
              Displayed prominently across the header for all visiting customers.
            </p>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-3 cursor-pointer p-3 rounded border border-gray-200 bg-gray-50/50">
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                className="rounded text-red-600 focus:ring-red-500 w-4 h-4"
              />
              <div>
                <span className="text-xs font-bold text-gray-900 block">
                  Enable Maintenance Mode
                </span>
                <span className="text-[11px] text-gray-500">
                  When enabled, non-admin visitors see a maintenance maintenance overlay.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="submit"
            disabled={saving}
            className="h-9 text-xs font-bold bg-[#2874F0] hover:bg-[#1259c7] text-white px-6"
          >
            <Save size={14} className="mr-1.5" />
            {saving ? "Saving Changes..." : "Save Store Settings"}
          </Button>
        </div>
      </form>
    </div>
  );
}

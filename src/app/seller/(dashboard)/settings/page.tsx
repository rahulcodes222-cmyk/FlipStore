"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useHydration } from "@/hooks/useHydration";
import { useSellerStore } from "@/store/useSellerStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const SETTINGS = [
  { key: "account", label: "Account Settings", icon: "user" },
  { key: "store", label: "Store Settings", icon: "store" },
  { key: "business", label: "Business Information", icon: "building" },
  { key: "password", label: "Password Settings", icon: "lock" },
  { key: "notifications", label: "Notification Preferences", icon: "bell" },
  { key: "shipping", label: "Shipping Preferences", icon: "truck" },
  { key: "tax", label: "Tax Preferences", icon: "file-text" },
];

export default function SellerSettingsPage() {
  const isHydrated = useHydration();
  const { seller } = useSellerStore();
  const router = useRouter();
  const currentSeller = isHydrated ? seller : null;
  const [active, setActive] = useState("account");

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-lg font-bold text-[#212121]">Settings</h1>
        <Link
          href="/seller/dashboard"
          className="text-[11px] font-semibold text-[#2874F0] hover:underline flex items-center gap-1"
        >
          <span>← Back to Dashboard</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <aside className="lg:col-span-3 rounded-sm border border-[#E0E0E0] bg-white shadow-sm">
          <div className="p-4 border-b border-[#F0F0F0]">
            <p className="text-xs font-bold text-[#878787] uppercase tracking-wider mb-3">Settings</p>
            <div className="space-y-1">
              {SETTINGS.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setActive(s.key)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-sm text-sm transition-colors",
                    active === s.key
                      ? "bg-[#2874F0]/10 text-[#2874F0] font-medium"
                      : "text-[#878787] hover:bg-[#F1F3F6] hover:text-[#212121]"
                  )}
                >
                  <span className="w-5">{s.icon === "user" ? "👤" : s.icon === "store" ? "🏪" : s.icon === "building" ? "🏢" : s.icon === "lock" ? "🔒" : s.icon === "bell" ? "🔔" : s.icon === "truck" ? "🚚" : "🧾"}</span>
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div className="lg:col-span-9">
          <div className="rounded-sm border border-[#E0E0E0] bg-white p-6 shadow-sm">
            <h2 className="text-sm font-bold text-[#212121] mb-4">
              {SETTINGS.find((s) => s.key === active)?.label}
            </h2>
            {active === "account" && (
              <div className="space-y-4">
                <p className="text-sm text-[#878787]">
                  Manage your personal seller account details. Changes reflect across your store and dashboard.
                </p>
                <div className="mt-4 space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Full Name</label>
                    <Input defaultValue={currentSeller?.name || ""} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Email</label>
                    <Input defaultValue={currentSeller?.email || ""} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Mobile</label>
                    <Input defaultValue={currentSeller?.phone || ""} />
                  </div>
                </div>
                <Button variant="primary">Save Account Changes</Button>
              </div>
            )}
            {active === "password" && (
              <div className="space-y-4">
                <p className="text-sm text-[#878787]">
                  Change your seller account password. This is used to log in to Seller Hub.
                </p>
                <div className="mt-4 space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Current Password</label>
                    <Input type="password" placeholder="••••••••" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">New Password</label>
                    <Input type="password" placeholder="••••••••" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Confirm New Password</label>
                    <Input type="password" placeholder="••••••••" />
                  </div>
                </div>
                <Button variant="primary">Update Password</Button>
              </div>
            )}
            {active === "notifications" && (
              <div className="space-y-4">
                <p className="text-sm text-[#878787]">
                  Choose which notifications you'd like to receive about your store.
                </p>
                <div className="mt-4 space-y-3">
                  {[
                    "New order alerts",
                    "Low stock alerts",
                    "Payment updates",
                    "Return requests",
                    "Product approvals",
                    "Store updates",
                  ].map((n) => (
                    <div key={n} className="flex items-center justify-between p-3 rounded-sm border border-[#E0E0E0] bg-[#F9FAFB]">
                      <span className="text-sm text-[#212121]">{n}</span>
                      <input
                        type="checkbox"
                        defaultChecked
                        className="rounded-sm text-[#2874F0] focus:ring-[#2874F0]"
                      />
                    </div>
                  ))}
                </div>
                <Button variant="primary">Save Preferences</Button>
              </div>
            )}
            {active === "store" && (
              <div>
                <p className="text-sm text-[#878787] mb-4">
                  Manage your store branding and profile. Full store editing is available in Store Management.
                </p>
                <Button variant="outline" onClick={() => router.push("/seller/store")}>
                  Go to Store Management
                </Button>
              </div>
            )}
            {active === "business" && (
              <div className="space-y-4">
                <p className="text-sm text-[#878787]">
                  View and update your registered business details.
                </p>
                <div className="mt-4 space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Business Name</label>
                    <Input defaultValue={currentSeller?.storeName || ""} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Business Category</label>
                    <Input defaultValue={currentSeller?.businessCategory || ""} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">GST Number</label>
                    <Input defaultValue={currentSeller?.gstNumber || ""} />
                  </div>
                </div>
                <Button variant="primary">Save Business Details</Button>
              </div>
            )}
            {active === "shipping" && (
              <div className="space-y-4">
                <p className="text-sm text-[#878787]">
                  Configure shipping preferences for your store.
                </p>
                <div className="mt-4 space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Preferred Shipping Partner</label>
                    <Input defaultValue="Delhivery" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Shipping Origin (PIN)</label>
                    <Input defaultValue={currentSeller?.address?.pincode || ""} />
                  </div>
                </div>
                <Button variant="primary">Save Shipping Preferences</Button>
              </div>
            )}
            {active === "tax" && (
              <div className="space-y-4">
                <p className="text-sm text-[#878787]">
                  Manage your tax registration details for invoicing.
                </p>
                <div className="mt-4 space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">GST Number</label>
                    <Input defaultValue={currentSeller?.gstNumber || ""} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">PAN Number</label>
                    <Input defaultValue={currentSeller?.panNumber || ""} />
                  </div>
                </div>
                <Button variant="primary">Save Tax Details</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

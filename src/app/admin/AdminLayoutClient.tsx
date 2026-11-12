"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingBag,
  Users,
  Ticket,
  Star,
  Settings,
  Plus,
  ExternalLink,
  Menu,
  X,
  Bell,
  Search,
  ShieldAlert,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Categories", href: "/admin/categories", icon: Layers },
  { label: "Orders", href: "/admin/orders", icon: ShoppingBag },
  { label: "Customers", href: "/admin/customers", icon: Users },
  { label: "Coupons", href: "/admin/coupons", icon: Ticket },
  { label: "Reviews", href: "/admin/reviews", icon: Star },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F1F3F6] flex flex-col lg:flex-row">
      {/* ── Mobile Sidebar Overlay ────────────────────────────────────────── */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* ── Sidebar ───────────────────────────────────────────────────────── */}
      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 h-screen w-64 bg-[#172337] text-white flex flex-col z-50 transition-transform duration-300 ease-in-out shrink-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-[#21314d] flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-sm bg-[#2874F0] flex items-center justify-center font-black text-white text-base">
              F
            </div>
            <div>
              <span className="text-white font-bold text-base tracking-tight">FlipStore</span>
              <span className="text-[#ffe500] text-[10px] font-bold block uppercase tracking-wider">
                Admin Console
              </span>
            </div>
          </Link>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3 overflow-y-auto space-y-1">
          <p className="px-3 py-1.5 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
            Management
          </p>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "flex items-center justify-between px-3.5 py-2.5 rounded-sm text-xs font-semibold transition-colors",
                  isActive
                    ? "bg-[#2874F0] text-white shadow-xs font-bold"
                    : "text-gray-300 hover:bg-[#21314d] hover:text-white"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon size={16} className={isActive ? "text-white" : "text-gray-400"} />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight size={13} className="text-blue-200" />}
              </Link>
            );
          })}
        </nav>

        {/* Demo Disclaimer notice */}
        <div className="p-3 mx-3 mb-3 bg-[#0d1624] border border-[#21314d] rounded-sm text-[10px] text-gray-400">
          <div className="flex items-center gap-1 font-bold text-amber-400 mb-0.5">
            <ShieldAlert size={11} />
            <span>Frontend Demo</span>
          </div>
          <p className="leading-snug">
            Admin console connected to frontend state &amp; localStorage.
          </p>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-[#21314d] flex items-center justify-between text-xs">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-gray-400 hover:text-white font-medium transition-colors"
          >
            <LogOut size={13} />
            <span>View Storefront</span>
          </Link>
          <span className="text-[10px] text-[#ffe500] bg-yellow-950/60 border border-yellow-800 px-1.5 py-0.5 rounded-xs">
            v1.0
          </span>
        </div>
      </aside>

      {/* ── Main Layout Column ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-[#E0E0E0] h-14 px-4 sm:px-6 flex items-center justify-between shadow-2xs gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-1.5 text-gray-600 hover:bg-gray-100 rounded-sm"
              aria-label="Open sidebar menu"
            >
              <Menu size={20} />
            </button>

            {/* Quick Search in admin */}
            <div className="relative hidden sm:block w-64 md:w-80">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                type="text"
                placeholder="Search catalog, orders, customers..."
                className="w-full h-8 pl-9 pr-3 text-xs bg-gray-50 border border-[#E0E0E0] rounded-xs focus:outline-none focus:border-[#2874F0] focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Add Product Button */}
            <Link href="/admin/products/add">
              <button
                type="button"
                className="bg-[#2874F0] hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <Plus size={14} />
                <span className="hidden sm:inline">Add Product</span>
              </button>
            </Link>

            {/* Notification Bell */}
            <div className="relative p-1.5 text-gray-600 hover:bg-gray-100 rounded-sm cursor-pointer">
              <Bell size={17} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#FB641B] rounded-full" />
            </div>

            {/* Admin User Chip */}
            <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
              <div className="w-7 h-7 rounded-full bg-[#172337] text-white flex items-center justify-center font-bold text-xs">
                A
              </div>
              <div className="hidden md:block text-left text-xs leading-none">
                <span className="font-bold text-[#212121] block">Admin</span>
                <span className="text-[10px] text-[#388E3C] font-semibold">Superuser</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1400px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

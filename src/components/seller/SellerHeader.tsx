"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Bell,
  HelpCircle,
  LogOut,
  Store,
  User,
  ChevronDown,
  Menu,
} from "lucide-react";
import { useHydration } from "@/hooks/useHydration";
import { useSellerStore } from "@/store/useSellerStore";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SellerStatusBadge } from "./SellerStatusBadge";

interface SellerHeaderProps {
  onOpenDrawer?: () => void;
  title?: string;
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-1a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1h-1a2 2 0 0 1-2-2 2 2 0 0 1 2-2h1a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0-.33 1.82 1.65 1.65 0 0 0 1.51 1h1a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-1a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

export function SellerHeader({ onOpenDrawer, title = "Seller Dashboard" }: SellerHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isHydrated = useHydration();
  const { seller, isAuthenticated, logout } = useSellerStore();
  const currentSeller = isHydrated ? seller : null;
  const isLoggedIn = isHydrated ? isAuthenticated : false;

  const [profileOpen, setProfileOpen] = useState(false);

  const sellerName = currentSeller?.storeName || currentSeller?.name || "Seller";
  const sellerEmail = currentSeller?.email;

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
    router.push("/seller/login");
  };

  return (
    <header className="sticky top-0 z-40 bg-[#172337] shadow-header select-none">
      <div className="max-w-[1280px] mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between gap-3 sm:gap-6 py-3">
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {onOpenDrawer && (
              <button
                type="button"
                onClick={onOpenDrawer}
                className="md:hidden text-[#ffe500] p-1.5 rounded-sm hover:bg-white/10 active:scale-95 transition-all"
                aria-label="Open navigation drawer"
              >
                <Menu size={22} />
              </button>
            )}
            <Link
              href="/seller/dashboard"
              className="flex items-center gap-2 group"
              onClick={() => setProfileOpen(false)}
            >
              <Store size={20} className="text-[#2874F0]" />
              <div className="flex flex-col leading-none">
                <span className="text-white font-bold text-sm sm:text-base tracking-tight">
                  FlipStore
                </span>
                <span className="text-[#ffe500] text-[10px] font-bold tracking-wider uppercase">
                  Seller Hub
                </span>
              </div>
            </Link>
          </div>

          <div className="hidden lg:flex items-center gap-1.5">
            <span className="text-xs font-bold text-[#B0B0B0] uppercase tracking-wider">
              Seller
            </span>
            <span className="text-[#ffe500] text-xs font-bold uppercase tracking-wider">
              Hub
            </span>
            <span className="w-px h-3 bg-[#21314d] mx-1" />
            <span className="text-sm font-medium text-[#212121]">{title}</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <div className="hidden sm:flex items-center gap-1 text-[#878787] text-xs">
              <span>Search orders, products…</span>
            </div>

            <div className="relative">
              <button
                type="button"
                className="p-2 rounded-sm text-[#B0B0B0] hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Notifications"
              >
                <Bell size={20} />
              </button>
            </div>

            <div className="relative">
              <button
                type="button"
                className="p-2 rounded-sm text-[#B0B0B0] hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Help"
              >
                <HelpCircle size={20} />
              </button>
            </div>

            <div className="relative group">
              <button
                type="button"
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-sm text-sm font-medium text-white hover:bg-white/10 transition-colors"
                aria-expanded={profileOpen}
                aria-haspopup="true"
              >
                <User size={18} className="text-[#ffe500]" />
                <span className="hidden sm:inline max-w-[100px] truncate">{sellerName}</span>
                <ChevronDown size={14} className={cn("transition-transform", profileOpen && "rotate-180")} />
              </button>

              {profileOpen && isLoggedIn && currentSeller && (
                <div
                  className="absolute right-0 top-full mt-1.5 w-64 bg-white rounded-sm shadow-2xl border border-[#E0E0E0] py-2 z-50 animate-in fade-in-50 zoom-in-95 duration-150"
                >
                  <div className="px-4 py-3 bg-[#F9FAFB] border-b border-[#F0F0F0]">
                    <p className="font-semibold text-sm text-[#212121] truncate">{currentSeller.name}</p>
                    <p className="text-xs text-[#878787] truncate">{sellerEmail}</p>
                    <p className="text-xs text-[#2874F0] font-medium mt-1">{currentSeller.storeName}</p>
                    <SellerStatusBadge status={currentSeller.verificationStatus} size="sm" />
                  </div>
                  <div className="py-1">
                    <Link
                      href="/seller/profile"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-[#212121] hover:bg-[#F1F3F6] hover:text-[#2874F0] transition-colors"
                    >
                      <User size={16} className="text-gray-500" />
                      <span>My Profile</span>
                    </Link>
                    <Link
                      href="/seller/store"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-[#212121] hover:bg-[#F1F3F6] hover:text-[#2874F0] transition-colors"
                    >
                      <Store size={16} className="text-gray-500" />
                      <span>My Store</span>
                    </Link>
                    <Link
                      href="/seller/settings"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-[#212121] hover:bg-[#F1F3F6] hover:text-[#2874F0] transition-colors"
                    >
                      <SettingsIcon className="text-gray-500" />
                      <span>Settings</span>
                    </Link>
                  </div>
                  <div className="border-t border-[#F0F0F0] mt-2 pt-2">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-4 py-2 text-left text-sm text-[#E53935] hover:bg-[#FFEBEE] font-medium transition-colors"
                    >
                      <LogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  HelpCircle,
  LogOut,
  Store,
  User,
  ChevronDown,
  Menu,
  Settings,
} from "lucide-react";
import { useHydration } from "@/hooks/useHydration";
import { useSellerStore } from "@/store/useSellerStore";
import { cn } from "@/lib/utils";
import { SellerStatusBadge } from "./SellerStatusBadge";

interface SellerHeaderProps {
  onOpenDrawer?: () => void;
  title?: string;
}

export function SellerHeader({ onOpenDrawer, title = "Seller Dashboard" }: SellerHeaderProps) {
  const router = useRouter();
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
    <header className="sticky top-0 z-40 border-b border-[#21314d] bg-[#172337]">
      <div className="mx-auto flex h-14 max-w-[1280px] items-center justify-between gap-3 px-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          {onOpenDrawer && (
            <button
              type="button"
              onClick={onOpenDrawer}
              className="inline-flex h-9 w-9 items-center justify-center rounded-sm text-[#ffe500] hover:bg-white/10 md:hidden"
              aria-label="Open navigation"
            >
              <Menu size={20} />
            </button>
          )}
          <Link
            href="/seller/dashboard"
            className="flex items-center gap-2"
            onClick={() => setProfileOpen(false)}
          >
            <Store size={18} className="text-[#2874F0]" />
            <div className="leading-none">
              <div className="text-sm font-bold tracking-tight text-white sm:text-base">FlipStore</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#ffe500]">Seller Hub</div>
            </div>
          </Link>
          <div className="hidden min-w-0 items-center gap-2 border-l border-[#21314d] pl-3 lg:flex">
            <span className="truncate text-sm font-medium text-white/90">{title}</span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-sm text-[#B0B0B0] hover:bg-white/10 hover:text-white"
            aria-label="Notifications"
          >
            <Bell size={18} />
          </button>
          <Link
            href="/seller/help"
            className="inline-flex h-9 w-9 items-center justify-center rounded-sm text-[#B0B0B0] hover:bg-white/10 hover:text-white"
            aria-label="Help"
            onClick={() => setProfileOpen(false)}
          >
            <HelpCircle size={18} />
          </Link>

          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((v) => !v)}
              className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm font-medium text-white hover:bg-white/10 sm:px-3"
              aria-expanded={profileOpen}
              aria-haspopup="true"
            >
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#2874F0]/20 text-[#ffe500]">
                <User size={15} />
              </span>
              <span className="hidden max-w-[120px] truncate sm:inline">{sellerName}</span>
              <ChevronDown size={14} className={cn("transition-transform", profileOpen && "rotate-180")} />
            </button>

            {profileOpen && isLoggedIn && currentSeller && (
              <div className="absolute right-0 top-full z-50 mt-1.5 w-64 rounded-sm border border-[#E0E0E0] bg-white py-2 shadow-2xl">
                <div className="border-b border-[#F0F0F0] bg-[#F9FAFB] px-4 py-3">
                  <p className="truncate text-sm font-semibold text-[#212121]">{currentSeller.name}</p>
                  {sellerEmail ? <p className="truncate text-xs text-[#878787]">{sellerEmail}</p> : null}
                  <p className="mt-1 truncate text-xs font-medium text-[#2874F0]">{currentSeller.storeName}</p>
                  <div className="mt-2">
                    <SellerStatusBadge status={currentSeller.verificationStatus} size="sm" />
                  </div>
                </div>
                <div className="py-1">
                  <Link href="/seller/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-[#212121] hover:bg-[#F1F3F6] hover:text-[#2874F0]">
                    <User size={16} className="text-gray-500" />
                    <span>My Profile</span>
                  </Link>
                  <Link href="/seller/store" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-[#212121] hover:bg-[#F1F3F6] hover:text-[#2874F0]">
                    <Store size={16} className="text-gray-500" />
                    <span>My Store</span>
                  </Link>
                  <Link href="/seller/settings" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-[#212121] hover:bg-[#F1F3F6] hover:text-[#2874F0]">
                    <Settings size={16} className="text-gray-500" />
                    <span>Settings</span>
                  </Link>
                </div>
                <div className="mt-2 border-t border-[#F0F0F0] pt-2">
                  <button type="button" onClick={handleLogout} className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm font-medium text-[#E53935] hover:bg-[#FFEBEE]">
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

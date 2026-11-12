"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  X,
  User,
  Package,
  Heart,
  Store,
  HelpCircle,
  LogOut,
  ChevronRight,
  ShieldCheck,
  MapPin,
  Settings,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useWishlistStore } from "@/store/useWishlistStore";
import { CATEGORIES_NAV_ITEMS } from "@/components/layout/CategoryNavigation";

export interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const wishlistCount = useWishlistStore((state) => state.items.length);

  // Close on Escape & Lock body scroll
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.body.style.overflow = "unset";
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleLogout = () => {
    logout();
    onClose();
    router.push("/");
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity duration-300 md:hidden animate-in fade-in"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="fixed top-0 left-0 bottom-0 w-[85%] max-w-xs bg-white shadow-2xl flex flex-col z-50 overflow-hidden animate-in slide-in-from-left duration-300"
      >
        {/* User Greeting Bar (Flipkart Blue Header) */}
        <div className="bg-[#2874F0] text-white p-4 flex items-center justify-between shrink-0">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white text-[#2874F0] font-bold flex items-center justify-center text-base shadow-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm truncate">{user.name}</p>
                <p className="text-[11px] text-blue-100 truncate">{user.phone || user.email}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white">
                <User size={20} />
              </div>
              <div>
                <p className="text-sm font-bold">Welcome, Shopper</p>
                <Link
                  href="/login"
                  onClick={onClose}
                  className="text-xs text-[#ffe500] font-semibold underline underline-offset-2"
                >
                  Login / Register
                </Link>
              </div>
            </div>
          )}

          <button
            onClick={onClose}
            className="p-1 rounded-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close menu drawer"
          >
            <X size={22} />
          </button>
        </div>

        {/* Scrollable Navigation Body */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#F0F0F0] text-sm text-[#212121]">
          {/* Section 1: My Account Links */}
          <div className="py-2">
            <Link
              href={isAuthenticated ? "/account" : "/login"}
              onClick={onClose}
              className="flex items-center justify-between px-4 py-3 hover:bg-[#F1F3F6] transition-colors"
            >
              <div className="flex items-center gap-3">
                <User size={18} className="text-[#2874F0]" />
                <span className="font-medium">My Profile</span>
              </div>
              <ChevronRight size={16} className="text-gray-400" />
            </Link>

            <Link
              href={isAuthenticated ? "/orders" : "/login?redirect=/orders"}
              onClick={onClose}
              className="flex items-center justify-between px-4 py-3 hover:bg-[#F1F3F6] transition-colors"
            >
              <div className="flex items-center gap-3">
                <Package size={18} className="text-[#2874F0]" />
                <span className="font-medium">My Orders</span>
              </div>
              <ChevronRight size={16} className="text-gray-400" />
            </Link>

            <Link
              href="/wishlist"
              onClick={onClose}
              className="flex items-center justify-between px-4 py-3 hover:bg-[#F1F3F6] transition-colors"
            >
              <div className="flex items-center gap-3">
                <Heart size={18} className="text-[#FB641B]" />
                <span className="font-medium">My Wishlist</span>
              </div>
              <div className="flex items-center gap-1.5">
                {wishlistCount > 0 && (
                  <span className="text-xs font-bold bg-[#FFF3ED] text-[#FB641B] px-2 py-0.5 rounded-full">
                    {wishlistCount}
                  </span>
                )}
                <ChevronRight size={16} className="text-gray-400" />
              </div>
            </Link>

            {isAuthenticated && (
              <Link
                href="/account/addresses"
                onClick={onClose}
                className="flex items-center justify-between px-4 py-3 hover:bg-[#F1F3F6] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <MapPin size={18} className="text-[#2874F0]" />
                  <span className="font-medium">Saved Addresses</span>
                </div>
                <ChevronRight size={16} className="text-gray-400" />
              </Link>
            )}

            {user?.role === "admin" && (
              <Link
                href="/admin"
                onClick={onClose}
                className="flex items-center justify-between px-4 py-3 bg-blue-50 text-[#2874F0] font-semibold"
              >
                <div className="flex items-center gap-3">
                  <Settings size={18} className="text-[#2874F0]" />
                  <span>Admin Dashboard</span>
                </div>
                <ChevronRight size={16} />
              </Link>
            )}
          </div>

          {/* Section 2: Shop by Category */}
          <div className="py-2">
            <div className="px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#878787]">
              All Categories
            </div>
            {CATEGORIES_NAV_ITEMS.map((cat) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.slug}
                  href={`/category/${cat.slug}`}
                  onClick={onClose}
                  className="flex items-center justify-between px-4 py-2.5 hover:bg-[#F1F3F6] transition-colors text-xs sm:text-sm"
                >
                  <div className="flex items-center gap-3">
                    <Icon size={16} className="text-gray-500" />
                    <span>{cat.label}</span>
                  </div>
                  <ChevronRight size={14} className="text-gray-400" />
                </Link>
              );
            })}
          </div>

          {/* Section 3: Vendor & Programs */}
          <div className="py-2">
            <Link
              href="/sell"
              onClick={onClose}
              className="flex items-center justify-between px-4 py-3 hover:bg-[#F1F3F6] transition-colors"
            >
              <div className="flex items-center gap-3">
                <Store size={18} className="text-[#388E3C]" />
                <span className="font-medium">Become a Seller</span>
              </div>
              <ChevronRight size={16} className="text-gray-400" />
            </Link>

            <Link
              href="/help/faq"
              onClick={onClose}
              className="flex items-center justify-between px-4 py-3 hover:bg-[#F1F3F6] transition-colors"
            >
              <div className="flex items-center gap-3">
                <HelpCircle size={18} className="text-gray-500" />
                <span className="font-medium">24x7 Customer Care</span>
              </div>
              <ChevronRight size={16} className="text-gray-400" />
            </Link>

            <Link
              href="/policy/privacy"
              onClick={onClose}
              className="flex items-center justify-between px-4 py-3 hover:bg-[#F1F3F6] transition-colors"
            >
              <div className="flex items-center gap-3">
                <ShieldCheck size={18} className="text-gray-500" />
                <span className="font-medium">Privacy & Legal</span>
              </div>
              <ChevronRight size={16} className="text-gray-400" />
            </Link>
          </div>

          {/* Section 4: Authentication Actions */}
          {isAuthenticated && (
            <div className="p-3">
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-sm border border-red-200 text-red-600 hover:bg-red-50 font-semibold text-xs transition-colors"
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

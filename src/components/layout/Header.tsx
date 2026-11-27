"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingCart,
  Heart,
  User as UserIcon,
  Menu,
  ChevronDown,
  Store,
  Package,
  LogOut,
  Settings,
  Search,
  Sparkles,
} from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useHydration } from "@/hooks/useHydration";
import { SearchBar } from "@/components/layout/SearchBar";
import { CategoryNavigation } from "@/components/layout/CategoryNavigation";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { DeliveryLocationSelector } from "@/components/layout/DeliveryLocationSelector";
import { cn } from "@/lib/utils";
import { getStoreName } from "@/lib/storeSettings";

export function Header() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [storeName, setStoreName] = useState<string>("FlipStore");

  const userDropdownRef = useRef<HTMLDivElement>(null);

  // Zustand state with React 19 useSyncExternalStore hydration safety
  const isHydrated = useHydration();
  const rawCartCount = useCartStore((state) =>
    state.items.reduce((total, item) => total + item.quantity, 0)
  );
  const rawWishlistCount = useWishlistStore((state) => state.items.length);
  const { user, isAuthenticated, logout } = useAuthStore();

  const cartCount = isHydrated ? rawCartCount : 0;
  const wishlistCount = isHydrated ? rawWishlistCount : 0;
  const currentUser = isHydrated ? user : null;
  const isUserLoggedIn = isHydrated ? isAuthenticated : false;

  // Load store name from admin settings after hydration
  useEffect(() => {
    if (isHydrated) {
      setStoreName(getStoreName());
    }
  }, [isHydrated]);

  // Close account dropdown on outside click or Escape
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setUserDropdownOpen(false);
    }

    if (userDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [userDropdownOpen]);

  const handleLogout = () => {
    logout();
    setUserDropdownOpen(false);
    router.push("/");
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#2874F0] shadow-md select-none">
        {/* Main Header Container */}
        <div className="max-w-[1280px] mx-auto px-3 sm:px-4 py-2.5">
          <div className="flex items-center justify-between gap-3 sm:gap-6">
            {/* Left: Mobile Hamburger + Brand Logo */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Mobile Hamburger Toggle */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden text-white p-1 rounded-sm hover:bg-white/10 active:scale-95 transition-all"
                aria-label="Open mobile menu drawer"
              >
                <Menu size={24} />
              </button>

              {/* Brand Logo */}
              <Link href="/" className="flex flex-col leading-none group">
                <div className="flex items-center gap-1">
                  <span className="text-white font-extrabold text-xl sm:text-2xl tracking-tight italic">
                    {storeName}
                  </span>
                  <span className="text-[#ffe500] text-sm">✦</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-white/90 font-medium italic mt-0.5">
                  <span>Explore</span>
                  <span className="text-[#ffe500] font-bold">Plus</span>
                  <Sparkles size={9} className="text-[#ffe500]" />
                </div>
              </Link>
            </div>

            {/* Center: Search Bar (Desktop & Tablet) */}
            <div className="hidden md:flex flex-1 max-w-2xl mx-auto">
              <SearchBar />
            </div>

            {/* Right: Actions (Login/Account, Wishlist, Cart, Become a Seller) */}
            <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
              {/* Mobile Search Icon Toggle */}
              <button
                type="button"
                onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
                className="md:hidden text-white p-1.5 rounded-sm hover:bg-white/10 active:scale-95 transition-all"
                aria-label="Toggle mobile search"
              >
                <Search size={22} />
              </button>

              {/* Delivery Location (right side on desktop/tablet) */}
              <div className="hidden sm:flex items-center">
                <DeliveryLocationSelector compact />
              </div>

              {/* Account / Login Trigger & Dropdown */}
              <div className="relative" ref={userDropdownRef}>
                {isUserLoggedIn && currentUser ? (
                  /* Authenticated User Button */
                  <button
                    type="button"
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    onMouseEnter={() => setUserDropdownOpen(true)}
                    className="flex items-center gap-1.5 text-white px-2.5 py-1.5 rounded-xs hover:bg-white/10 transition-colors text-sm font-semibold cursor-pointer"
                    aria-expanded={userDropdownOpen}
                    aria-haspopup="true"
                  >
                    <UserIcon size={18} />
                    <span className="hidden sm:inline max-w-[90px] truncate">
                      {currentUser.name.split(" ")[0]}
                    </span>
                    <ChevronDown
                      size={14}
                      className={cn(
                        "transition-transform duration-200 hidden sm:inline",
                        userDropdownOpen && "rotate-180"
                      )}
                    />
                  </button>
                ) : (
                  /* Guest: White Login Button */
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center bg-white text-[#2874F0] px-4 py-1.5 rounded-xs text-sm font-bold shadow-xs hover:bg-gray-100 hover:shadow transition-all"
                  >
                    Login
                  </Link>
                )}

                {/* Account Dropdown Menu */}
                {userDropdownOpen && isUserLoggedIn && currentUser && (
                  <div
                    onMouseLeave={() => setUserDropdownOpen(false)}
                    className="absolute right-0 top-full mt-1.5 w-60 bg-white rounded-xs shadow-2xl border border-[#E0E0E0] py-1 z-50 animate-in fade-in-50 zoom-in-95 duration-150 text-sm text-[#212121]"
                  >
                    {/* User Mini Profile Header */}
                    <div className="px-4 py-3 bg-[#F9FAFB] border-b border-[#F0F0F0]">
                      <p className="font-bold text-sm text-[#212121] truncate">
                        {currentUser.name}
                      </p>
                      <p className="text-xs text-[#878787] truncate">
                        {currentUser.email}
                      </p>
                    </div>

                    <div className="py-1">
                      <Link
                        href="/account"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 hover:bg-[#F1F3F6] hover:text-[#2874F0] transition-colors"
                      >
                        <UserIcon size={16} className="text-gray-500" />
                        <span>My Profile</span>
                      </Link>

                      <Link
                        href="/orders"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 hover:bg-[#F1F3F6] hover:text-[#2874F0] transition-colors"
                      >
                        <Package size={16} className="text-gray-500" />
                        <span>Orders</span>
                      </Link>

                      <Link
                        href="/wishlist"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center justify-between px-4 py-2 hover:bg-[#F1F3F6] hover:text-[#2874F0] transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Heart size={16} className="text-[#FB641B]" />
                          <span>Wishlist</span>
                        </div>
                        {wishlistCount > 0 && (
                          <span className="text-[11px] font-bold bg-[#FFF3ED] text-[#FB641B] px-1.5 py-0.2 rounded-full">
                            {wishlistCount}
                          </span>
                        )}
                      </Link>

                      {currentUser.role === "admin" && (
                        <Link
                          href="/admin"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 bg-blue-50 text-[#2874F0] font-semibold hover:bg-blue-100 transition-colors"
                        >
                          <Settings size={16} />
                          <span>Admin Dashboard</span>
                        </Link>
                      )}
                    </div>

                    <div className="border-t border-[#F0F0F0] mt-1 pt-1">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 font-medium text-xs transition-colors"
                      >
                        <LogOut size={15} />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Become a Seller (Desktop) - temporarily hidden
              <Link
                href="/sell"
                className="hidden xl:flex items-center gap-1.5 text-white text-sm font-semibold hover:text-[#ffe500] transition-colors"
              >
                <Store size={17} />
                <span>Become a Seller</span>
              </Link>
              */}

              {/* Wishlist Link (Desktop & Tablet) */}
              <Link
                href="/wishlist"
                className="relative hidden sm:flex items-center gap-1.5 text-white px-2 py-1.5 text-sm font-medium hover:text-[#ffe500] transition-colors"
                aria-label={`Wishlist with ${wishlistCount} items`}
              >
                <div className="relative">
                  <Heart size={20} />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 bg-[#FB641B] text-white text-[10px] font-bold rounded-full h-4 min-w-4 px-1 flex items-center justify-center border border-[#2874F0] shadow-xs">
                      {wishlistCount > 9 ? "9+" : wishlistCount}
                    </span>
                  )}
                </div>
                <span className="hidden xl:inline">Wishlist</span>
              </Link>

              {/* Cart Icon & Dynamic Count */}
              <Link
                href="/cart"
                className="relative flex items-center gap-1.5 text-white px-2.5 py-1.5 text-sm font-semibold hover:text-[#ffe500] transition-colors"
                aria-label={`Shopping cart with ${cartCount} items`}
              >
                <div className="relative">
                  <ShoppingCart size={22} />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-[#FB641B] text-white text-[10px] font-extrabold rounded-full h-4 min-w-4 px-1 flex items-center justify-center border-2 border-[#2874F0] shadow-sm animate-in zoom-in-75">
                      {cartCount > 99 ? "99+" : cartCount}
                    </span>
                  )}
                </div>
                <span className="hidden sm:inline">Cart</span>
              </Link>
            </div>
          </div>

          {/* Mobile delivery location */}
          <div className="sm:hidden mt-2 pt-2 border-t border-white/20">
            <DeliveryLocationSelector compact />
          </div>

          {/* Mobile Search Overlay Bar */}
          {mobileSearchOpen && (
            <div className="mt-2.5 pt-2 border-t border-white/20 md:hidden animate-in slide-in-from-top-2 duration-200">
              <SearchBar
                isMobileExpanded
                onMobileClose={() => setMobileSearchOpen(false)}
                placeholder="Search products, brands and more"
              />
            </div>
          )}
        </div>

        {/* Category Navigation Bar (Desktop + Mobile Horizontal Scroll) */}
        <Suspense fallback={<div className="h-9 bg-[#172337]" />}>
          <CategoryNavigation variant="both" />
        </Suspense>
      </header>

      {/* Slide-out Mobile Menu Drawer */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
    </>
  );
}

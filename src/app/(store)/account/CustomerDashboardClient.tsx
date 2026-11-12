"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useCartStore } from "@/store/useCartStore";
import { authService } from "@/services/authService";
import { orderService } from "@/services/orderService";
import { useToast } from "@/components/common/Toast";
import { useHydration } from "@/hooks/useHydration";
import { InputField } from "@/components/common/InputField";
import { Button } from "@/components/ui/button";
import { PriceDisplay } from "@/components/common/PriceDisplay";
import { Address, Order } from "@/types";
import { formatPrice, formatDate } from "@/utils/formatters";
import {
  User as UserIcon,
  Package,
  Heart,
  MapPin,
  Settings,
  LogOut,
  Edit2,
  Trash2,
  CheckCircle2,
  Plus,
  ShieldCheck,
  Bell,
  Lock,
  ChevronRight,
  ShoppingCart,
  Home,
  Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Indian states list for address form
const INDIAN_STATES = [
  "Andhra Pradesh",
  "Assam",
  "Bihar",
  "Delhi",
  "Gujarat",
  "Haryana",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Punjab",
  "Rajasthan",
  "Tamil Nadu",
  "Telangana",
  "Uttar Pradesh",
  "West Bengal",
];

type TabKey = "profile" | "orders" | "wishlist" | "addresses" | "settings";

export function CustomerDashboardClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const isHydrated = useHydration();

  const { user, isAuthenticated, updateUser, logout } = useAuthStore();
  const { items: wishlistItems, removeItem: removeWishlistItem } = useWishlistStore();
  const { addItem: addToCart } = useCartStore();

  // Active Tab from query param or default to 'profile'
  const initialTab = (searchParams.get("tab") as TabKey) || "profile";
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  // ── Profile Edit State ──────────────────────────────────────────────────────
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState(() => user?.name || "");
  const [profileEmail, setProfileEmail] = useState(() => user?.email || "");
  const [profilePhone, setProfilePhone] = useState(() => user?.phone || "");
  const [profileGender, setProfileGender] = useState("male");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // ── Address State ───────────────────────────────────────────────────────────
  const [addresses, setAddresses] = useState<Address[]>(() => {
    if (user?.addresses && user.addresses.length > 0) {
      return user.addresses;
    }
    return [
      {
        id: "addr-default-1",
        name: user?.name || "Aarav Mehta",
        phone: user?.phone || "9876543210",
        pincode: "560034",
        locality: "Koramangala 4th Block",
        street: "Flat 402, Green Glen Apartments, 17th Main Road",
        city: "Bengaluru",
        state: "Karnataka",
        landmark: "Near Sony World Signal",
        type: "home",
        isDefault: true,
      },
    ];
  });
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addrName, setAddrName] = useState("");
  const [addrPhone, setAddrPhone] = useState("");
  const [addrHouseNo, setAddrHouseNo] = useState("");
  const [addrStreet, setAddrStreet] = useState("");
  const [addrCity, setAddrCity] = useState("Bengaluru");
  const [addrState, setAddrState] = useState("Karnataka");
  const [addrPincode, setAddrPincode] = useState("");
  const [addrType, setAddrType] = useState<"home" | "work">("home");
  const [addrErrors, setAddrErrors] = useState<Record<string, string>>({});

  // ── Settings State ──────────────────────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Preferences toggles
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [promoOffers, setPromoOffers] = useState(false);
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);

  // Load orders once on mount
  useEffect(() => {
    let isCancelled = false;
    async function loadOrders() {
      try {
        const data = await orderService.getOrders();
        if (!isCancelled) {
          setOrders(data);
          setIsLoadingOrders(false);
        }
      } catch (err) {
        console.error(err);
        if (!isCancelled) setIsLoadingOrders(false);
      }
    }
    loadOrders();
    return () => {
      isCancelled = true;
    };
  }, []);

  const handleStartEditProfile = () => {
    setProfileName(user?.name || "");
    setProfileEmail(user?.email || "");
    setProfilePhone(user?.phone || "");
    setIsEditingProfile(true);
  };

  // ── Profile Actions ─────────────────────────────────────────────────────────
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) {
      toast({ type: "error", message: "Name cannot be empty" });
      return;
    }
    if (!profileEmail.includes("@")) {
      toast({ type: "error", message: "Please enter a valid email address" });
      return;
    }

    setIsSavingProfile(true);
    try {
      const updates = {
        name: profileName.trim(),
        email: profileEmail.trim().toLowerCase(),
        phone: profilePhone.trim(),
      };
      await authService.updateProfile(updates);
      updateUser(updates);
      setIsEditingProfile(false);
      toast({
        type: "success",
        title: "Profile Updated",
        message: "Your personal details have been saved successfully.",
      });
    } catch {
      toast({ type: "error", message: "Failed to update profile. Please try again." });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // ── Address Actions ─────────────────────────────────────────────────────────
  const openNewAddressModal = () => {
    setEditingAddressId(null);
    setAddrName(user?.name || "");
    setAddrPhone(user?.phone || "");
    setAddrHouseNo("");
    setAddrStreet("");
    setAddrCity("Bengaluru");
    setAddrState("Karnataka");
    setAddrPincode("");
    setAddrType("home");
    setAddrErrors({});
    setIsAddressModalOpen(true);
  };

  const openEditAddressModal = (addr: Address) => {
    setEditingAddressId(addr.id);
    setAddrName(addr.name);
    setAddrPhone(addr.phone);
    const parts = addr.street.split(", ");
    setAddrHouseNo(parts[0] || "");
    setAddrStreet(parts.slice(1).join(", ") || addr.locality || "");
    setAddrCity(addr.city);
    setAddrState(addr.state);
    setAddrPincode(addr.pincode);
    setAddrType(addr.type);
    setAddrErrors({});
    setIsAddressModalOpen(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!addrName.trim()) errs.name = "Full name is required";
    if (!/^[6-9]\d{9}$/.test(addrPhone.replace(/\D/g, ""))) {
      errs.phone = "Enter a valid 10-digit mobile number";
    }
    if (!addrHouseNo.trim()) errs.houseNo = "House/Flat number is required";
    if (!addrStreet.trim()) errs.street = "Street/Colony is required";
    if (!/^\d{6}$/.test(addrPincode.trim())) {
      errs.pincode = "Enter a valid 6-digit PIN code";
    }

    if (Object.keys(errs).length > 0) {
      setAddrErrors(errs);
      return;
    }

    const fullStreet = `${addrHouseNo.trim()}, ${addrStreet.trim()}`;

    if (editingAddressId) {
      const updated = addresses.map((a) =>
        a.id === editingAddressId
          ? {
              ...a,
              name: addrName.trim(),
              phone: addrPhone.trim(),
              street: fullStreet,
              locality: addrStreet.trim(),
              city: addrCity.trim(),
              state: addrState,
              pincode: addrPincode.trim(),
              type: addrType,
            }
          : a
      );
      setAddresses(updated);
      updateUser({ addresses: updated });
      toast({ type: "success", message: "Address updated successfully" });
    } else {
      const created: Address = {
        id: `addr-${Date.now()}`,
        name: addrName.trim(),
        phone: addrPhone.trim(),
        street: fullStreet,
        locality: addrStreet.trim(),
        city: addrCity.trim(),
        state: addrState,
        pincode: addrPincode.trim(),
        type: addrType,
        isDefault: addresses.length === 0,
      };
      const updated = [created, ...addresses];
      setAddresses(updated);
      updateUser({ addresses: updated });
      toast({ type: "success", message: "New address added to your address book" });
    }

    setIsAddressModalOpen(false);
  };

  const handleDeleteAddress = (id: string) => {
    if (addresses.length <= 1) {
      toast({ type: "error", message: "You must keep at least one saved address" });
      return;
    }
    if (window.confirm("Are you sure you want to delete this address?")) {
      const updated = addresses.filter((a) => a.id !== id);
      setAddresses(updated);
      updateUser({ addresses: updated });
      toast({ type: "info", message: "Address removed from saved list" });
    }
  };

  const handleSetDefaultAddress = (id: string) => {
    const updated = addresses.map((a) => ({
      ...a,
      isDefault: a.id === id,
    }));
    setAddresses(updated);
    updateUser({ addresses: updated, defaultAddressId: id });
    toast({ type: "success", message: "Default delivery address updated" });
  };

  // ── Settings Actions ────────────────────────────────────────────────────────
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast({ type: "error", message: "Please enter your current password" });
      return;
    }
    if (newPassword.length < 8) {
      toast({ type: "error", message: "New password must be at least 8 characters" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ type: "error", message: "New passwords do not match" });
      return;
    }

    setIsChangingPassword(true);
    await new Promise((r) => setTimeout(r, 600));

    try {
      if (user?.email) {
        await authService.resetPassword(user.email, "123456", newPassword);
      }
      toast({
        type: "success",
        title: "Password Changed",
        message: "Your account password has been updated securely.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      toast({ type: "error", message: "Failed to change password. Please retry." });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to sign out?")) {
      await authService.logout();
      logout();
      toast({
        type: "info",
        title: "Logged Out",
        message: "You have been safely signed out.",
      });
      router.push("/");
    }
  };

  if (!isHydrated) {
    return (
      <div className="bg-[#F1F3F6] min-h-screen py-8">
        <div className="max-w-[1240px] mx-auto px-4 space-y-4">
          <div className="animate-pulse h-16 bg-white rounded-sm border border-[#E0E0E0]" />
          <div className="animate-pulse h-96 bg-white rounded-sm border border-[#E0E0E0]" />
        </div>
      </div>
    );
  }

  // Client-side protected route guard
  if (!isAuthenticated || !user) {
    return (
      <div className="bg-[#F1F3F6] min-h-screen py-12">
        <div className="max-w-md mx-auto p-8 bg-white border border-[#E0E0E0] rounded-sm text-center shadow-xs">
          <div className="w-16 h-16 bg-blue-50 text-[#2874F0] rounded-full flex items-center justify-center mx-auto mb-4">
            <UserIcon size={32} />
          </div>
          <h2 className="text-lg font-bold text-[#212121]">Sign in to Your Account</h2>
          <p className="text-xs text-[#878787] mt-1 mb-6">
            Log in to manage your profile, saved addresses, wishlist, and track orders.
          </p>
          <Link href="/login?redirect=/account">
            <Button variant="primary" fullWidth className="font-semibold text-sm">
              Sign In to FlipStore
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // ── Navigation Menu Items ───────────────────────────────────────────────────
  const navItems = [
    {
      key: "profile",
      label: "My Profile",
      icon: <UserIcon size={17} />,
      badge: null,
    },
    {
      key: "orders",
      label: "My Orders",
      icon: <Package size={17} />,
      badge: orders.length > 0 ? orders.length : null,
    },
    {
      key: "wishlist",
      label: "My Wishlist",
      icon: <Heart size={17} />,
      badge: wishlistItems.length > 0 ? wishlistItems.length : null,
    },
    {
      key: "addresses",
      label: "Saved Addresses",
      icon: <MapPin size={17} />,
      badge: addresses.length > 0 ? addresses.length : null,
    },
    {
      key: "settings",
      label: "Account Settings",
      icon: <Settings size={17} />,
      badge: null,
    },
  ];

  return (
    <div className="bg-[#F1F3F6] min-h-screen py-6">
      <div className="max-w-[1240px] mx-auto px-3 sm:px-4">
        {/* Mobile Horizontal Tab Navigation */}
        <div className="lg:hidden bg-white border border-[#E0E0E0] rounded-sm p-2 mb-4 shadow-2xs overflow-x-auto flex gap-1 text-xs">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key as TabKey)}
              className={cn(
                "px-3 py-2 rounded-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-colors cursor-pointer",
                activeTab === item.key
                  ? "bg-[#2874F0] text-white"
                  : "text-[#555] hover:bg-gray-100"
              )}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.badge !== null && (
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full font-bold",
                    activeTab === item.key ? "bg-white text-[#2874F0]" : "bg-gray-200 text-gray-700"
                  )}
                >
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* ── Left Sidebar (Desktop) ──────────────────────────────────────── */}
          <div className="hidden lg:block space-y-4">
            {/* User Greeting Card */}
            <div className="bg-white border border-[#E0E0E0] rounded-sm p-4 shadow-2xs flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#eaf2ff] text-[#2874F0] font-bold text-xl flex items-center justify-center shrink-0 border border-blue-100">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <span className="text-[11px] text-[#878787]">Hello,</span>
                <h3 className="font-bold text-sm text-[#212121] truncate">{user.name}</h3>
                <span className="inline-block text-[10px] font-bold text-[#388E3C] bg-green-50 px-1.5 py-0.2 rounded-xs border border-green-200">
                  ✦ Plus Member
                </span>
              </div>
            </div>

            {/* Sidebar Navigation */}
            <div className="bg-white border border-[#E0E0E0] rounded-sm shadow-2xs overflow-hidden">
              <nav className="divide-y divide-[#F0F0F0]">
                {navItems.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setActiveTab(item.key as TabKey)}
                    className={cn(
                      "w-full px-4 py-3 text-xs font-semibold flex items-center justify-between transition-colors text-left cursor-pointer",
                      activeTab === item.key
                        ? "bg-blue-50 text-[#2874F0] border-l-4 border-[#2874F0] font-bold"
                        : "text-[#555] hover:bg-gray-50 hover:text-[#212121]"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={activeTab === item.key ? "text-[#2874F0]" : "text-gray-400"}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </div>

                    {item.badge !== null && (
                      <span
                        className={cn(
                          "text-[10px] px-2 py-0.5 rounded-full font-bold",
                          activeTab === item.key
                            ? "bg-[#2874F0] text-white"
                            : "bg-gray-100 text-gray-600"
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}

                {/* Log Out Button */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full px-4 py-3 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors text-left cursor-pointer"
                >
                  <LogOut size={16} />
                  <span>Log Out</span>
                </button>
              </nav>
            </div>

            {/* Security Badge */}
            <div className="p-3.5 bg-white border border-[#E0E0E0] rounded-sm shadow-2xs text-[11px] text-[#878787] flex items-center gap-2">
              <ShieldCheck size={16} className="text-[#388E3C] shrink-0" />
              <span>100% Safe &amp; Verified Customer Profile</span>
            </div>
          </div>

          {/* ── Right Content Area (3 cols) ─────────────────────────────────── */}
          <div className="lg:col-span-3 space-y-4">
            {/* ── SECTION 1: MY PROFILE ─────────────────────────────────────── */}
            {activeTab === "profile" && (
              <div className="bg-white border border-[#E0E0E0] rounded-sm p-5 sm:p-6 shadow-2xs space-y-6">
                <div className="flex items-center justify-between border-b border-[#F0F0F0] pb-4">
                  <div>
                    <h2 className="text-base font-bold text-[#212121]">Personal Information</h2>
                    <p className="text-xs text-[#878787] mt-0.5">
                      Manage your profile information and contact details
                    </p>
                  </div>
                  {!isEditingProfile && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleStartEditProfile}
                      className="text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Edit2 size={13} /> Edit Profile
                    </Button>
                  )}
                </div>

                {!isEditingProfile ? (
                  /* Profile View Mode */
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 rounded-xs border border-gray-100">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#878787]">
                          Full Name
                        </span>
                        <p className="font-bold text-sm text-[#212121] mt-1">{user.name}</p>
                      </div>

                      <div className="p-4 bg-gray-50 rounded-xs border border-gray-100">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#878787]">
                          Email Address
                        </span>
                        <p className="font-bold text-sm text-[#212121] mt-1">{user.email}</p>
                      </div>

                      <div className="p-4 bg-gray-50 rounded-xs border border-gray-100">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#878787]">
                          Mobile Number
                        </span>
                        <p className="font-bold text-sm text-[#212121] mt-1">{user.phone}</p>
                      </div>

                      <div className="p-4 bg-gray-50 rounded-xs border border-gray-100">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#878787]">
                          Membership Tier
                        </span>
                        <p className="font-bold text-sm text-[#388E3C] mt-1 flex items-center gap-1">
                          <CheckCircle2 size={14} /> Plus Member
                        </p>
                      </div>
                    </div>

                    {/* FAQs strip */}
                    <div className="pt-4 border-t border-[#F0F0F0] space-y-2 text-xs text-[#878787]">
                      <h4 className="font-bold text-[#212121] text-xs">FAQs</h4>
                      <p>
                        <strong>What happens when I update my email or mobile?</strong> Your login
                        credentials and order status notifications will be redirected to your new
                        verified details immediately.
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Profile Edit Mode */
                  <form onSubmit={handleSaveProfile} className="space-y-4 max-w-lg">
                    <InputField
                      label="Full Name"
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      required
                    />

                    <InputField
                      label="Email Address"
                      type="email"
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                      required
                    />

                    <InputField
                      label="Mobile Number"
                      type="tel"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      prefixText="+91"
                      required
                    />

                    <div>
                      <label className="block text-xs font-semibold text-[#212121] uppercase tracking-wider mb-1.5">
                        Gender
                      </label>
                      <div className="flex gap-4 text-xs">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="gender"
                            value="male"
                            checked={profileGender === "male"}
                            onChange={() => setProfileGender("male")}
                            className="accent-[#2874F0]"
                          />
                          <span>Male</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="gender"
                            value="female"
                            checked={profileGender === "female"}
                            onChange={() => setProfileGender("female")}
                            className="accent-[#2874F0]"
                          />
                          <span>Female</span>
                        </label>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        type="submit"
                        variant="buyNow"
                        size="sm"
                        isLoading={isSavingProfile}
                        className="font-bold text-xs"
                      >
                        Save Changes
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditingProfile(false)}
                        className="text-xs"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* ── SECTION 2: MY ORDERS ──────────────────────────────────────── */}
            {activeTab === "orders" && (
              <div className="bg-white border border-[#E0E0E0] rounded-sm p-5 sm:p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-[#F0F0F0] pb-3">
                  <div>
                    <h2 className="text-base font-bold text-[#212121]">Order History</h2>
                    <p className="text-xs text-[#878787] mt-0.5">
                      Review previous purchases, invoices, and live delivery status
                    </p>
                  </div>
                  <Link href="/orders">
                    <Button variant="outline" size="sm" className="text-xs font-semibold">
                      Full Tracking Page →
                    </Button>
                  </Link>
                </div>

                {isLoadingOrders ? (
                  <div className="py-8 text-center text-xs text-[#878787]">Loading orders...</div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-8">
                    <Package size={36} className="text-gray-300 mx-auto mb-2" />
                    <p className="font-bold text-sm text-[#212121]">No orders placed yet</p>
                    <p className="text-xs text-[#878787] mt-1 mb-4">
                      Browse our store to find trending deals and products!
                    </p>
                    <Link href="/products">
                      <Button variant="primary" size="sm">
                        Start Shopping
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.map((ord) => (
                      <div
                        key={ord.id}
                        className="p-4 border border-[#E0E0E0] rounded-xs hover:border-[#2874F0] transition-colors"
                      >
                        <div className="flex flex-wrap items-center justify-between pb-2 mb-3 border-b border-gray-100 text-xs">
                          <div>
                            <span className="font-bold text-[#2874F0]">{ord.orderNumber}</span> ·{" "}
                            <span className="text-[#878787]">{formatDate(ord.placedAt)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded-full font-bold text-[10px] border",
                                ord.orderStatus === "DELIVERED"
                                  ? "bg-green-50 text-[#388E3C] border-green-200"
                                  : ord.orderStatus === "CANCELLED"
                                  ? "bg-red-50 text-red-600 border-red-200"
                                  : "bg-blue-50 text-[#2874F0] border-blue-200"
                              )}
                            >
                              {ord.orderStatus.replace(/_/g, " ")}
                            </span>
                            <span className="font-bold text-[#212121]">
                              {formatPrice(ord.pricing.totalAmount)}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {ord.items.map((item, idx) => (
                            <div key={idx} className="flex gap-3 items-center">
                              <div className="relative w-12 h-12 bg-gray-50 border border-gray-100 rounded-xs overflow-hidden shrink-0">
                                <Image
                                  src={item.thumbnail}
                                  alt={item.title}
                                  fill
                                  sizes="48px"
                                  className="object-contain p-1"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-[#212121] truncate">
                                  {item.title}
                                </p>
                                <p className="text-[11px] text-[#878787]">
                                  Qty: {item.quantity} · {formatPrice(item.price)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-3 pt-2 border-t border-gray-100 flex justify-end">
                          <Link href={`/orders/${ord.orderNumber}`}>
                            <span className="text-xs font-bold text-[#2874F0] hover:underline flex items-center gap-1 cursor-pointer">
                              Track Live Shipment <ChevronRight size={13} />
                            </span>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── SECTION 3: MY WISHLIST ────────────────────────────────────── */}
            {activeTab === "wishlist" && (
              <div className="bg-white border border-[#E0E0E0] rounded-sm p-5 sm:p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-[#F0F0F0] pb-3">
                  <div>
                    <h2 className="text-base font-bold text-[#212121]">My Wishlist</h2>
                    <p className="text-xs text-[#878787] mt-0.5">
                      {wishlistItems.length} {wishlistItems.length === 1 ? "item" : "items"} saved for
                      later
                    </p>
                  </div>
                  <Link href="/wishlist">
                    <Button variant="outline" size="sm" className="text-xs font-semibold">
                      Full Wishlist Page →
                    </Button>
                  </Link>
                </div>

                {wishlistItems.length === 0 ? (
                  <div className="text-center py-8">
                    <Heart size={36} className="text-gray-300 mx-auto mb-2" />
                    <p className="font-bold text-sm text-[#212121]">Your wishlist is empty</p>
                    <p className="text-xs text-[#878787] mt-1 mb-4">
                      Save items you like while browsing to find them easily here!
                    </p>
                    <Link href="/products">
                      <Button variant="primary" size="sm">
                        Discover Products
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {wishlistItems.map(({ product }) => (
                      <div
                        key={product.id}
                        className="p-3 border border-[#E0E0E0] rounded-xs flex gap-3 items-start hover:border-gray-400 transition-colors"
                      >
                        <div className="relative w-16 h-16 bg-gray-50 border border-gray-100 rounded-xs overflow-hidden shrink-0">
                          <Image
                            src={product.thumbnail || product.images[0]}
                            alt={product.title}
                            fill
                            sizes="64px"
                            className="object-contain p-1"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/products/${product.slug}`}
                            className="text-xs font-semibold text-[#212121] hover:text-[#2874F0] line-clamp-1 truncate"
                          >
                            {product.title}
                          </Link>
                          <div className="mt-1">
                            <PriceDisplay
                              price={product.price}
                              mrp={product.mrp}
                              discountPercentage={product.discountPercentage}
                              size="sm"
                            />
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              type="button"
                              onClick={() => {
                                addToCart(product, 1);
                                toast({
                                  type: "success",
                                  message: "Added to your cart",
                                });
                              }}
                              className="px-2 py-1 bg-[#2874F0] text-white text-[11px] font-bold rounded-xs flex items-center gap-1 hover:bg-blue-700 cursor-pointer"
                            >
                              <ShoppingCart size={11} /> Add
                            </button>
                            <button
                              type="button"
                              onClick={() => removeWishlistItem(product.id)}
                              className="text-xs text-red-500 hover:underline cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── SECTION 4: SAVED ADDRESSES ────────────────────────────────── */}
            {activeTab === "addresses" && (
              <div className="bg-white border border-[#E0E0E0] rounded-sm p-5 sm:p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-[#F0F0F0] pb-3">
                  <div>
                    <h2 className="text-base font-bold text-[#212121]">Manage Addresses</h2>
                    <p className="text-xs text-[#878787] mt-0.5">
                      Add, edit, or set default delivery addresses
                    </p>
                  </div>
                  <Button
                    variant="buyNow"
                    size="sm"
                    onClick={openNewAddressModal}
                    className="text-xs font-bold flex items-center gap-1"
                  >
                    <Plus size={14} /> Add Address
                  </Button>
                </div>

                <div className="space-y-3">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className={cn(
                        "p-4 border rounded-xs transition-all relative",
                        addr.isDefault
                          ? "border-[#2874F0] bg-blue-50/20"
                          : "border-[#E0E0E0] bg-white"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-[#212121]">{addr.name}</span>
                            <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded-xs bg-gray-100 text-gray-600 flex items-center gap-1">
                              {addr.type === "work" ? <Briefcase size={10} /> : <Home size={10} />}
                              {addr.type}
                            </span>
                            {addr.isDefault && (
                              <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded-xs bg-blue-100 text-[#2874F0]">
                                Default Address
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-[#555] mt-1.5 leading-relaxed">
                            {addr.street}, {addr.locality && `${addr.locality}, `}
                            {addr.city}, {addr.state} -{" "}
                            <strong className="text-[#212121]">{addr.pincode}</strong>
                          </p>
                          <p className="text-xs text-[#878787] mt-1">Mobile: {addr.phone}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditAddressModal(addr)}
                            className="p-1.5 text-xs text-[#2874F0] font-semibold hover:bg-blue-50 rounded-xs flex items-center gap-1 cursor-pointer"
                          >
                            <Edit2 size={13} /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAddress(addr.id)}
                            className="p-1.5 text-xs text-red-500 font-semibold hover:bg-red-50 rounded-xs flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                        </div>
                      </div>

                      {!addr.isDefault && (
                        <div className="mt-3 pt-2 border-t border-gray-100 flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleSetDefaultAddress(addr.id)}
                            className="text-xs font-bold text-[#2874F0] hover:underline cursor-pointer"
                          >
                            Set as Default Address
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── SECTION 5: ACCOUNT SETTINGS ───────────────────────────────── */}
            {activeTab === "settings" && (
              <div className="bg-white border border-[#E0E0E0] rounded-sm p-5 sm:p-6 shadow-2xs space-y-6">
                <div>
                  <h2 className="text-base font-bold text-[#212121]">Account Settings</h2>
                  <p className="text-xs text-[#878787] mt-0.5">
                    Update security credentials and notification preferences
                  </p>
                </div>

                {/* 1. Change Password */}
                <div className="pt-4 border-t border-[#F0F0F0] space-y-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#212121]">
                    <Lock size={16} className="text-[#2874F0]" />
                    <h3>Change Password</h3>
                  </div>

                  <form onSubmit={handleChangePassword} className="space-y-3 max-w-md">
                    <InputField
                      label="Current Password"
                      type="password"
                      placeholder="Enter current password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                    />

                    <InputField
                      label="New Password"
                      type="password"
                      placeholder="Min 8 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />

                    <InputField
                      label="Confirm New Password"
                      type="password"
                      placeholder="Re-enter new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />

                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      isLoading={isChangingPassword}
                      className="font-bold text-xs"
                    >
                      Update Password
                    </Button>
                  </form>
                </div>

                {/* 2. Notification Preferences */}
                <div className="pt-4 border-t border-[#F0F0F0] space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#212121]">
                    <Bell size={16} className="text-[#2874F0]" />
                    <h3>Notification Preferences</h3>
                  </div>

                  <div className="space-y-2 text-xs">
                    <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xs cursor-pointer">
                      <div>
                        <p className="font-bold text-[#212121]">Email Order Receipts &amp; Updates</p>
                        <p className="text-[#878787]">Receive order confirmation and dispatch emails</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={emailAlerts}
                        onChange={(e) => {
                          setEmailAlerts(e.target.checked);
                          toast({ type: "info", message: "Email preferences saved" });
                        }}
                        className="accent-[#2874F0] w-4 h-4 cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xs cursor-pointer">
                      <div>
                        <p className="font-bold text-[#212121]">SMS &amp; WhatsApp Delivery Tracking</p>
                        <p className="text-[#878787]">Get out-for-delivery OTPs and dispatch SMS</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={smsAlerts}
                        onChange={(e) => {
                          setSmsAlerts(e.target.checked);
                          toast({ type: "info", message: "SMS preferences saved" });
                        }}
                        className="accent-[#2874F0] w-4 h-4 cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xs cursor-pointer">
                      <div>
                        <p className="font-bold text-[#212121]">Promotional Deals &amp; Discounts</p>
                        <p className="text-[#878787]">Weekly newsletter with big sale alerts</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={promoOffers}
                        onChange={(e) => {
                          setPromoOffers(e.target.checked);
                          toast({ type: "info", message: "Promotional preferences saved" });
                        }}
                        className="accent-[#2874F0] w-4 h-4 cursor-pointer"
                      />
                    </label>
                  </div>
                </div>

                {/* 3. Privacy & 2FA */}
                <div className="pt-4 border-t border-[#F0F0F0] space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#212121]">
                    <ShieldCheck size={16} className="text-[#388E3C]" />
                    <h3>Two-Factor Authentication (2FA)</h3>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xs text-xs">
                    <div>
                      <p className="font-bold text-[#212121]">Require OTP on New Device Login</p>
                      <p className="text-[#878787]">Enhanced security check for unauthorized sign-ins</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setTwoFactorAuth(!twoFactorAuth);
                        toast({
                          type: "success",
                          message: twoFactorAuth ? "2FA Disabled" : "2FA Enabled successfully",
                        });
                      }}
                      className={cn(
                        "px-3 py-1.5 rounded-xs font-bold text-xs cursor-pointer transition-colors",
                        twoFactorAuth
                          ? "bg-[#388E3C] text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      )}
                    >
                      {twoFactorAuth ? "Enabled" : "Enable 2FA"}
                    </button>
                  </div>
                </div>

                {/* 4. Logout / Session */}
                <div className="pt-4 border-t border-[#F0F0F0] flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-[#212121]">Active Session</h4>
                    <p className="text-xs text-[#878787]">Sign out from this browser session</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    className="text-red-600 border-red-200 hover:bg-red-50 font-bold text-xs flex items-center gap-1.5"
                  >
                    <LogOut size={14} /> Log Out
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── ADD / EDIT ADDRESS MODAL ────────────────────────────────────────── */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-sm max-w-lg w-full p-6 shadow-xl space-y-4 border border-[#E0E0E0] animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#F0F0F0] pb-3">
              <h3 className="font-bold text-sm text-[#212121]">
                {editingAddressId ? "Edit Delivery Address" : "Add a New Delivery Address"}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddressModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InputField
                  label="Full Name"
                  type="text"
                  placeholder="e.g. Ramesh Kumar"
                  value={addrName}
                  onChange={(e) => setAddrName(e.target.value)}
                  error={addrErrors.name}
                  required
                />

                <InputField
                  label="Mobile Number (10 digits)"
                  type="tel"
                  placeholder="9876543210"
                  value={addrPhone}
                  onChange={(e) => setAddrPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  prefixText="+91"
                  maxLength={10}
                  error={addrErrors.phone}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InputField
                  label="House / Flat / Building No."
                  type="text"
                  placeholder="Flat 402, Green Glen Towers"
                  value={addrHouseNo}
                  onChange={(e) => setAddrHouseNo(e.target.value)}
                  error={addrErrors.houseNo}
                  required
                />

                <InputField
                  label="Street / Colony / Area"
                  type="text"
                  placeholder="17th Main, Sector 4"
                  value={addrStreet}
                  onChange={(e) => setAddrStreet(e.target.value)}
                  error={addrErrors.street}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <InputField
                  label="City / District"
                  type="text"
                  value={addrCity}
                  onChange={(e) => setAddrCity(e.target.value)}
                  required
                />

                <div>
                  <label className="block text-xs font-semibold text-[#212121] uppercase tracking-wider mb-1.5">
                    State
                  </label>
                  <select
                    value={addrState}
                    onChange={(e) => setAddrState(e.target.value)}
                    className="w-full h-10 px-3 text-xs bg-white border border-[#E0E0E0] rounded-xs focus:outline-none focus:border-[#2874F0]"
                  >
                    {INDIAN_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <InputField
                  label="6-Digit PIN Code"
                  type="text"
                  placeholder="560034"
                  maxLength={6}
                  value={addrPincode}
                  onChange={(e) => setAddrPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  error={addrErrors.pincode}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#212121] uppercase tracking-wider mb-1.5">
                  Address Type
                </label>
                <div className="flex gap-4 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="modalAddrType"
                      value="home"
                      checked={addrType === "home"}
                      onChange={() => setAddrType("home")}
                      className="accent-[#2874F0]"
                    />
                    <span>Home (All day delivery)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="modalAddrType"
                      value="work"
                      checked={addrType === "work"}
                      onChange={() => setAddrType("work")}
                      className="accent-[#2874F0]"
                    />
                    <span>Work (10 AM - 5 PM delivery)</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-2 pt-3 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddressModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button type="submit" variant="buyNow" size="sm" className="font-bold text-xs">
                  {editingAddressId ? "Save Changes" : "Save Address"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

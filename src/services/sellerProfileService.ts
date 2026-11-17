import type { Seller } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
const SELLER_SESSION_KEY = "my_ecommerce_seller_session_v1";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json?.success === false) {
    throw new Error(json?.message || json?.error?.message || `Request failed (${res.status})`);
  }
  return (json?.data ?? json) as T;
}

function getSessionSeller(): Seller | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SELLER_SESSION_KEY);
    return raw ? (JSON.parse(raw) as Seller) : null;
  } catch {
    return null;
  }
}

function saveSessionSeller(seller: Seller) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SELLER_SESSION_KEY, JSON.stringify(seller));
  } catch {}
}

function mergeSeller(base: Seller | null, patch: any): Seller {
  const now = new Date().toISOString();
  const merged: any = {
    ...(base || {}),
    ...patch,
    id: String(patch?.userId || patch?.id || base?.id || ""),
    sellerId: String(patch?.sellerId || base?.sellerId || ""),
    name: String(patch?.name ?? base?.name ?? ""),
    email: String(patch?.email ?? base?.email ?? ""),
    phone: String(patch?.phone ?? base?.phone ?? ""),
    role: "SELLER",
    avatar: patch?.avatar ?? base?.avatar ?? "",
    storeName: String(patch?.storeName ?? base?.storeName ?? ""),
    storeSlug: String(patch?.storeSlug ?? base?.storeSlug ?? ""),
    storeDescription: String(patch?.storeDescription ?? patch?.storeProfile?.description ?? base?.storeDescription ?? ""),
    storeLogo: patch?.storeLogo ?? patch?.storeProfile?.logoUrl ?? base?.storeLogo ?? "",
    storeBanner: patch?.storeBanner ?? patch?.storeProfile?.bannerUrl ?? base?.storeBanner ?? "",
    businessCategory: patch?.businessCategory ?? patch?.businessDetails?.category ?? base?.businessCategory ?? "",
    businessType: patch?.businessType ?? patch?.businessDetails?.businessType ?? base?.businessType ?? "",
    businessEmail: patch?.businessEmail ?? patch?.supportEmail ?? base?.businessEmail ?? "",
    businessPhone: patch?.businessPhone ?? patch?.supportPhone ?? base?.businessPhone ?? "",
    gstNumber: patch?.gstNumber ?? base?.gstNumber ?? "",
    panNumber: patch?.panNumber ?? base?.panNumber ?? "",
    businessAddress: patch?.address ?? patch?.businessDetails?.address ?? (base as any)?.businessAddress,
    verificationStatus: patch?.verificationStatus ?? patch?.applicationStatus ?? base?.verificationStatus ?? "Pending",
    applicationStatus: patch?.applicationStatus ?? patch?.verificationStatus ?? base?.applicationStatus ?? "Pending",
    storeStatus: patch?.storeStatus ?? base?.storeStatus ?? "ACTIVE",
    joinedAt: patch?.joinedAt ?? base?.joinedAt ?? now,
    createdAt: patch?.createdAt ?? base?.createdAt ?? now,
    updatedAt: patch?.updatedAt ?? now,
  };
  return merged as Seller;
}

async function uploadImage(file: File, folder = "avatars"): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  form.append("folder", folder);
  const res = await fetch(`${API_BASE}/api/v1/uploads`, {
    method: "POST",
    credentials: "include",
    body: form,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json?.success === false) {
    throw new Error(json?.message || json?.error?.message || "Failed to upload image.");
  }
  const url = String(json?.data?.url || "");
  if (!url) throw new Error("Upload did not return an image URL.");
  return url;
}

export const sellerProfileService = {
  async getSellerProfile(): Promise<Seller | null> {
    try {
      const store = await api<any>("/api/v1/vendors/store");
      let profile: any = null;
      try {
        profile = await api<any>("/api/v1/users/profile");
      } catch {}
      const merged = mergeSeller(getSessionSeller(), {
        ...store,
        ...(profile || {}),
        userId: profile?.id || store?.userId,
        avatar: profile?.avatar ?? store?.avatar ?? store?.storeLogo,
      });
      saveSessionSeller(merged);
      return merged;
    } catch {
      return getSessionSeller();
    }
  },

  async updateProfile(updates: Partial<Seller> & Record<string, any>): Promise<Seller> {
    const profilePayload: Record<string, any> = {};
    if (updates.name !== undefined) profilePayload.name = updates.name;
    if (updates.email !== undefined) profilePayload.email = updates.email;
    if (updates.phone !== undefined) profilePayload.phone = updates.phone;
    if (updates.avatar !== undefined) profilePayload.avatar = updates.avatar;

    let profileData: any = null;
    if (Object.keys(profilePayload).length > 0) {
      profileData = await api<any>("/api/v1/users/profile", {
        method: "PATCH",
        body: JSON.stringify(profilePayload),
      });
    }

    const storePayload: Record<string, any> = {};
    if (updates.storeName !== undefined) storePayload.storeName = updates.storeName;
    if (updates.storeDescription !== undefined) storePayload.storeDescription = updates.storeDescription;
    if (updates.businessEmail !== undefined) storePayload.supportEmail = updates.businessEmail;
    if (updates.businessPhone !== undefined) storePayload.supportPhone = updates.businessPhone;

    let storeData: any = null;
    if (Object.keys(storePayload).length > 0) {
      storeData = await api<any>("/api/v1/vendors/store", {
        method: "PATCH",
        body: JSON.stringify(storePayload),
      });
    }

    const refreshed = await this.getSellerProfile().catch(() => null);
    const merged = mergeSeller(getSessionSeller(), {
      ...(storeData || {}),
      ...(profileData || {}),
      ...(refreshed || {}),
      ...updates,
    });
    saveSessionSeller(merged);
    return merged;
  },

  async uploadProfileImage(file: File): Promise<string> {
    return uploadImage(file, "avatars");
  },

  async updateAvatar(avatarUrl: string): Promise<Seller> {
    const profileData = await api<any>("/api/v1/users/profile", {
      method: "PATCH",
      body: JSON.stringify({ avatar: avatarUrl }),
    });
    const refreshed = await this.getSellerProfile().catch(() => null);
    const merged = mergeSeller(getSessionSeller(), { ...(refreshed || {}), ...profileData, avatar: avatarUrl });
    saveSessionSeller(merged);
    return merged;
  },
};

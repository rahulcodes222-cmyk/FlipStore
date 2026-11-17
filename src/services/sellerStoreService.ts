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

function mergeSeller(base: Seller | null, patch: any): Seller {
  const now = new Date().toISOString();
  const next: any = {
    ...(base || {}),
    ...patch,
    storeName: patch?.storeName ?? base?.storeName ?? "",
    storeSlug: patch?.storeSlug ?? base?.storeSlug ?? "",
    storeDescription: patch?.storeDescription ?? patch?.storeProfile?.description ?? base?.storeDescription ?? "",
    storeLogo: patch?.storeLogo ?? patch?.storeProfile?.logoUrl ?? base?.storeLogo ?? "",
    storeBanner: patch?.storeBanner ?? patch?.storeProfile?.bannerUrl ?? base?.storeBanner ?? "",
    businessCategory: patch?.businessCategory ?? patch?.businessDetails?.category ?? base?.businessCategory ?? "",
    businessEmail: patch?.businessEmail ?? patch?.supportEmail ?? base?.businessEmail ?? "",
    businessPhone: patch?.businessPhone ?? patch?.supportPhone ?? base?.businessPhone ?? "",
    verificationStatus: patch?.verificationStatus ?? patch?.applicationStatus ?? base?.verificationStatus ?? "Pending",
    applicationStatus: patch?.applicationStatus ?? patch?.verificationStatus ?? base?.applicationStatus ?? "Pending",
    storeStatus: patch?.storeStatus ?? base?.storeStatus ?? "ACTIVE",
    updatedAt: patch?.updatedAt ?? now,
  };
  if (!next.id && next.userId) next.id = String(next.userId);
  if (!next.name && patch?.name) next.name = patch.name;
  return next as Seller;
}

function saveSessionSeller(seller: Seller) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SELLER_SESSION_KEY, JSON.stringify(seller));
  } catch {}
}

export const sellerStoreService = {
  async getStoreProfile(): Promise<Seller | null> {
    try {
      const data = await api<any>("/api/v1/vendors/store");
      const merged = mergeSeller(getSessionSeller(), data);
      saveSessionSeller(merged);
      return merged;
    } catch {
      return getSessionSeller();
    }
  },

  async updateStore(updates: Partial<Seller> & Record<string, any>): Promise<Seller> {
    const payload: Record<string, any> = {};
    if (updates.storeName !== undefined) payload.storeName = updates.storeName;
    if (updates.storeSlug !== undefined) payload.storeSlug = updates.storeSlug;
    if (updates.storeDescription !== undefined) payload.storeDescription = updates.storeDescription;
    if ((updates as any).description !== undefined) payload.description = (updates as any).description;
    if (updates.storeLogo !== undefined) payload.storeLogo = updates.storeLogo;
    if (updates.storeBanner !== undefined) payload.storeBanner = updates.storeBanner;
    if (updates.businessCategory !== undefined) payload.businessCategory = updates.businessCategory;
    if (updates.businessEmail !== undefined) payload.supportEmail = updates.businessEmail;
    if (updates.businessPhone !== undefined) payload.supportPhone = updates.businessPhone;
    if ((updates as any).logoUrl !== undefined) payload.logoUrl = (updates as any).logoUrl;
    if ((updates as any).bannerUrl !== undefined) payload.bannerUrl = (updates as any).bannerUrl;
    if ((updates as any).supportEmail !== undefined) payload.supportEmail = (updates as any).supportEmail;
    if ((updates as any).supportPhone !== undefined) payload.supportPhone = (updates as any).supportPhone;

    const data = await api<any>("/api/v1/vendors/store", {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    const merged = mergeSeller(getSessionSeller(), { ...data, ...updates, storeLogo: payload.storeLogo ?? updates.storeLogo ?? data?.storeLogo, storeBanner: payload.storeBanner ?? updates.storeBanner ?? data?.storeBanner });
    saveSessionSeller(merged);
    return merged;
  },

  async toggleStoreStatus(): Promise<Seller> {
    const current = getSessionSeller();
    if (!current) throw new Error("No seller session found");
    const next = { ...current, storeStatus: current.storeStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE", updatedAt: new Date().toISOString() } as Seller;
    saveSessionSeller(next);
    return next;
  },

  async uploadStoreImage(file: File): Promise<{ url: string }> {
    const form = new FormData();
    form.append("file", file);
    form.append("folder", "store");
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
    return { url };
  },
};
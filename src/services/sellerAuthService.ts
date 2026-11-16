/**
 * sellerAuthService — Frontend seller authentication connected to backend APIs (Part 11).
 *
 * Calls:
 *   POST /api/v1/vendors/register (or /api/v1/auth/vendor/register)
 *   POST /api/v1/auth/login
 *   POST /api/v1/auth/logout
 *   GET  /api/v1/vendors/application
 *   GET  /api/v1/vendors/store
 */

import { Seller, SellerAuthResult, SellerRegisterPayload } from "@/types";
import { useSellerStore } from "@/store/useSellerStore";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
const SELLER_SESSION_KEY = "my_ecommerce_seller_session_v1";

interface ApiEnvelope<T> {
  success?: boolean;
  message?: string;
  data?: T;
  error?: { message?: string; code?: string };
}

interface LoginApiData {
  user?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    avatar?: string;
    vendorApplicationStatus?: string;
    isVendorApproved?: boolean;
  };
  seller?: Seller;
  tokens?: {
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresAt?: string;
    refreshTokenExpiresAt?: string;
  };
}

function toSellerFromLogin(data: LoginApiData): Seller {
  if (data.seller) return data.seller;
  const u = data.user;
  return {
    id: u?.id || "",
    sellerId: "",
    name: u?.name || "",
    email: u?.email || "",
    phone: u?.phone || "",
    role: "SELLER",
    storeName: u?.name || "My Store",
    storeSlug: "",
    verificationStatus: (u?.vendorApplicationStatus as any) || (u?.isVendorApproved ? "Approved" : "Pending"),
    applicationStatus: (u?.vendorApplicationStatus as any) || (u?.isVendorApproved ? "Approved" : "Pending"),
    storeStatus: "ACTIVE",
    rating: 0,
    totalSales: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalCustomers: 0,
    availableBalance: 0,
    totalEarnings: 0,
    pendingOrders: 0,
    cancelledOrders: 0,
    joinedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as Seller;
}

/** Persist seller session to localStorage and zustand store (approved vendors only). */
function persistSellerSession(seller: Seller): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SELLER_SESSION_KEY, JSON.stringify(seller));
    useSellerStore.getState().setSeller(seller);
  } catch {
    // ignore
  }
}

/** Clear seller session from localStorage and zustand store. */
function clearSellerSession(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(SELLER_SESSION_KEY);
    useSellerStore.getState().logout();
  } catch {
    // ignore
  }
}

function mapRegisterPayload(payload: SellerRegisterPayload) {
  const s1 = payload.step1 || ({} as any);
  const s2 = payload.step2 || ({} as any);
  const s3 = payload.step3 || ({} as any);
  const s4 = payload.step4 || ({} as any);
  const s5 = payload.step5 || ({} as any);
  return {
    name: s1.fullName,
    email: s1.email,
    phone: s1.mobile,
    password: s1.password,
    confirmPassword: s1.confirmPassword,
    businessName: s2.businessName,
    storeName: s2.businessName,
    businessType: s2.businessType,
    businessCategory: s2.businessType,
    businessDescription: s2.businessDescription,
    businessEmail: s2.businessEmail,
    businessPhone: s2.businessPhone,
    address: {
      name: s1.fullName,
      phone: s2.businessPhone || s1.mobile,
      street: [s3.houseNumber, s3.street].filter(Boolean).join(", "),
      locality: s3.street,
      city: s3.city,
      state: s3.state,
      pincode: s3.pincode,
      type: "business",
      isDefault: true,
    },
    panNumber: s4.panNumber,
    gstNumber: s4.gstNumber,
    businessRegistration: s4.businessRegistration,
    bankDetails: {
      accountHolderName: s5.accountHolderName,
      bankName: s5.bankName,
      accountNumber: s5.accountNumber,
      ifscCode: s5.ifscCode,
    },
    documents: s4.identityPreview
      ? [{ type: "identity_proof", fileName: "identity-upload", fileUrl: s4.identityPreview, mimeType: "image/*" }]
      : [],
    submit: true,
  };
}

export const sellerAuthService = {
  async getCurrentSeller(): Promise<Seller | null> {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(SELLER_SESSION_KEY);
      return raw ? (JSON.parse(raw) as Seller) : null;
    } catch {
      return null;
    }
  },

  async loginWithPassword(identifier: string, password: string): Promise<SellerAuthResult> {
    const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ emailOrPhone: identifier, password }),
    });

    const json = (await res.json().catch(() => ({}))) as ApiEnvelope<LoginApiData>;
    if (!res.ok || json?.success === false) {
      const msg = json?.message || json?.error?.message || "Login failed.";
      throw new Error(msg);
    }

    const data = (json.data || (json as any)) as LoginApiData;
    const seller = toSellerFromLogin(data);
    // Only persist if backend allowed login (approved vendor) and returned tokens
    if (data.tokens?.accessToken) {
      persistSellerSession(seller);
    } else {
      clearSellerSession();
    }

    return { seller, token: data.tokens?.accessToken || "" };
  },

  async register(payload: SellerRegisterPayload): Promise<{ success: boolean; message: string; applicationStatus?: string }> {
    const body = mapRegisterPayload(payload);
    const res = await fetch(`${API_BASE}/api/v1/vendors/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });

    const json = (await res.json().catch(() => ({}))) as ApiEnvelope<any>;
    if (!res.ok || json?.success === false) {
      const msg = json?.message || json?.error?.message || "Registration failed.";
      throw new Error(msg);
    }

    // Part 11: registration must not auto-grant dashboard access/session
    clearSellerSession();
    const applicationStatus = json?.data?.applicationStatus || json?.data?.vendor?.applicationStatus || "Pending";
    return { success: true, message: json?.message || "Vendor application submitted.", applicationStatus };
  },

  async logout(): Promise<void> {
    try {
      await fetch(`${API_BASE}/api/v1/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Ignore network errors during logout
    }
    clearSellerSession();
  },

  async sendPasswordReset(identifier: string): Promise<void> {
    const res = await fetch(`${API_BASE}/api/v1/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ emailOrPhone: identifier }),
    });

    if (!res.ok) {
      const errBody = (await res.json().catch(() => ({}))) as { message?: string };
      throw new Error(errBody?.message || "Password reset request failed.");
    }
  },

  async resetPassword(): Promise<void> {
    // no-op for compatibility
  },

  async getApplication() {
    const res = await fetch(`${API_BASE}/api/v1/vendors/application`, { credentials: "include" });
    const json = (await res.json().catch(() => ({}))) as ApiEnvelope<any>;
    if (!res.ok || json?.success === false) throw new Error(json?.message || "Failed to fetch application");
    return json.data;
  },
};

export { EMPTY_REGISTER_PAYLOAD } from "@/data";

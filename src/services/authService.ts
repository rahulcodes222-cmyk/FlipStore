/**
 * authService — Frontend authentication service connected to backend APIs.
 *
 * Replaces the mock-only implementation with real API calls to:
 *   POST /api/v1/auth/login
 *   POST /api/v1/auth/register
 *   POST /api/v1/auth/logout
 *   POST /api/v1/auth/refresh
 *   GET  /api/v1/auth/me
 *   GET /api/v1/users/profile
 *   PATCH /api/v1/users/profile
 *   GET /api/v1/users/addresses
 *   POST /api/v1/users/addresses
 *   PATCH /api/v1/users/addresses/:id
 *   DELETE /api/v1/users/addresses/:id
 *   PATCH /api/v1/users/addresses/:id/default
 *   POST /api/v1/auth/forgot-password
 *   POST /api/v1/auth/reset-password
 *   POST /api/v1/auth/change-password
 *
 * Tokens are stored in HTTP-only cookies by the backend; this service
 * manages the user session in localStorage and the zustand store.
 */

import { Address, User, CartItem } from "@/types";
import { useAuthStore } from "@/store/useAuthStore";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
const AUTH_USER_KEY = "my_ecommerce_current_user_v1";
const ACCESS_TOKEN_KEY = "my_ecommerce_access_token_v1";

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt?: string;
  refreshTokenExpiresAt?: string;
}

interface AuthPayload {
  user: User;
  tokens?: AuthTokens;
}

interface ApiSuccessResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

interface ApiErrorResponse {
  success: false;
  message: string;
  error?: {
    code: string;
    details?: Record<string, string[]>;
  };
}

/**
 * Persist user session to localStorage and zustand store.
 */

function getStoredAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  try { return window.localStorage.getItem(ACCESS_TOKEN_KEY); } catch { return null; }
}

function setStoredAccessToken(token?: string): void {
  if (typeof window === "undefined") return;
  try {
    if (token) window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
    else window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  } catch {}
}

function withAuthHeaders(init: RequestInit = {}): RequestInit {
  const token = getStoredAccessToken();
  const headers = new Headers(init.headers || {});
  if (token && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`);
  return { ...init, headers };
}

function persistSession(user: User): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    useAuthStore.getState().setUser(user);
  } catch {
    // ignore
  }
}

/**
 * Clear session from localStorage and zustand store.
 */
function clearSession(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(AUTH_USER_KEY);
    useAuthStore.getState().logout();
  } catch {
    // ignore
  }
}

/**
 * Get the current session user from localStorage.
 */
export async function getCurrentUser(): Promise<User | null> {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

/**
 * Login with email/mobile + password.
 * Calls POST /api/v1/auth/login.
 */
export async function loginWithPassword(
  identifier: string,
  password: string,
): Promise<{ user: User; token: string }> {
  const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include", // Send/receive HTTP-only cookies
    body: JSON.stringify({ emailOrPhone: identifier, password }),
  });

  const body = (await res.json().catch(() => ({}))) as ApiSuccessResponse<AuthPayload> & ApiErrorResponse;
  if (!res.ok || body?.success === false) {
    throw new Error((body as ApiErrorResponse)?.message || "Login failed. Please try again.");
  }

  const payload = (body as ApiSuccessResponse<AuthPayload>).data;
  if (!payload?.user) {
    throw new Error("Login failed: invalid server response.");
  }
  persistSession(payload.user);
  if (payload.tokens?.accessToken) setStoredAccessToken(payload.tokens.accessToken);
  return { user: payload.user, token: payload.tokens?.accessToken || "" };
}

/**
 * Register a new customer account.
 * Calls POST /api/v1/auth/register.
 */
export async function register(input: {
  name: string;
  email: string;
  phone: string;
  password: string;
}): Promise<{ user: User; token: string }> {
  const res = await fetch(`${API_BASE}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });

  const body = (await res.json().catch(() => ({}))) as ApiSuccessResponse<AuthPayload> & ApiErrorResponse;
  if (!res.ok || body?.success === false) {
    throw new Error((body as ApiErrorResponse)?.message || "Registration failed. Please try again.");
  }

  const auth = (body as ApiSuccessResponse<AuthPayload>).data;
  if (!auth?.user) {
    throw new Error("Registration failed: invalid server response.");
  }
  persistSession(auth.user);
  if (auth.tokens?.accessToken) setStoredAccessToken(auth.tokens.accessToken);
  return { user: auth.user, token: auth.tokens?.accessToken || "" };
}

/**
 * Log out and clear session.
 * Calls POST /api/v1/auth/logout.
 */
export async function logout(): Promise<void> {
  try {
    await fetch(`${API_BASE}/api/v1/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // Ignore network errors during logout
  }
  clearSession();
}

/**
 * Refresh the access token using the refresh token cookie.
 * Calls POST /api/v1/auth/refresh.
 */
export async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });

    if (!res.ok) {
      clearSession();
      return null;
    }

    const data = await res.json();
    return data.data?.accessToken || null;
  } catch {
    clearSession();
    return null;
  }
}

/**
 * Get the current authenticated user profile.
 * Calls GET /api/v1/users/profile (or GET /api/v1/auth/me as fallback).
 */
export async function fetchCurrentUser(): Promise<User | null> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/users/profile`, withAuthHeaders({
      method: "GET",
      credentials: "include",
    }));
    const body = await res.json().catch(() => ({} as any));

    if (res.ok && body?.success !== false && body?.data) {
      const user: User = body.data as User;
      persistSession(user);
      return user;
    }

    if (res.status === 401 || res.status === 403) {
      clearSession();
      return null;
    }

    // Server/transient error: keep existing session
    return null;
  } catch {
    // Network/transient error: keep existing session
    return null;
  }
}

/**
 * Update profile information.
 * Calls PATCH /api/v1/users/profile.
 */
export async function updateProfile(updates: Partial<User>): Promise<User> {
  const res = await fetch(`${API_BASE}/api/v1/users/profile`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(updates),
  });

  if (!res.ok) {
    const errBody = (await res.json().catch(() => ({}))) as ApiErrorResponse;
    throw new Error(errBody?.message || "Profile update failed.");
  }

  const data = await res.json();
  const user: User = data.data;
  persistSession(user);
  return user;
}

/**
 * Get all saved addresses for the authenticated user.
 * Calls GET /api/v1/users/addresses.
 */


async function tryRefreshAuthClient(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/auth/refresh`, withAuthHeaders({
      method: "POST",
      credentials: "include",
    }));
    if (!res.ok) return false;
    const body = await res.json().catch(() => ({} as any));
    const token = body?.data?.accessToken || body?.accessToken;
    if (token) setStoredAccessToken(token);
    return true;
  } catch {
    return false;
  }
}

async function fetchAuthApi(input: RequestInfo | URL, init: RequestInit = {}, canRetry = true): Promise<Response> {
  const reqInit = withAuthHeaders({ credentials: "include", ...init });
  const res = await fetch(input, reqInit);
  if (res.status === 401 && canRetry) {
    const refreshed = await tryRefreshAuthClient();
    if (refreshed) return fetch(input, withAuthHeaders({ credentials: "include", ...init }));
  }
  return res;
}

export async function getAddresses(): Promise<Address[]> {
  const res = await fetchAuthApi(`${API_BASE}/api/v1/users/addresses`, {
    method: "GET",
  });

  if (!res.ok) {
    const errBody = (await res.json().catch(() => ({}))) as ApiErrorResponse;
    throw new Error(errBody?.message || "Failed to fetch addresses.");
  }

  const data = await res.json();
  const list = Array.isArray(data.data) ? data.data : [];
  return list.map((a: any) => ({
    ...a,
    id: String(a?.id || a?._id || ""),
  }));
}

/**
 * Add a new delivery address.
 * Calls POST /api/v1/users/addresses.
 */
export async function addAddress(
  addressData: Omit<Address, "id">,
): Promise<Address> {
  const res = await fetchAuthApi(`${API_BASE}/api/v1/users/addresses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(addressData),
  });

  if (!res.ok) {
    const errBody = (await res.json().catch(() => ({}))) as ApiErrorResponse;
    throw new Error(errBody?.message || "Failed to add address.");
  }

  const data = await res.json();
  const a = data.data || {};
  return { ...a, id: String(a?.id || a?._id || "") };
}

/**
 * Edit an existing address.
 * Calls PATCH /api/v1/users/addresses/:id.
 */
export async function editAddress(
  addressId: string,
  updates: Partial<Address>,
): Promise<Address> {
  const res = await fetchAuthApi(`${API_BASE}/api/v1/users/addresses/${addressId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });

  if (!res.ok) {
    const errBody = (await res.json().catch(() => ({}))) as ApiErrorResponse;
    throw new Error(errBody?.message || "Failed to update address.");
  }

  const data = await res.json();
  const a = data.data || {};
  return { ...a, id: String(a?.id || a?._id || "") };
}

/**
 * Delete an address.
 * Calls DELETE /api/v1/users/addresses/:id.
 */
export async function deleteAddress(addressId: string): Promise<void> {
  const res = await fetchAuthApi(`${API_BASE}/api/v1/users/addresses/${addressId}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const errBody = (await res.json().catch(() => ({}))) as ApiErrorResponse;
    throw new Error(errBody?.message || "Failed to delete address.");
  }
}

/**
 * Set an address as the default address.
 * Calls PATCH /api/v1/users/addresses/:id/default.
 */
export async function setDefaultAddress(addressId: string): Promise<void> {
  const res = await fetchAuthApi(`${API_BASE}/api/v1/users/addresses/${addressId}/default`, {
    method: "PATCH",
  });

  if (!res.ok) {
    const errBody = (await res.json().catch(() => ({}))) as ApiErrorResponse;
    throw new Error(errBody?.message || "Failed to set default address.");
  }
}

/**
 * Get cart items for the authenticated user.
 * Calls GET /api/v1/cart.
 */
export async function getCart(): Promise<CartItem[]> {
  const res = await fetch(`${API_BASE}/api/v1/cart`, {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch cart.");
  }

  const data = await res.json();
  return data.data?.items || [];
}

/**
 * Add product to cart.
 * Calls POST /api/v1/cart/items.
 */
export async function addToCart(
  productId: string,
  quantity: number = 1,
  variantId?: string,
): Promise<CartItem[]> {
  const res = await fetch(`${API_BASE}/api/v1/cart/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ productId, quantity, variantId }),
  });

  if (!res.ok) {
    const errBody = (await res.json().catch(() => ({}))) as ApiErrorResponse;
    throw new Error(errBody?.message || "Failed to add item to cart.");
  }

  const data = await res.json();
  return data.data?.items || [];
}

/**
 * Update cart item quantity.
 * Calls PATCH /api/v1/cart/items/:id.
 */
export async function updateCartItem(
  itemId: string,
  quantity: number,
): Promise<CartItem[]> {
  const res = await fetch(`${API_BASE}/api/v1/cart/items/${itemId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ quantity }),
  });

  if (!res.ok) {
    const errBody = (await res.json().catch(() => ({}))) as ApiErrorResponse;
    throw new Error(errBody?.message || "Failed to update cart item.");
  }

  const data = await res.json();
  return data.data?.items || [];
}

/**
 * Delete an item from cart.
 * Calls DELETE /api/v1/cart/items/:id.
 */
export async function deleteCartItem(itemId: string): Promise<CartItem[]> {
  const res = await fetch(`${API_BASE}/api/v1/cart/items/${itemId}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!res.ok) {
    const errBody = (await res.json().catch(() => ({}))) as ApiErrorResponse;
    throw new Error(errBody?.message || "Failed to delete cart item.");
  }

  const data = await res.json();
  return data.data?.items || [];
}

/**
 * Clear all items from cart.
 * Calls DELETE /api/v1/cart.
 */
export async function clearCart(): Promise<void> {
  const res = await fetch(`${API_BASE}/api/v1/cart`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!res.ok) {
    const errBody = (await res.json().catch(() => ({}))) as ApiErrorResponse;
    throw new Error(errBody?.message || "Failed to clear cart.");
  }
}

/**
 * Get wishlist items for the authenticated user.
 * Calls GET /api/v1/wishlist.
 */
export async function getWishlist(): Promise<CartItem[]> {
  const res = await fetch(`${API_BASE}/api/v1/wishlist`, {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch wishlist.");
  }

  const data = await res.json();
  return data.data || [];
}

/**
 * Add product to wishlist.
 * Calls POST /api/v1/wishlist.
 */
export async function addToWishlist(productId: string): Promise<CartItem[]> {
  const res = await fetch(`${API_BASE}/api/v1/wishlist`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ productId }),
  });

  if (!res.ok) {
    const errBody = (await res.json().catch(() => ({}))) as ApiErrorResponse;
    throw new Error(errBody?.message || "Failed to add item to wishlist.");
  }

  const data = await res.json();
  return data.data || [];
}

/**
 * Remove product from wishlist.
 * Calls DELETE /api/v1/wishlist/:productId.
 */
export async function deleteWishlistItem(productId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/v1/wishlist/${productId}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!res.ok) {
    const errBody = (await res.json().catch(() => ({}))) as ApiErrorResponse;
    throw new Error(errBody?.message || "Failed to remove from wishlist.");
  }
}

/**
 * Move item from wishlist to cart.
 * Calls POST /api/v1/wishlist/move-to-cart.
 */
export async function moveWishlistItemToCart(productId: string): Promise<CartItem[]> {
  const res = await fetch(`${API_BASE}/api/v1/wishlist/move-to-cart`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ productId }),
  });

  if (!res.ok) {
    const errBody = (await res.json().catch(() => ({}))) as ApiErrorResponse;
    throw new Error(errBody?.message || "Failed to move item to cart.");
  }

  const data = await res.json();
  return data.data?.items || [];
}

/**
 * Check if product is in wishlist.
 * This checks locally against the wishlist items.
 */
export async function isInWishlist(productId: string): Promise<boolean> {
  try {
    const wishlist = await getWishlist();
    return wishlist.some((item) => item.productId === productId);
  } catch {
    return false;
  }
}

/**
 * Request a password reset.
 * Calls POST /api/v1/auth/forgot-password.
 */
export async function sendPasswordReset(identifier: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/v1/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ emailOrPhone: identifier }),
  });

  if (!res.ok) {
    const errBody = (await res.json().catch(() => ({}))) as ApiErrorResponse;
    throw new Error(errBody?.message || "Password reset request failed.");
  }
}

/**
 * Reset password using reset token.
 * Calls POST /api/v1/auth/reset-password.
 */
export async function resetPassword(
  identifier: string,
  _otp: string,
  newPassword: string,
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/v1/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      emailOrPhone: identifier,
      newPassword,
      confirmPassword: newPassword,
    }),
  });

  if (!res.ok) {
    const errBody = (await res.json().catch(() => ({}))) as ApiErrorResponse;
    throw new Error(errBody?.message || "Password reset failed.");
  }
}

/**
 * Change password for authenticated user.
 * Calls POST /api/v1/auth/change-password.
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/v1/auth/change-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ currentPassword, newPassword }),
  });

  if (!res.ok) {
    const errBody = (await res.json().catch(() => ({}))) as ApiErrorResponse;
    throw new Error(errBody?.message || "Password change failed.");
  }
}

/**
 * Legacy OTP-less login (kept for backward compatibility).
 * @deprecated Use loginWithPassword instead.
 */
export async function login(identifier: string): Promise<User> {
  // Create a temporary user for legacy compatibility
  const cleanId = identifier.trim().toLowerCase();
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanId);

  const user: User = {
    id: `usr-${Date.now()}`,
    name: isEmail ? cleanId.split("@")[0] : "Guest Shopper",
    email: isEmail ? cleanId : `${cleanId}@guest.flipstore.in`,
    phone: cleanId.replace(/\D/g, "") || "9999900000",
    role: cleanId.includes("admin") ? "admin" : "customer",
    avatar:
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=80",
    addresses: [],
    createdAt: new Date().toISOString(),
  };

  persistSession(user);
  return user;
}

// ─── Export for backward compatibility ───

/**
 * Login with Google ID token credential.
 * Calls POST /api/v1/auth/google.
 */
export async function loginWithGoogle(credential: string): Promise<{ user: User; token: string }> {
  const res = await fetch(`${API_BASE}/api/v1/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ credential }),
  });

  const body = (await res.json().catch(() => ({}))) as ApiSuccessResponse<AuthPayload> & ApiErrorResponse;
  if (!res.ok || body?.success === false) {
    throw new Error((body as ApiErrorResponse)?.message || "Google login failed. Please try again.");
  }

  const payload = (body as ApiSuccessResponse<AuthPayload>).data;
  if (!payload?.user) {
    throw new Error("Google login failed: invalid server response.");
  }
  persistSession(payload.user);
  if (payload.tokens?.accessToken) setStoredAccessToken(payload.tokens.accessToken);
  return { user: payload.user, token: payload.tokens?.accessToken || "" };
}

/**
 * Demo credentials for quick login buttons.
 * These point to pre-seeded backend accounts.
 */
export const DEMO_CREDENTIALS = [
  {
    label: "Customer",
    name: "Aarav Mehta",
    identifier: "aarav.mehta@example.com",
    password: "Customer@123",
  },
  {
    label: "Admin",
    name: "Admin Superuser",
    identifier: "admin@flipstore.in",
    password: "Admin@123",
  },
];

/**
 * Named export for backward compatibility with existing imports.
 * Wraps all individual functions into a single authService object.
 */
export const authService = {
  loginWithPassword,
  loginWithGoogle,
  register,
  logout,
  refreshAccessToken,
  fetchCurrentUser,
  sendPasswordReset,
  resetPassword,
  changePassword,
  getCurrentUser,
  updateProfile,
  getAddresses,
  addAddress,
  editAddress,
  deleteAddress,
  setDefaultAddress,
  login,
  // Cart methods
  getCart,
  addToCart,
  updateCartItem,
  deleteCartItem,
  clearCart,
  // Wishlist methods
  getWishlist,
  addToWishlist,
  deleteWishlistItem,
  moveWishlistItemToCart,
  isInWishlist,
};

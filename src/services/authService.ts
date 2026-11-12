/**
 * authService — Frontend-only simulated authentication.
 *
 * ⚠️  This is NOT production-secure authentication.
 * No passwords are hashed or transmitted securely here.
 * This module is intentionally isolated so a real backend
 * (e.g. NextAuth, Supabase, Firebase) can replace it later
 * by swapping out only this file.
 */

import { Address, User } from "@/types";
import { MOCK_USERS } from "@/data";

// ─── Storage keys ─────────────────────────────────────────────────────────────
const AUTH_USER_KEY = "my_ecommerce_current_user_v1";
const AUTH_REGISTERED_KEY = "my_ecommerce_registered_users_v1";

// ─── Mock passwords for pre-seeded demo accounts ──────────────────────────────
// In a real app these would NEVER exist client-side.
const MOCK_PASSWORDS: Record<string, string> = {
  "aarav.mehta@example.com": "Demo@1234",
  "9876543210": "Demo@1234",
  "admin@my-ecommerce.in": "Admin@1234",
  "9999988888": "Admin@1234",
};

export const DEMO_CREDENTIALS = [
  {
    label: "Customer",
    name: "Aarav Mehta",
    identifier: "aarav.mehta@example.com",
    password: "Demo@1234",
  },
  {
    label: "Admin",
    name: "Admin Superuser",
    identifier: "admin@my-ecommerce.in",
    password: "Admin@1234",
  },
];

// ─── Types ────────────────────────────────────────────────────────────────────
export interface RegisterPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface AuthResult {
  user: User;
  token: string; // mock JWT placeholder
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getRegisteredUsers(): Array<User & { _password: string }> {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(AUTH_REGISTERED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRegisteredUsers(users: Array<User & { _password: string }>) {
  try {
    localStorage.setItem(AUTH_REGISTERED_KEY, JSON.stringify(users));
  } catch {
    // ignore
  }
}

function persistSession(user: User) {
  try {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  } catch {
    // ignore
  }
}

function makeMockToken(user: User): string {
  // Not a real JWT — just a base64 placeholder for future replacement
  const payload = { sub: user.id, role: user.role, iat: Date.now() };
  return "mock." + btoa(JSON.stringify(payload)) + ".sig";
}

function normalisePhone(phone: string): string {
  return phone.replace(/\D/g, "").slice(-10);
}

function isEmail(val: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
}

// ─── Service ──────────────────────────────────────────────────────────────────
export const authService = {
  /**
   * Get the current session user from localStorage (or null).
   * Replace with a session cookie / JWT decode call when connecting a backend.
   */
  async getCurrentUser(): Promise<User | null> {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(AUTH_USER_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  },

  /**
   * Login with email/mobile + password.
   * Replace the body of this function to call a real API endpoint.
   */
  async loginWithPassword(identifier: string, password: string): Promise<AuthResult> {
    // Simulate network delay
    await new Promise((r) => setTimeout(r, 600));

    const cleanId = identifier.trim().toLowerCase();
    const cleanPhone = normalisePhone(cleanId);

    // 1. Check pre-seeded mock users
    const foundUser: User | undefined = MOCK_USERS.find(
      (u) =>
        u.email.toLowerCase() === cleanId ||
        normalisePhone(u.phone) === cleanPhone
    );

    if (foundUser) {
      const expectedPwd =
        MOCK_PASSWORDS[foundUser.email] ||
        MOCK_PASSWORDS[normalisePhone(foundUser.phone)];
      if (expectedPwd && password !== expectedPwd) {
        throw new Error("Incorrect password. Try Demo@1234 for demo accounts.");
      }
      persistSession(foundUser);
      return { user: foundUser, token: makeMockToken(foundUser) };
    }

    // 2. Check self-registered users
    const registered = getRegisteredUsers();
    const regUser = registered.find(
      (u) =>
        u.email.toLowerCase() === cleanId ||
        normalisePhone(u.phone) === cleanPhone
    );

    if (regUser) {
      if (regUser._password !== password) {
        throw new Error("Incorrect password.");
      }
      const { _password: _pw, ...user } = regUser;
      void _pw;
      persistSession(user);
      return { user, token: makeMockToken(user) };
    }

    throw new Error("No account found. Please register first.");
  },

  /**
   * Legacy OTP-less login (kept for backward compatibility with existing pages).
   * @deprecated Use loginWithPassword instead.
   */
  async login(identifier: string): Promise<User> {
    await new Promise((r) => setTimeout(r, 400));
    const cleanId = identifier.trim().toLowerCase();
    const cleanPhone = normalisePhone(cleanId);

    let foundUser = MOCK_USERS.find(
      (u) =>
        u.email.toLowerCase() === cleanId ||
        normalisePhone(u.phone) === cleanPhone
    );

    if (!foundUser) {
      foundUser = {
        id: `usr-${Date.now()}`,
        name: isEmail(cleanId) ? cleanId.split("@")[0] : "Guest Shopper",
        email: isEmail(cleanId)
          ? cleanId
          : `${cleanPhone}@guest.flipstore.in`,
        phone: cleanPhone || "9999900000",
        role: cleanId.includes("admin") ? "admin" : "customer",
        avatar:
          "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=80",
        addresses: [],
        createdAt: new Date().toISOString(),
      };
    }

    persistSession(foundUser);
    return foundUser;
  },

  /**
   * Register a new account.
   * Replace the body to POST to /api/auth/register.
   */
  async register(payload: RegisterPayload): Promise<AuthResult> {
    await new Promise((r) => setTimeout(r, 800));

    const registered = getRegisteredUsers();

    // Duplicate checks
    if (
      registered.some(
        (u) => u.email.toLowerCase() === payload.email.toLowerCase()
      )
    ) {
      throw new Error("An account with this email already exists.");
    }
    if (
      registered.some(
        (u) => normalisePhone(u.phone) === normalisePhone(payload.phone)
      )
    ) {
      throw new Error("An account with this mobile number already exists.");
    }
    if (
      MOCK_USERS.some(
        (u) => u.email.toLowerCase() === payload.email.toLowerCase()
      )
    ) {
      throw new Error(
        "This email is already registered. Please log in instead."
      );
    }

    const newUser: User = {
      id: `usr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      role: "customer",
      avatar:
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=80",
      addresses: [],
      createdAt: new Date().toISOString(),
    };

    saveRegisteredUsers([...registered, { ...newUser, _password: payload.password }]);
    persistSession(newUser);
    return { user: newUser, token: makeMockToken(newUser) };
  },

  /**
   * Send a password-reset OTP to the given email/mobile.
   * Replace to call POST /api/auth/forgot-password.
   */
  async sendPasswordReset(identifier: string): Promise<void> {
    await new Promise((r) => setTimeout(r, 700));

    const cleanId = identifier.trim().toLowerCase();
    const cleanPhone = normalisePhone(cleanId);

    const inMock = MOCK_USERS.some(
      (u) =>
        u.email.toLowerCase() === cleanId ||
        normalisePhone(u.phone) === cleanPhone
    );
    const inRegistered = getRegisteredUsers().some(
      (u) =>
        u.email.toLowerCase() === cleanId ||
        normalisePhone(u.phone) === cleanPhone
    );

    if (!inMock && !inRegistered) {
      throw new Error(
        "No account found with this email or mobile number."
      );
    }
    // In a real app: send OTP via SMS/email here
  },

  /**
   * Reset password using the OTP token.
   * Replace to call POST /api/auth/reset-password.
   */
  async resetPassword(
    identifier: string,
    _otp: string,
    newPassword: string
  ): Promise<void> {
    await new Promise((r) => setTimeout(r, 600));

    const cleanId = identifier.trim().toLowerCase();
    const cleanPhone = normalisePhone(cleanId);

    // Update registered users list
    const registered = getRegisteredUsers();
    const idx = registered.findIndex(
      (u) =>
        u.email.toLowerCase() === cleanId ||
        normalisePhone(u.phone) === cleanPhone
    );
    if (idx !== -1) {
      registered[idx]._password = newPassword;
      saveRegisteredUsers(registered);
    }
    // For mock users: update MOCK_PASSWORDS in-memory (session only)
    const mockUser = MOCK_USERS.find(
      (u) =>
        u.email.toLowerCase() === cleanId ||
        normalisePhone(u.phone) === cleanPhone
    );
    if (mockUser) {
      MOCK_PASSWORDS[mockUser.email] = newPassword;
    }
  },

  /**
   * Log out and clear the session.
   * Replace to call POST /api/auth/logout or clear an HTTP-only cookie.
   */
  async logout(): Promise<void> {
    if (typeof window === "undefined") return;
    localStorage.removeItem(AUTH_USER_KEY);
  },

  /**
   * Update profile information.
   */
  async updateProfile(updates: Partial<User>): Promise<User> {
    const current = await this.getCurrentUser();
    if (!current) throw new Error("No user is currently signed in");

    const updated: User = { ...current, ...updates };
    persistSession(updated);

    // Also update registered users list if needed
    const registered = getRegisteredUsers();
    const idx = registered.findIndex((u) => u.id === current.id);
    if (idx !== -1) {
      registered[idx] = { ...registered[idx], ...updates };
      saveRegisteredUsers(registered);
    }

    return updated;
  },

  /**
   * Add a new delivery address.
   */
  async addAddress(addressData: Omit<Address, "id">): Promise<Address> {
    const current = await this.getCurrentUser();
    if (!current) throw new Error("No user is currently signed in");

    const newAddress: Address = { ...addressData, id: `addr-${Date.now()}` };
    let updatedAddresses = [...current.addresses];
    if (newAddress.isDefault) {
      updatedAddresses = updatedAddresses.map((a) => ({
        ...a,
        isDefault: false,
      }));
    }
    updatedAddresses.push(newAddress);

    await this.updateProfile({
      addresses: updatedAddresses,
      defaultAddressId: newAddress.isDefault
        ? newAddress.id
        : current.defaultAddressId,
    });

    return newAddress;
  },
};

/**
 * Auth Service
 * Business logic for authentication: register, login, password reset.
 * Keeps business logic separate from API route handlers.
 */

import { UserModel, VendorModel } from '@/backend/models';
import mongoose from 'mongoose';
import crypto from 'crypto';
import {
  hashPassword,
  comparePassword,
  validatePasswordStrength,
} from '@/backend/utils/password';
import { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken } from '@/backend/utils/jwt';
import { HTTP_STATUS, canVendorAccessDashboard, normalizeVendorApplicationStatus } from '@/backend/constants';
import { env } from '@/backend/config/env';
import type { IUserDocument, JWTPayload, AuthTokens } from '@/backend/types';
import type {
  RegisterInput,
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  VendorRegisterInput,
} from '@/backend/validations/auth.schema';

type UserRoleType = 'customer' | 'vendor' | 'admin' | 'super_admin';

interface AuthResult {
  user: IUserDocument;
  tokens: AuthTokens;
}

/**
 * Register a new user (customer or vendor).
 */
export async function registerUser(data: RegisterInput): Promise<AuthResult> {
  const existingByEmail = await (UserModel as unknown as { findByEmail: (email: string) => Promise<IUserDocument | null> }).findByEmail(data.email);
  if (existingByEmail) {
    throw new Error('An account with this email already exists.');
  }

  const existingByPhone = await (UserModel as unknown as { findByPhone: (phone: string) => Promise<IUserDocument | null> }).findByPhone(data.phone);
  if (existingByPhone) {
    throw new Error('An account with this phone number already exists.');
  }

  const passwordValidation = validatePasswordStrength(data.password);
  if (!passwordValidation.isValid) {
    throw new Error(passwordValidation.errors.join(' '));
  }

  const passwordHash = await hashPassword(data.password);

  const user = await UserModel.create({
    name: data.name,
    email: data.email,
    phone: data.phone,
    passwordHash,
    role: (data.role || 'customer') as UserRoleType,
    isEmailVerified: false,
    isPhoneVerified: false,
    isActive: true,
  });

  const tokens = await generateTokens(user);

  return { user, tokens };
}

/**
 * Register a vendor with additional business information.
 */
export async function registerVendor(data: VendorRegisterInput): Promise<AuthResult> {
  const existingByEmail = await (UserModel as unknown as { findByEmail: (email: string) => Promise<IUserDocument | null> }).findByEmail(data.email);
  if (existingByEmail) {
    throw new Error('An account with this email already exists.');
  }

  const existingByPhone = await (UserModel as unknown as { findByPhone: (phone: string) => Promise<IUserDocument | null> }).findByPhone(data.phone);
  if (existingByPhone) {
    throw new Error('An account with this phone number already exists.');
  }

  const passwordValidation = validatePasswordStrength(data.password);
  if (!passwordValidation.isValid) {
    throw new Error(passwordValidation.errors.join(' '));
  }

  const passwordHash = await hashPassword(data.password);

  const userData: Record<string, unknown> = {
    name: data.name,
    email: data.email,
    phone: data.phone,
    passwordHash,
    role: 'vendor' as UserRoleType,
    isEmailVerified: false,
    isPhoneVerified: false,
    isActive: true,
    vendorProfile: {
      businessName: data.businessName,
      businessType: data.businessType,
      businessDescription: data.businessDescription || '',
      gstNumber: data.gstNumber || '',
      panNumber: data.panNumber || '',
      verificationStatus: 'pending',
    },
  };

  const user = await UserModel.create(userData);

  const tokens = await generateTokens(user);

  return { user, tokens };
}

/**
 * Login with email/phone and password.
 */
export async function loginUser(data: LoginInput): Promise<AuthResult> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = (await (UserModel as unknown as { findOne: (query: Record<string, unknown>) => any }).findOne({
    $or: [
      { email: data.emailOrPhone.toLowerCase() },
      { phone: data.emailOrPhone },
    ],
  }).exec()) as IUserDocument | null;

  if (!user) {
    throw new Error('Invalid email or phone number.');
  }

  const isPasswordValid = await comparePassword(data.password, user.passwordHash);
  if (!isPasswordValid) {
    throw new Error('Invalid password.');
  }

  if (!user.isActive) {
    throw new Error('Account is deactivated. Please contact support.');
  }

  // Vendor login is allowed only for approved seller accounts (admin approval required).
  if (user.role === 'vendor') {
    let vendor: any = null;
    const vendorId = (user as any).vendorId;
    if (vendorId && mongoose.Types.ObjectId.isValid(String(vendorId))) {
      vendor = await (VendorModel as any).findById(vendorId).lean().exec();
    }
    if (!vendor) {
      vendor = await (VendorModel as any).findOne({ userId: user._id }).lean().exec();
    }
    const applicationStatus = normalizeVendorApplicationStatus(
      vendor?.applicationStatus || vendor?.approvalStatus || (user as any).vendorApplicationStatus,
    );
    if (!canVendorAccessDashboard(applicationStatus)) {
      if (applicationStatus === 'Rejected') {
        throw new Error('Your seller application was rejected. Please update and resubmit your application.');
      }
      if (applicationStatus === 'Suspended') {
        throw new Error('Your seller account is suspended. Please contact support.');
      }
      throw new Error('Your seller account is pending approval and is not available until approved by admin.');
    }
    (user as any).vendorApplicationStatus = applicationStatus;
    (user as any).isVendorApproved = true;
  }

  const tokens = await generateTokens(user);

  // Update last login
  user.lastLoginAt = new Date();
  await user.save();

  return { user, tokens };
}

/**
 * Login or register with Google ID token credential.
 */
export async function loginWithGoogle(credential: string): Promise<AuthResult> {
  const token = String(credential || '').trim();
  if (!token) throw new Error('Google credential is required.');

  const clientId = (env.googleClientId || env.publicGoogleClientId || '').trim();
  if (!clientId) throw new Error('Google login is not configured.');

  const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(token)}`);
  const payload = await verifyRes.json().catch(() => null) as any;
  if (!verifyRes.ok || !payload?.email || !payload?.sub) {
    throw new Error('Invalid Google sign-in token.');
  }
  if (String(payload.aud || '') !== clientId) {
    throw new Error('Google sign-in token audience mismatch.');
  }
  const emailVerified = payload.email_verified === true || String(payload.email_verified) === 'true';
  if (!emailVerified) {
    throw new Error('Google email is not verified.');
  }

  const email = String(payload.email).toLowerCase().trim();
  const name = String(payload.name || payload.given_name || email.split('@')[0] || 'User').trim().slice(0, 60) || 'User';
  const picture = String(payload.picture || '').trim();
  const googleSub = String(payload.sub || '').trim();

  let user = (await (UserModel as any).findOne({ email }).exec()) as IUserDocument | null;
  if (!user) {
    const randomPassword = `${crypto.randomUUID()}A1!`;
    const passwordHash = await hashPassword(randomPassword);
    const phonePlaceholder = `9${googleSub.replace(/\D/g, '').slice(-9).padStart(9, '0')}`;
    user = await UserModel.create({
      name,
      email,
      phone: phonePlaceholder,
      passwordHash,
      role: 'customer' as UserRoleType,
      avatar: picture || '',
      isEmailVerified: true,
      isPhoneVerified: false,
      isActive: true,
      lastLoginAt: new Date(),
    } as any);
  } else {
    if (!user.isActive) {
      throw new Error('Account is deactivated. Please contact support.');
    }

    if (user.role === 'vendor') {
      let vendor: any = null;
      const vendorId = (user as any).vendorId;
      if (vendorId && mongoose.Types.ObjectId.isValid(String(vendorId))) {
        vendor = await (VendorModel as any).findById(vendorId).lean().exec();
      }
      if (!vendor) {
        vendor = await (VendorModel as any).findOne({ userId: user._id }).lean().exec();
      }
      const applicationStatus = normalizeVendorApplicationStatus(
        vendor?.applicationStatus || vendor?.approvalStatus || (user as any).vendorApplicationStatus,
      );
      if (!canVendorAccessDashboard(applicationStatus)) {
        if (applicationStatus === 'Rejected') {
          throw new Error('Your seller application was rejected. Please update and resubmit your application.');
        }
        if (applicationStatus === 'Suspended') {
          throw new Error('Your seller account is suspended. Please contact support.');
        }
        throw new Error('Your seller account is pending approval and is not available until approved by admin.');
      }
      (user as any).vendorApplicationStatus = applicationStatus;
      (user as any).isVendorApproved = true;
    }

    let changed = false;
    if (picture && !user.avatar) { (user as any).avatar = picture; changed = true; }
    if (!user.isEmailVerified) { (user as any).isEmailVerified = true; changed = true; }
    user.lastLoginAt = new Date();
    changed = true;
    if (changed) await user.save();
  }

  const tokens = await generateTokens(user);
  return { user, tokens };
}

/**
 * Logout (server-side: invalidate refresh token if using a token store).
 */
export async function logoutUser(refreshToken: string): Promise<void> {
  try {
    await verifyRefreshToken(refreshToken);
    // In production, add refresh token to a revocation list or delete from DB
  } catch {
    // Token already expired or invalid - logout still succeeds
  }
}

/**
 * Refresh access token using a valid refresh token.
 */
export async function refreshToken(refreshToken: string): Promise<AuthTokens> {
  let payload: JWTPayload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new Error('Invalid or expired refresh token.');
  }

  const user = (await UserModel.findById(payload.sub).exec()) as IUserDocument | null;
  if (!user) {
    throw new Error('User not found.');
  }

  if (!user.isActive) {
    throw new Error('Account is deactivated. Please contact support.');
  }

  return generateTokens(user);
}

/**
 * Get current user profile.
 */
export async function getCurrentUser(userId: string) {
  const user = await UserModel.findById(userId)
    .select('-passwordHash -emailVerificationToken -passwordResetToken -passwordResetExpiresAt -emailVerificationExpiresAt')
    .lean()
    .exec();
  if (!user) {
    throw new Error('User not found.');
  }
  return user as any;
}

/**
 * Request password reset (generate reset token).
 */
export async function forgotPassword(data: ForgotPasswordInput): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = (await (UserModel as unknown as { findOne: (query: Record<string, unknown>) => any }).findOne({
    $or: [
      { email: data.emailOrPhone.toLowerCase() },
      { phone: data.emailOrPhone },
    ],
  }).exec()) as IUserDocument | null;

  if (!user) {
    // Don't reveal whether account exists - return success anyway
    return;
  }

  // Generate reset token (short-lived)
  const resetPayload: JWTPayload = {
    sub: user._id.toString(),
    email: user.email,
    role: user.role as UserRoleType,
  };
  const resetToken = signAccessToken(resetPayload);

  user.passwordResetToken = resetToken;
  user.passwordResetExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
  await user.save();

  // In production: send email/SMS with reset link containing resetToken
  console.log(`[Password Reset] Token for ${user.email}: ${resetToken}`);
}

/**
 * Reset password using reset token.
 */
export async function resetPassword(data: ResetPasswordInput): Promise<void> {
  let payload: JWTPayload;
  try {
    payload = verifyAccessToken(data.token);
  } catch {
    throw new Error('Invalid or expired reset token.');
  }

  const user = (await UserModel.findById(payload.sub).exec()) as IUserDocument | null;
  if (!user) {
    throw new Error('User not found.');
  }

  if (!user.passwordResetToken || user.passwordResetToken !== data.token) {
    throw new Error('Invalid or expired reset token.');
  }

  if (user.passwordResetExpiresAt && new Date() > user.passwordResetExpiresAt) {
    throw new Error('Reset token has expired.');
  }

  const passwordValidation = validatePasswordStrength(data.newPassword);
  if (!passwordValidation.isValid) {
    throw new Error(passwordValidation.errors.join(' '));
  }

  const passwordHash = await hashPassword(data.newPassword);

  user.passwordHash = passwordHash;
  user.passwordResetToken = undefined;
  user.passwordResetExpiresAt = undefined;
  await user.save();
}

/**
 * Change password for authenticated user.
 */
export async function changePassword(
  userId: string,
  data: { currentPassword: string; newPassword: string },
): Promise<void> {
  const user = (await UserModel.findById(userId).exec()) as IUserDocument | null;
  if (!user) {
    throw new Error('User not found.');
  }

  const isPasswordValid = await comparePassword(data.currentPassword, user.passwordHash);
  if (!isPasswordValid) {
    throw new Error('Current password is incorrect.');
  }

  const passwordValidation = validatePasswordStrength(data.newPassword);
  if (!passwordValidation.isValid) {
    throw new Error(passwordValidation.errors.join(' '));
  }

  const passwordHash = await hashPassword(data.newPassword);
  user.passwordHash = passwordHash;
  await user.save();
}

/**
 * Generate access and refresh tokens for a user.
 */
async function generateTokens(user: IUserDocument): Promise<AuthTokens> {
  const payload: JWTPayload = {
    sub: user._id.toString(),
    email: user.email,
    role: user.role as UserRoleType,
  };

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  const accessTokenExpiresAt = new Date();
  const refreshTokenExpiresAt = new Date();

  const accessMs = parseExpiryMs(env.jwtAccessExpiry);
  const refreshMs = parseExpiryMs(env.jwtRefreshExpiry);

  accessTokenExpiresAt.setTime(accessTokenExpiresAt.getTime() + accessMs);
  refreshTokenExpiresAt.setTime(refreshTokenExpiresAt.getTime() + refreshMs);

  return {
    accessToken,
    refreshToken,
    accessTokenExpiresAt: accessTokenExpiresAt.toISOString(),
    refreshTokenExpiresAt: refreshTokenExpiresAt.toISOString(),
  };
}

/**
 * Parse expiry string (e.g. '15m', '7d') to milliseconds.
 */
function parseExpiryMs(expiry: string): number {
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) return 15 * 60 * 1000; // default 15 minutes
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return value * (multipliers[unit] || 60 * 1000);
}

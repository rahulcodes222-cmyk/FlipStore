/**
 * Auth Service
 * Business logic for authentication: register, login, password reset.
 * Keeps business logic separate from API route handlers.
 */

import { UserModel, VendorModel } from '@/backend/models';
import {
  hashPassword,
  comparePassword,
  validatePasswordStrength,
} from '@/backend/utils/password';
import { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken } from '@/backend/utils/jwt';
import { createErrorResponse } from '@/backend/utils/response';
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

  const tokens = await generateTokens(user);

  // Update last login
  user.lastLoginAt = new Date();
  await user.save();

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

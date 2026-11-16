/**
 * Zod Validation Schemas for Auth
 * Shared validation logic for registration, login, and profile updates.
 * Uses Zod v4 API.
 */

import { z } from 'zod';

const emailSchema = z
  .string()
  .min(1, 'Email is required.')
  .email('Invalid email address.')
  .toLowerCase()
  .trim();

const phoneSchema = z
  .string()
  .min(1, 'Phone number is required.')
  .regex(/^\+?[\d\s-]{10,15}$/, 'Invalid phone number format.');

const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters.')
  .max(60, 'Name must not exceed 60 characters.')
  .trim();

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters.')
  .max(128, 'Password must not exceed 128 characters.')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
  .regex(/\d/, 'Password must contain at least one number.')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character.');

export const registerSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    phone: phoneSchema,
    password: passwordSchema,
    confirmPassword: z.string().optional(),
    role: z.enum(['customer', 'vendor']).optional(),
  })
  .refine(
    (data) =>
      data.confirmPassword === undefined || data.confirmPassword === '' || data.password === data.confirmPassword,
    {
      message: 'Passwords do not match.',
      path: ['confirmPassword'],
    },
  );

export const loginSchema = z.object({
  emailOrPhone: z.string().min(1, 'Email or phone number is required.').trim(),
  password: z.string().min(1, 'Password is required.'),
});

export const forgotPasswordSchema = z.object({
  emailOrPhone: z.string().min(1, 'Email or phone number is required.').trim(),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required.'),
    newPassword: passwordSchema,
    confirmPassword: z.string().optional(),
  })
  .refine(
    (data) =>
      data.confirmPassword === undefined || data.confirmPassword === '' || data.newPassword === data.confirmPassword,
    {
      message: 'Passwords do not match.',
      path: ['confirmPassword'],
    },
  );

export const updateProfileSchema = z.object({
  name: nameSchema.optional(),
  phone: phoneSchema.optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required.'),
    newPassword: passwordSchema,
    confirmPassword: z.string().optional(),
  })
  .refine(
    (data) =>
      data.confirmPassword === undefined || data.confirmPassword === '' || data.newPassword === data.confirmPassword,
    {
      message: 'Passwords do not match.',
      path: ['confirmPassword'],
    },
  );

export const vendorRegisterSchema = registerSchema.extend({
  businessName: z
    .string()
    .min(2, 'Business name must be at least 2 characters.')
    .max(100, 'Business name must not exceed 100 characters.')
    .trim(),
  businessType: z.string().min(1, 'Business type is required.'),
  businessDescription: z.string().max(500, 'Business description must not exceed 500 characters.').optional(),
  gstNumber: z.string().optional(),
  panNumber: z.string().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type VendorRegisterInput = z.infer<typeof vendorRegisterSchema>;

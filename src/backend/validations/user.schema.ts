/**
 * Zod Validation Schemas for User Profile and Address Management
 * Shared validation logic for profile updates and address CRUD operations.
 * Uses Zod v4 API.
 */

import { z } from 'zod';

/**
 * Common field schemas
 */
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
  .max(50, 'Name must not exceed 50 characters.')
  .trim();

const pincodeSchema = z
  .string()
  .min(1, 'PIN code is required.')
  .regex(/^[1-9][0-9]{5}$/, 'Enter a valid 6-digit PIN code.');

const landmarkSchema = z.string().trim().optional();

/**
 * Address type
 */
const addressTypeSchema = z.enum(['home', 'work', 'business']);

/**
 * Update Profile Schema (name, email, phone)
 */
export const updateProfileSchema = z.object({
  name: nameSchema.optional(),
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
});

/**
 * Address Creation Schema
 */
export const createAddressSchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
  alternatePhone: phoneSchema.optional(),
  pincode: pincodeSchema,
  locality: z.string().min(1, 'Locality is required.').trim(),
  street: z.string().min(1, 'Street is required.').trim(),
  city: z.string().min(1, 'City is required.').trim(),
  state: z.string().min(1, 'State is required.').trim(),
  landmark: landmarkSchema,
  type: addressTypeSchema.default('home'),
  isDefault: z.boolean().optional().default(false),
});

/**
 * Address Update Schema (partial)
 */
export const updateAddressSchema = z.object({
  name: nameSchema.optional(),
  phone: phoneSchema.optional(),
  alternatePhone: phoneSchema.optional(),
  pincode: pincodeSchema.optional(),
  locality: z.string().min(1, 'Locality is required.').trim().optional(),
  street: z.string().min(1, 'Street is required.').trim().optional(),
  city: z.string().min(1, 'City is required.').trim().optional(),
  state: z.string().min(1, 'State is required.').trim().optional(),
  landmark: landmarkSchema,
  type: addressTypeSchema.optional(),
  isDefault: z.boolean().optional(),
});

/**
 * Set Default Address Schema
 */
export const setDefaultAddressSchema = z.object({
  isDefault: z.boolean(),
});

/**
 * Address ID Parameter Schema
 */
export const addressIdParamSchema = z.object({
  id: z.string().min(1, 'Address ID is required.'),
});

/**
 * Export types inferred from schemas
 */
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateAddressInput = z.infer<typeof createAddressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
export type SetDefaultAddressInput = z.infer<typeof setDefaultAddressSchema>;
export type AddressIdParamInput = z.infer<typeof addressIdParamSchema>;

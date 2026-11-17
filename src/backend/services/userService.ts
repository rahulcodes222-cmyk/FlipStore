/**
 * User Service
 * Business logic for customer profile and address management.
 * Keeps business logic separate from API route handlers.
 */

import { UserModel } from '@/backend/models';
import type { IUserDocument, IAddressDocument } from '@/backend/types';
import type {
  UpdateProfileInput,
  CreateAddressInput,
  UpdateAddressInput,
} from '@/backend/validations/user.schema';

/**
 * Get current user profile (excluding sensitive fields).
 */
export async function getUserProfile(userId: string): Promise<Record<string, any>> {
  const user = await UserModel.findById(userId)
    .select('-passwordHash -emailVerificationToken -passwordResetToken -passwordResetExpiresAt -emailVerificationExpiresAt')
    .lean()
    .exec();

  if (!user) {
    throw new Error('User not found.');
  }

  return user as Record<string, any>;
}

/**
 * Update user profile information (name, email, phone).
 * Validates uniqueness of email and phone if provided.
 */
export async function updateUserProfile(
  userId: string,
  data: UpdateProfileInput,
): Promise<IUserDocument> {
  const user = (await UserModel.findById(userId).exec()) as IUserDocument | null;
  if (!user) {
    throw new Error('User not found.');
  }

  // Check email uniqueness if changing email
  if (data.email && data.email !== user.email) {
    const existing = await UserModel.findOne({ email: data.email.toLowerCase() }).exec();
    if (existing) {
      throw new Error('An account with this email already exists.');
    }
  }

  // Check phone uniqueness if changing phone
  if (data.phone && data.phone !== user.phone) {
    const existing = await UserModel.findOne({ phone: data.phone }).exec();
    if (existing) {
      throw new Error('An account with this phone number already exists.');
    }
  }

  // Apply updates
  if (data.name !== undefined) user.name = data.name;
  if (data.email !== undefined) user.email = data.email.toLowerCase();
  if (data.phone !== undefined) user.phone = data.phone;
  if ((data as any).avatar !== undefined) (user as any).avatar = (data as any).avatar;

  const updated = await user.save();
  return updated;
}

/**
 * Get all addresses for a user.
 */
export async function getUserAddresses(userId: string): Promise<IAddressDocument[]> {
  const user = (await UserModel.findById(userId).select('addresses').exec()) as IUserDocument | null;
  if (!user) {
    throw new Error('User not found.');
  }
  return user.addresses;
}

/**
 * Add a new address for a user.
 * If isDefault is true, unset any existing default address.
 */
export async function addUserAddress(
  userId: string,
  addressData: CreateAddressInput,
): Promise<IAddressDocument> {
  const user = (await UserModel.findById(userId).exec()) as IUserDocument | null;
  if (!user) {
    throw new Error('User not found.');
  }

  const addressId = `addr-${Date.now()}`;

  // If setting as default, unset any existing default
  if (addressData.isDefault) {
    user.addresses.forEach((addr) => {
      addr.isDefault = false;
    });
  }

  const newAddress = {
    id: addressId,
    userId,
    name: addressData.name,
    phone: addressData.phone,
    alternatePhone: addressData.alternatePhone,
    pincode: addressData.pincode,
    locality: addressData.locality,
    street: addressData.street,
    city: addressData.city,
    state: addressData.state,
    landmark: addressData.landmark,
    type: addressData.type,
    isDefault: addressData.isDefault ?? false,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as IAddressDocument;

  user.addresses.push(newAddress);
  await user.save();

  return newAddress;
}

/**
 * Edit an existing address for a user.
 * Only the address owner can edit their own address.
 */
export async function editUserAddress(
  userId: string,
  addressId: string,
  updates: UpdateAddressInput,
): Promise<IAddressDocument | null> {
  const user = (await UserModel.findById(userId).exec()) as IUserDocument | null;
  if (!user) {
    throw new Error('User not found.');
  }

  const addressIndex = user.addresses.findIndex((addr) => addr.id === addressId);
  if (addressIndex === -1) {
    throw new Error('Address not found.');
  }

  const address = user.addresses[addressIndex];

  // Apply updates
  if (updates.name !== undefined) address.name = updates.name;
  if (updates.phone !== undefined) address.phone = updates.phone;
  if (updates.alternatePhone !== undefined) address.alternatePhone = updates.alternatePhone;
  if (updates.pincode !== undefined) address.pincode = updates.pincode;
  if (updates.locality !== undefined) address.locality = updates.locality;
  if (updates.street !== undefined) address.street = updates.street;
  if (updates.city !== undefined) address.city = updates.city;
  if (updates.state !== undefined) address.state = updates.state;
  if (updates.landmark !== undefined) address.landmark = updates.landmark;
  if (updates.type !== undefined) address.type = updates.type;
  if (updates.isDefault !== undefined) address.isDefault = updates.isDefault;

  address.updatedAt = new Date();

  // If setting as default, unset any other existing defaults
  if (address.isDefault) {
    user.addresses.forEach((addr, idx) => {
      if (idx !== addressIndex && addr.isDefault) {
        addr.isDefault = false;
      }
    });
  }

  await user.save();
  return user.addresses[addressIndex];
}

/**
 * Delete an address for a user.
 * Only the address owner can delete their own address.
 */
export async function deleteUserAddress(
  userId: string,
  addressId: string,
): Promise<boolean> {
  const user = (await UserModel.findById(userId).exec()) as IUserDocument | null;
  if (!user) {
    throw new Error('User not found.');
  }

  const initialLength = user.addresses.length;
  const deletedAddress = user.addresses.find((addr) => addr.id === addressId);
  user.addresses = user.addresses.filter((addr) => addr.id !== addressId);

  if (user.addresses.length === initialLength) {
    throw new Error('Address not found.');
  }

  // If the deleted address was default, set another as default if any exist
  if (deletedAddress?.isDefault && user.addresses.length > 0) {
    user.addresses[0].isDefault = true;
  }

  await user.save();
  return true;
}

/**
 * Set an address as the default for a user.
 */
export async function setUserDefaultAddress(
  userId: string,
  addressId: string,
): Promise<IAddressDocument | null> {
  const user = (await UserModel.findById(userId).exec()) as IUserDocument | null;
  if (!user) {
    throw new Error('User not found.');
  }

  const addressIndex = user.addresses.findIndex((addr) => addr.id === addressId);
  if (addressIndex === -1) {
    throw new Error('Address not found.');
  }

  // Unset all defaults
  user.addresses.forEach((addr) => {
    addr.isDefault = false;
  });

  // Set the selected address as default
  user.addresses[addressIndex].isDefault = true;
  user.addresses[addressIndex].updatedAt = new Date();

  await user.save();
  return user.addresses[addressIndex];
}

/**
 * Upload profile image (placeholder for Cloudinary integration).
 * Returns a mock URL for development; in production this would upload to Cloudinary.
 */
export async function uploadProfileImage(
  userId: string,
  _imageBuffer: Buffer,
  _fileName: string,
): Promise<string> {
  const user = (await UserModel.findById(userId).exec()) as IUserDocument | null;
  if (!user) {
    throw new Error('User not found.');
  }

  // In production, upload to Cloudinary using the configured credentials
  // const cloudinaryUrl = await uploadToCloudinary(imageBuffer, fileName);
  // user.avatar = cloudinaryUrl;
  // await user.save();
  // return cloudinaryUrl;

  // For development, return a placeholder
  const imageUrl = `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=80&user=${userId}`;
  user.avatar = imageUrl;
  await user.save();

  return imageUrl;
}


/**
 * Admin: list users for admin dashboard.
 * Excludes sensitive fields and supports pagination/search/role filter.
 */
export async function listUsersForAdmin(params: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
} = {}) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 20));
  const skip = (page - 1) * limit;

  const query: Record<string, any> = {};
  if (params.role) {
    const allowed = ['customer', 'vendor', 'admin', 'super_admin'];
    if (allowed.includes(params.role)) query.role = params.role;
  }
  if (params.search && params.search.trim()) {
    const sterm = params.search.trim().replace(/[.*+?^$\{\}()|[\]\\]/g, '\\$&');
    const rx = new RegExp(sterm, 'i');
    query.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }

  const [items, total] = await Promise.all([
    UserModel.find(query)
      .select('-passwordHash -emailVerificationToken -emailVerificationExpiresAt -passwordResetToken -passwordResetExpiresAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec(),
    UserModel.countDocuments(query).exec(),
  ]);

  const users = items.map((u: any) => ({
    id: String(u._id || u.id),
    name: u.name || '',
    email: u.email || '',
    phone: u.phone || '',
    role: u.role || 'customer',
    avatar: u.avatar || '',
    addresses: Array.isArray(u.addresses) ? u.addresses : [],
    defaultAddressId: u.defaultAddressId,
    isEmailVerified: !!u.isEmailVerified,
    isPhoneVerified: !!u.isPhoneVerified,
    isActive: u.isActive !== false,
    createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : undefined,
    updatedAt: u.updatedAt ? new Date(u.updatedAt).toISOString() : undefined,
    vendorApplicationStatus: u.vendorApplicationStatus,
    isVendorApproved: !!u.isVendorApproved,
  }));

  return {
    users,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1, hasMore: page * limit < total },
  };
}

export async function getUserByIdForAdmin(userId: string) {
  const u: any = await UserModel.findById(userId)
    .select('-passwordHash -emailVerificationToken -emailVerificationExpiresAt -passwordResetToken -passwordResetExpiresAt')
    .lean()
    .exec();
  if (!u) throw new Error('User not found.');
  return {
    id: String(u._id || u.id),
    name: u.name || '',
    email: u.email || '',
    phone: u.phone || '',
    role: u.role || 'customer',
    avatar: u.avatar || '',
    addresses: Array.isArray(u.addresses) ? u.addresses : [],
    defaultAddressId: u.defaultAddressId,
    isEmailVerified: !!u.isEmailVerified,
    isPhoneVerified: !!u.isPhoneVerified,
    isActive: u.isActive !== false,
    createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : undefined,
    updatedAt: u.updatedAt ? new Date(u.updatedAt).toISOString() : undefined,
    vendorApplicationStatus: u.vendorApplicationStatus,
    isVendorApproved: !!u.isVendorApproved,
  };
}


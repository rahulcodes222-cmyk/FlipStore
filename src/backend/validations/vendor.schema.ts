import { z } from 'zod';

export const vendorApplicationStatusSchema = z.enum([
  'Draft',
  'Pending',
  'Under Review',
  'Approved',
  'Rejected',
  'Suspended',
]);

const addressSchema = z.object({
  name: z.string().trim().max(100).optional(),
  phone: z.string().trim().max(20).optional(),
  pincode: z.string().trim().max(12).optional(),
  locality: z.string().trim().max(200).optional(),
  street: z.string().trim().max(300).optional(),
  city: z.string().trim().max(100).optional(),
  state: z.string().trim().max(100).optional(),
  landmark: z.string().trim().max(200).optional(),
  type: z.string().trim().max(50).optional(),
  isDefault: z.boolean().optional(),
});

const documentSchema = z.object({
  type: z.string().trim().min(1).max(50),
  fileName: z.string().trim().max(255).optional(),
  fileUrl: z.string().trim().max(2048).optional(),
  mimeType: z.string().trim().max(100).optional(),
}).refine((d) => !!d.fileUrl || !!d.fileName, {
  message: 'Document must include fileUrl or fileName.',
});

export const vendorRegisterSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().toLowerCase(),
  phone: z.string().trim().min(8).max(20),
  password: z.string().min(8).max(128),
  confirmPassword: z.string().min(8).max(128).optional(),
  businessName: z.string().trim().min(2).max(200),
  storeName: z.string().trim().min(2).max(200).optional(),
  storeSlug: z.string().trim().min(2).max(200).optional(),
  businessType: z.string().trim().min(1).max(100),
  businessCategory: z.string().trim().max(100).optional(),
  businessDescription: z.string().trim().max(1000).optional(),
  businessEmail: z.string().trim().email().optional().or(z.literal('')),
  businessPhone: z.string().trim().max(20).optional(),
  address: addressSchema.optional(),
  gstNumber: z.string().trim().max(30).optional(),
  panNumber: z.string().trim().max(30).optional(),
  bankDetails: z.object({
    accountHolderName: z.string().trim().max(100).optional(),
    bankName: z.string().trim().max(100).optional(),
    accountNumber: z.string().trim().max(30).optional(),
    ifscCode: z.string().trim().max(20).optional(),
    upiId: z.string().trim().max(100).optional(),
    branchName: z.string().trim().max(100).optional(),
  }).optional(),
  documents: z.array(documentSchema).max(10).optional(),
  submit: z.boolean().optional(), // if true move Draft -> Pending
}).refine((d) => !d.confirmPassword || d.password === d.confirmPassword, {
  message: 'Passwords do not match.',
  path: ['confirmPassword'],
});

export const vendorApplicationUpdateSchema = z.object({
  businessName: z.string().trim().min(2).max(200).optional(),
  storeName: z.string().trim().min(2).max(200).optional(),
  businessType: z.string().trim().min(1).max(100).optional(),
  businessCategory: z.string().trim().max(100).optional(),
  businessDescription: z.string().trim().max(1000).optional(),
  businessEmail: z.string().trim().email().optional().or(z.literal('')),
  businessPhone: z.string().trim().max(20).optional(),
  address: addressSchema.optional(),
  gstNumber: z.string().trim().max(30).optional(),
  panNumber: z.string().trim().max(30).optional(),
  bankDetails: z.object({
    accountHolderName: z.string().trim().max(100).optional(),
    bankName: z.string().trim().max(100).optional(),
    accountNumber: z.string().trim().max(30).optional(),
    ifscCode: z.string().trim().max(20).optional(),
    upiId: z.string().trim().max(100).optional(),
    branchName: z.string().trim().max(100).optional(),
  }).optional(),
  documents: z.array(documentSchema).max(10).optional(),
  submit: z.boolean().optional(),
});

export const vendorStoreUpdateSchema = z.object({
  storeName: z.string().trim().min(2).max(200).optional(),
  storeSlug: z.string().trim().min(2).max(200).optional(),
  description: z.string().trim().max(1000).optional(),
  storeDescription: z.string().trim().max(1000).optional(),
  logoUrl: z.string().trim().max(2048).optional(),
  storeLogo: z.string().trim().max(2048).optional(),
  bannerUrl: z.string().trim().max(2048).optional(),
  storeBanner: z.string().trim().max(2048).optional(),
  supportEmail: z.string().trim().email().optional().or(z.literal('')),
  supportPhone: z.string().trim().max(20).optional(),
  businessCategory: z.string().trim().max(100).optional(),
});

export const adminVendorStatusSchema = z.object({
  status: vendorApplicationStatusSchema,
  reason: z.string().trim().max(500).optional(),
  note: z.string().trim().max(1000).optional(),
});

export type VendorRegisterInput = z.infer<typeof vendorRegisterSchema>;
export type VendorApplicationUpdateInput = z.infer<typeof vendorApplicationUpdateSchema>;
export type VendorStoreUpdateInput = z.infer<typeof vendorStoreUpdateSchema>;
export type AdminVendorStatusInput = z.infer<typeof adminVendorStatusSchema>;

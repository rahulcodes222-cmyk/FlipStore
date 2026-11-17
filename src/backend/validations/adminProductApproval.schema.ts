import { z } from 'zod';

export const adminProductApprovalListQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: z.string().trim().optional(), // legacy/status filter compatibility
  approvalStatus: z.enum(['Draft', 'Pending Approval', 'Under Review', 'Approved', 'Rejected', 'Changes Requested']).optional(),
  productStatus: z.enum(['Active', 'Inactive']).optional(),
  category: z.string().trim().optional(),
  sellerId: z.string().trim().optional(),
  sortBy: z.enum(['newest', 'oldest', 'name_asc', 'name_desc', 'submitted_desc', 'submitted_asc']).optional().default('newest'),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  tab: z.enum(['all', 'pending', 'under_review', 'approved', 'rejected', 'changes_requested', 'draft']).optional(),
});

export const adminProductRejectSchema = z.object({
  reason: z.string().trim().min(3, 'Rejection reason is required.').max(1000),
  adminComment: z.string().trim().max(1000).optional(),
  notifySeller: z.boolean().optional().default(true),
});

export const adminProductRequestChangesSchema = z.object({
  comment: z.string().trim().min(3, 'Change request comment is required.').max(1000),
  adminComment: z.string().trim().max(1000).optional(),
  notifySeller: z.boolean().optional().default(true),
});

export const adminProductApproveSchema = z.object({
  adminComment: z.string().trim().max(1000).optional(),
  activate: z.boolean().optional().default(true),
  notifySeller: z.boolean().optional().default(true),
});

export type AdminProductApprovalListQuery = z.infer<typeof adminProductApprovalListQuerySchema>;

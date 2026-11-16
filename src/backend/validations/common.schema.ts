/**
 * Common Validation Schemas
 * Reusable schemas for pagination, IDs, and common fields.
 */

import { z } from 'zod';

/**
 * MongoDB ObjectId validation
 */
export const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format.');

/**
 * Pagination query schema
 */
export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .default('1')
    .transform((val) => Math.max(1, parseInt(val, 10) || 1)),
  limit: z
    .string()
    .optional()
    .default('10')
    .transform((val) => Math.min(100, Math.max(1, parseInt(val, 10) || 10))),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

/**
 * Export types
 */
export type PaginationInput = z.infer<typeof paginationSchema>;

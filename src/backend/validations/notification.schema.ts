import { z } from 'zod';

export const notificationListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['UNREAD', 'READ', 'PROCESSING']).optional(),
  category: z.string().trim().max(50).optional(),
  type: z.string().trim().max(80).optional(),
});

export const notificationIdParamSchema = z.object({
  id: z.string().min(1),
});

export type NotificationListQuery = z.infer<typeof notificationListQuerySchema>;

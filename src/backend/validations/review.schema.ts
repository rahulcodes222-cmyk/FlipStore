import { z } from "zod";

export const createProductReviewSchema = z.object({
  rating: z
    .number()
    .int("Rating must be a whole number.")
    .min(1, "Rating must be at least 1.")
    .max(5, "Rating must be at most 5."),
  title: z
    .string()
    .trim()
    .min(3, "Review title must be at least 3 characters.")
    .max(200, "Review title must not exceed 200 characters."),
  comment: z
    .string()
    .trim()
    .min(10, "Review comment must be at least 10 characters.")
    .max(2000, "Review comment must not exceed 2000 characters."),
  images: z.array(z.string().trim().min(1)).max(5).optional().default([]),
  orderId: z.string().trim().min(1).optional(),
});

export const productReviewParamsSchema = z.object({
  id: z.string().min(1, "Product ID is required."),
});

export type CreateProductReviewInput = z.infer<typeof createProductReviewSchema>;

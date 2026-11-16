/**
 * Slug Utility
 * Generates URL-friendly slugs from product/category names.
 */

/**
 * Convert a string to a URL-friendly slug.
 * Lowercases, trims, replaces spaces/special chars with hyphens,
 * and removes consecutive hyphens.
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters except word chars, spaces, hyphens
    .replace(/[\s_-]+/g, '-') // Replace spaces, underscores, multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .substring(0, 200); // Truncate to 200 chars
}

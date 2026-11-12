import { APP_CONFIG } from "@/lib/theme";

/**
 * Formats a number to Indian Rupee currency format (e.g., ₹1,49,999)
 */
export function formatPrice(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return `${APP_CONFIG.currency.symbol}0`;
  }
  const formatted = new Intl.NumberFormat(APP_CONFIG.currency.locale, {
    maximumFractionDigits: 0,
  }).format(amount);

  return `${APP_CONFIG.currency.symbol}${formatted}`;
}

/**
 * Calculates percentage discount between MRP and selling price
 */
export function calculateDiscount(mrp: number, price: number): number {
  if (!mrp || mrp <= price) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
}

/**
 * Calculates total savings
 */
export function calculateSavings(mrp: number, price: number): number {
  if (!mrp || mrp <= price) return 0;
  return mrp - price;
}

/**
 * Formats date into readable Indian e-commerce style (e.g., "15 Nov, 2026")
 */
export function formatDate(dateString: string | Date): string {
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  return new Intl.DateTimeFormat(APP_CONFIG.currency.locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

/**
 * Formats delivery date estimate (e.g., "Delivery by Tomorrow, 11 PM" or "Delivery by Sun, 15 Nov")
 */
export function formatDeliveryDate(daysFromNow: number = 2): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);

  if (daysFromNow === 1) {
    return "Delivery by Tomorrow";
  }

  const dayName = new Intl.DateTimeFormat(APP_CONFIG.currency.locale, { weekday: "short" }).format(date);
  const formattedDate = new Intl.DateTimeFormat(APP_CONFIG.currency.locale, { day: "numeric", month: "short" }).format(date);
  return `Delivery by ${dayName}, ${formattedDate}`;
}

/**
 * Truncate long strings with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
}

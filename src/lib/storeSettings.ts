/**
 * Store Settings Helper
 * Reads store-wide settings saved by the admin Settings page from localStorage.
 * Same storage key as adminService: flipstore_admin_settings_v1
 */

export interface StoreSettings {
  storeName: string;
  supportEmail: string;
  supportPhone: string;
  currency: string;
  taxPercentage: number;
  freeDeliveryThreshold: number;
  standardDeliveryCharge: number;
  maintenanceMode: boolean;
  announcementBanner: string;
  aboutUsContent: string;
}

const SETTINGS_KEY = "flipstore_admin_settings_v1";

const DEFAULT_SETTINGS: StoreSettings = {
  storeName: "FlipStore India",
  supportEmail: "support@flipstore.in",
  supportPhone: "+91 1800 208 9898",
  currency: "INR",
  taxPercentage: 18,
  freeDeliveryThreshold: 499,
  standardDeliveryCharge: 40,
  maintenanceMode: false,
  announcementBanner: "",
  aboutUsContent: "",
};

/**
 * Currency code to symbol mapping
 */
const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CAD: "C$",
  AUD: "A$",
  SGD: "S$",
  AED: "د.إ",
  SAR: "ر.س",
};

/**
 * Read stored settings from localStorage (SSR-safe)
 */
export function getStoreSettings(): StoreSettings | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return { ...DEFAULT_SETTINGS, ...parsed } as StoreSettings;
  } catch {
    return null;
  }
}

/**
 * Get the currency symbol for the configured currency code
 */
export function getCurrencySymbol(): string {
  const settings = getStoreSettings();
  const code = settings?.currency || DEFAULT_SETTINGS.currency;
  return CURRENCY_SYMBOLS[code] || (code === "INR" ? "₹" : code);
}

/**
 * Get the store name from settings
 */
export function getStoreName(): string {
  const settings = getStoreSettings();
  return settings?.storeName || DEFAULT_SETTINGS.storeName;
}

/**
 * Get support email from settings
 */
export function getSupportEmail(): string {
  const settings = getStoreSettings();
  return settings?.supportEmail || DEFAULT_SETTINGS.supportEmail;
}

/**
 * Get support phone from settings
 */
export function getSupportPhone(): string {
  const settings = getStoreSettings();
  return settings?.supportPhone || DEFAULT_SETTINGS.supportPhone;
}

/**
 * Get tax percentage from settings
 */
export function getTaxPercentage(): number {
  const settings = getStoreSettings();
  return settings?.taxPercentage ?? DEFAULT_SETTINGS.taxPercentage;
}

/**
 * Get standard delivery charge from settings
 */
export function getStandardDeliveryCharge(): number {
  const settings = getStoreSettings();
  return settings?.standardDeliveryCharge ?? DEFAULT_SETTINGS.standardDeliveryCharge;
}

/**
 * Get free delivery threshold from settings
 */
export function getFreeDeliveryThreshold(): number {
  const settings = getStoreSettings();
  return settings?.freeDeliveryThreshold ?? DEFAULT_SETTINGS.freeDeliveryThreshold;
}

/**
 * Get announcement banner from settings
 */
export function getAnnouncementBanner(): string {
  const settings = getStoreSettings();
  return settings?.announcementBanner || DEFAULT_SETTINGS.announcementBanner;
}

/**
 * Check if maintenance mode is enabled
 */
export function isMaintenanceMode(): boolean {
  const settings = getStoreSettings();
  return settings?.maintenanceMode ?? DEFAULT_SETTINGS.maintenanceMode;
}

/**
 * Get the About Us page content from settings
 */
export function getAboutUsContent(): string {
  const settings = getStoreSettings();
  return settings?.aboutUsContent || DEFAULT_SETTINGS.aboutUsContent;
}
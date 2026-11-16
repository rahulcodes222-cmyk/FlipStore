/**
 * HTTP Status Code Constants
 */

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

export type HttpStatusCode = (typeof HTTP_STATUS)[keyof typeof HTTP_STATUS];

/**
 * Standard API Response Messages
 */

export const RESPONSE_MESSAGES = {
  SUCCESS: 'Request successful.',
  CREATED: 'Resource created successfully.',
  UPDATED: 'Resource updated successfully.',
  DELETED: 'Resource deleted successfully.',
  NO_CONTENT: 'No content to return.',
  BAD_REQUEST: 'Invalid request parameters.',
  UNAUTHORIZED: 'Authentication required.',
  FORBIDDEN: 'Insufficient permissions.',
  NOT_FOUND: 'Resource not found.',
  CONFLICT: 'Resource conflict.',
  VALIDATION_ERROR: 'Validation failed.',
  INTERNAL_SERVER_ERROR: 'Internal server error.',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable.',
  EMAIL_ALREADY_EXISTS: 'An account with this email already exists.',
  PHONE_ALREADY_EXISTS: 'An account with this phone number already exists.',
  INVALID_CREDENTIALS: 'Invalid email or password.',
  TOKEN_EXPIRED: 'Session expired. Please log in again.',
  TOKEN_INVALID: 'Invalid or malformed token.',
  PASSWORD_MISMATCH: 'Passwords do not match.',
  ACCOUNT_NOT_FOUND: 'Account not found.',
} as const;

/**
 * Vendor onboarding statuses (Part 11)
 */
export const VENDOR_APPLICATION_STATUSES = [
  'Draft',
  'Pending',
  'Under Review',
  'Approved',
  'Rejected',
  'Suspended',
] as const;

export type VendorApplicationStatus = (typeof VENDOR_APPLICATION_STATUSES)[keyof typeof VENDOR_APPLICATION_STATUSES & number];

export function normalizeVendorApplicationStatus(status?: string | null): VendorApplicationStatus {
  if (!status) return 'Draft';
  const normalized = status.trim().toLowerCase().replace(/[_-]+/g, ' ');
  if (normalized === 'draft') return 'Draft';
  if (normalized === 'pending' || normalized === 'pending review') return 'Pending';
  if (normalized === 'under review' || normalized === 'review') return 'Under Review';
  if (normalized === 'approved' || normalized === 'verified') return 'Approved';
  if (normalized === 'rejected') return 'Rejected';
  if (normalized === 'suspended') return 'Suspended';
  return 'Draft';
}

export function canVendorAccessDashboard(status?: string | null): boolean {
  return normalizeVendorApplicationStatus(status) === 'Approved';
}

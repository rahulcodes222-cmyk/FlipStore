/**
 * User Role Constants
 * Multi-role e-commerce platform: Customer, Vendor, Admin, Super Admin
 */

export const USER_ROLES = {
  CUSTOMER: 'customer',
  VENDOR: 'vendor',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const ROLE_LABELS: Record<UserRole, string> = {
  [USER_ROLES.CUSTOMER]: 'Customer',
  [USER_ROLES.VENDOR]: 'Vendor / Seller',
  [USER_ROLES.ADMIN]: 'Administrator',
  [USER_ROLES.SUPER_ADMIN]: 'Super Administrator',
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  [USER_ROLES.CUSTOMER]: 'Can browse products, place orders, and manage own profile.',
  [USER_ROLES.VENDOR]: 'Can manage own store, products, inventory, orders, and earnings.',
  [USER_ROLES.ADMIN]: 'Can manage vendors, products, orders, coupons, and platform settings.',
  [USER_ROLES.SUPER_ADMIN]: 'Full platform access including admin management and system configuration.',
};

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [USER_ROLES.CUSTOMER]: 1,
  [USER_ROLES.VENDOR]: 2,
  [USER_ROLES.ADMIN]: 3,
  [USER_ROLES.SUPER_ADMIN]: 4,
};

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  [USER_ROLES.CUSTOMER]: [
    'products:read',
    'orders:read:own',
    'orders:create:own',
    'profile:read:own',
    'profile:update:own',
    'wishlist:read:own',
    'wishlist:write:own',
    'cart:read:own',
    'cart:write:own',
  ],
  [USER_ROLES.VENDOR]: [
    'products:read',
    'products:write:own',
    'products:delete:own',
    'inventory:read:own',
    'inventory:write:own',
    'orders:read:own',
    'orders:update:own',
    'earnings:read:own',
    'coupons:read:own',
    'coupons:write:own',
    'coupons:delete:own',
    'profile:read:own',
    'profile:update:own',
    'store:read:own',
    'store:write:own',
    'returns:read:own',
    'returns:update:own',
    'reviews:read:own',
  ],
  [USER_ROLES.ADMIN]: [
    'products:read',
    'products:write',
    'products:delete',
    'categories:read',
    'categories:write',
    'categories:delete',
    'brands:read',
    'brands:write',
    'brands:delete',
    'vendors:read',
    'vendors:write',
    'vendors:update',
    'orders:read',
    'orders:update',
    'orders:cancel',
    'coupons:read',
    'coupons:write',
    'coupons:delete',
    'returns:read',
    'returns:update',
    'reviews:read',
    'reviews:moderate',
    'analytics:read',
    'profile:read:own',
    'profile:update:own',
  ],
  [USER_ROLES.SUPER_ADMIN]: [
    '*', // All permissions
  ],
};

export const ROUTE_ACCESS: Record<string, UserRole[]> = {
  '/api/v1/auth/register': [USER_ROLES.CUSTOMER, USER_ROLES.VENDOR],
  '/api/v1/auth/login': [USER_ROLES.CUSTOMER, USER_ROLES.VENDOR, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN],
  '/api/v1/auth/logout': [USER_ROLES.CUSTOMER, USER_ROLES.VENDOR, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN],
  '/api/v1/auth/me': [USER_ROLES.CUSTOMER, USER_ROLES.VENDOR, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN],
};

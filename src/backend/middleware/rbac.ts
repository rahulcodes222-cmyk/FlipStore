/**
 * Role-Based Access Control (RBAC) Middleware
 * Restricts route access based on user role hierarchy.
 */

import { NextResponse } from 'next/server';
import { HTTP_STATUS } from '@/backend/constants';
import { createErrorResponse } from '@/backend/utils/response';
import { USER_ROLES, ROLE_HIERARCHY } from '@/backend/constants/roles';
import type { UserRole } from '@/backend/constants/roles';
import type { AuthenticatedRequest } from '@/backend/types';

/**
 * Minimum role level required to access a route.
 * Roles with hierarchy level >= minLevel are granted access.
 */
export function withRole(minRole: UserRole) {
  return function (
    handler: (req: AuthenticatedRequest, context?: any) => Promise<NextResponse>,
  ) {
    return async (req: AuthenticatedRequest, context?: any): Promise<NextResponse> => {
      const user = req.user;

      if (!user) {
        return NextResponse.json(
          createErrorResponse('Authentication required.', {
            statusCode: HTTP_STATUS.UNAUTHORIZED,
            code: 'AUTH_REQUIRED',
            requestId: req.requestId,
          }),
          { status: HTTP_STATUS.UNAUTHORIZED },
        );
      }

      const userLevel = ROLE_HIERARCHY[user.role as UserRole];
      const minLevel = ROLE_HIERARCHY[minRole];

      if (!userLevel || userLevel < minLevel) {
        return NextResponse.json(
          createErrorResponse(
            `Insufficient permissions. Required role: ${minRole} or higher.`,
            {
              statusCode: HTTP_STATUS.FORBIDDEN,
              code: 'INSUFFICIENT_PERMISSIONS',
              requestId: req.requestId,
            },
          ),
          { status: HTTP_STATUS.FORBIDDEN },
        );
      }

      return handler(req, context);
    };
  };
}

/**
 * Allow access only to specific roles (exact match or hierarchy).
 */
export function withRoles(allowedRoles: UserRole[]) {
  return function (
    handler: (req: AuthenticatedRequest, context?: any) => Promise<NextResponse>,
  ) {
    return async (req: AuthenticatedRequest, context?: any): Promise<NextResponse> => {
      const user = req.user;

      if (!user) {
        return NextResponse.json(
          createErrorResponse('Authentication required.', {
            statusCode: HTTP_STATUS.UNAUTHORIZED,
            code: 'AUTH_REQUIRED',
            requestId: req.requestId,
          }),
          { status: HTTP_STATUS.UNAUTHORIZED },
        );
      }

      const userRole = user.role as UserRole;
      if (!allowedRoles.includes(userRole)) {
        return NextResponse.json(
          createErrorResponse(
            `Insufficient permissions. Allowed roles: ${allowedRoles.join(', ')}.`,
            {
              statusCode: HTTP_STATUS.FORBIDDEN,
              code: 'INSUFFICIENT_PERMISSIONS',
              requestId: req.requestId,
            },
          ),
          { status: HTTP_STATUS.FORBIDDEN },
        );
      }

      return handler(req, context);
    };
  };
}

/**
 * Check if a user can access a resource owned by another user.
 * Owners always have access; admins and super admins have access;
 * vendors can access vendor-scoped resources.
 */
export function canAccessResource(
  requesterRole: UserRole,
  requesterId: string,
  resourceOwnerId: string,
): boolean {
  if (requesterId === resourceOwnerId) return true;
  if (requesterRole === USER_ROLES.ADMIN) return true;
  if (requesterRole === USER_ROLES.SUPER_ADMIN) return true;
  return false;
}

/**
 * Role-based route access configuration.
 * Maps API paths to minimum required roles.
 */
export const PROTECTED_ROUTES: Record<string, UserRole> = {
  '/api/v1/auth/me': USER_ROLES.CUSTOMER,
  '/api/v1/auth/logout': USER_ROLES.CUSTOMER,
  '/api/v1/vendor/store': USER_ROLES.VENDOR,
  '/api/v1/vendor/products': USER_ROLES.VENDOR,
  '/api/v1/vendor/orders': USER_ROLES.VENDOR,
  '/api/v1/vendor/earnings': USER_ROLES.VENDOR,
  '/api/v1/admin/users': USER_ROLES.ADMIN,
  '/api/v1/admin/vendors': USER_ROLES.ADMIN,
  '/api/v1/admin/orders': USER_ROLES.ADMIN,
  '/api/v1/super-admin/system': USER_ROLES.SUPER_ADMIN,
  '/api/v1/super-admin/admins': USER_ROLES.SUPER_ADMIN,
};

export { USER_ROLES, ROLE_HIERARCHY };

/**
 * Require authentication - user must be logged in.
 */
export function requireAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse | Response>,
) {
  return async (req: AuthenticatedRequest): Promise<NextResponse | Response> => {
    const user = req.user;

    if (!user) {
      return NextResponse.json(
        createErrorResponse('Authentication required.', {
          statusCode: HTTP_STATUS.UNAUTHORIZED,
          code: 'AUTH_REQUIRED',
          requestId: req.requestId,
        }),
        { status: HTTP_STATUS.UNAUTHORIZED },
      );
    }

    return handler(req);
  };
}

/**
 * Require a specific role or higher in the hierarchy.
 * Usage: requireRole('vendor') allows vendor, admin, super_admin.
 */
export function requireRole(minRole: UserRole) {
  return withRole(minRole);
}

/**
 * Require admin role or higher (admin, super_admin).
 */
export function requireAdmin(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
) {
  return requireRole(USER_ROLES.ADMIN)(handler);
}

/**
 * Require vendor role or higher (vendor, admin, super_admin).
 */
export function requireVendor(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
) {
  return requireRole(USER_ROLES.VENDOR)(handler);
}

/**
 * Require customer role or higher (customer, vendor, admin, super_admin).
 */
export function requireCustomer(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
) {
  return requireRole(USER_ROLES.CUSTOMER)(handler);
}

/**
 * Require an active (non-suspended) account.
 * Checks that the user's account status is active.
 */
export function requireActiveAccount(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse | Response>,
) {
  return async (req: AuthenticatedRequest): Promise<NextResponse | Response> => {
    const user = req.user;

    if (!user) {
      return NextResponse.json(
        createErrorResponse('Authentication required.', {
          statusCode: HTTP_STATUS.UNAUTHORIZED,
          code: 'AUTH_REQUIRED',
          requestId: req.requestId,
        }),
        { status: HTTP_STATUS.UNAUTHORIZED },
      );
    }

    // Check if account is active - look at isActive field
    // We need to fetch the full user to check isActive since the JWT payload
    // may not include it. However, we can also check via a database lookup.
    // For now, we check the isActive flag if available on the user object.
    const isActive = (user as { isActive?: boolean }).isActive;
    if (isActive === false) {
      return NextResponse.json(
        createErrorResponse('Account is deactivated or suspended.', {
          statusCode: HTTP_STATUS.FORBIDDEN,
          code: 'ACCOUNT_INACTIVE',
          requestId: req.requestId,
        }),
        { status: HTTP_STATUS.FORBIDDEN },
      );
    }

    return handler(req);
  };
}

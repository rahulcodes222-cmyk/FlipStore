import { NextRequest, NextResponse } from 'next/server';
import { withDatabase } from '@/backend/middleware/connectDb';
import { withAuth, type AuthenticatedRequest } from '@/backend/middleware/auth';
import { createSuccessResponse, createErrorResponse } from '@/backend/utils/response';
import { HTTP_STATUS } from '@/backend/constants';
import { notificationListQuerySchema } from '@/backend/validations/notification.schema';
import { listNotificationsForUser, markAllNotificationsRead, markNotificationRead, deleteNotificationForUser } from '@/backend/services/notificationService';

function toNext(req: AuthenticatedRequest): NextRequest { return req as unknown as NextRequest; }

export const notificationsGET = withDatabase(withAuth(async (req: AuthenticatedRequest) => {
  if (!req.user) return NextResponse.json(createErrorResponse('Authentication required.', { statusCode: HTTP_STATUS.UNAUTHORIZED, code: 'AUTH_REQUIRED' }), { status: HTTP_STATUS.UNAUTHORIZED });
  const params = Object.fromEntries(new URL(toNext(req).url).searchParams.entries());
  const parsed = notificationListQuerySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json(createErrorResponse('Invalid query parameters.', { statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY, code: 'VALIDATION_ERROR', details: parsed.error.flatten().fieldErrors as Record<string, string[]> }), { status: HTTP_STATUS.UNPROCESSABLE_ENTITY });
  }
  try {
    const result = await listNotificationsForUser(req.user.id, req.user.role, parsed.data as any);
    return NextResponse.json(createSuccessResponse(result.data, { message: 'Notifications fetched.', meta: { ...result.pagination, unreadCount: result.unreadCount } as any }), { status: HTTP_STATUS.OK });
  } catch (error: any) {
    return NextResponse.json(createErrorResponse(error?.message || 'Failed to fetch notifications.', { statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR, code: 'NOTIFICATIONS_FETCH_FAILED' }), { status: HTTP_STATUS.INTERNAL_SERVER_ERROR });
  }
}));

export const notificationsMarkAllReadPATCH = withDatabase(withAuth(async (req: AuthenticatedRequest) => {
  if (!req.user) return NextResponse.json(createErrorResponse('Authentication required.', { statusCode: HTTP_STATUS.UNAUTHORIZED, code: 'AUTH_REQUIRED' }), { status: HTTP_STATUS.UNAUTHORIZED });
  try {
    const result = await markAllNotificationsRead(req.user.id, req.user.role);
    return NextResponse.json(createSuccessResponse(result, { message: 'All notifications marked as read.' }), { status: HTTP_STATUS.OK });
  } catch (error: any) {
    return NextResponse.json(createErrorResponse(error?.message || 'Failed to mark notifications as read.', { statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR, code: 'NOTIFICATIONS_UPDATE_FAILED' }), { status: HTTP_STATUS.INTERNAL_SERVER_ERROR });
  }
}));

export const notificationReadPATCH = withDatabase(withAuth(async (req: AuthenticatedRequest, context?: { params: Promise<{ id: string }> }) => {
  if (!req.user) return NextResponse.json(createErrorResponse('Authentication required.', { statusCode: HTTP_STATUS.UNAUTHORIZED, code: 'AUTH_REQUIRED' }), { status: HTTP_STATUS.UNAUTHORIZED });
  const { id } = (await context?.params) || { id: '' };
  try {
    const n = await markNotificationRead(req.user.id, req.user.role, id);
    if (!n) return NextResponse.json(createErrorResponse('Notification not found.', { statusCode: HTTP_STATUS.NOT_FOUND, code: 'NOT_FOUND' }), { status: HTTP_STATUS.NOT_FOUND });
    return NextResponse.json(createSuccessResponse({ id: String((n as any)._id), status: (n as any).status, readAt: (n as any).readAt }, { message: 'Notification marked as read.' }), { status: HTTP_STATUS.OK });
  } catch (error: any) {
    return NextResponse.json(createErrorResponse(error?.message || 'Failed to update notification.', { statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR, code: 'NOTIFICATION_UPDATE_FAILED' }), { status: HTTP_STATUS.INTERNAL_SERVER_ERROR });
  }
}));

export const notificationDELETE = withDatabase(withAuth(async (req: AuthenticatedRequest, context?: { params: Promise<{ id: string }> }) => {
  if (!req.user) return NextResponse.json(createErrorResponse('Authentication required.', { statusCode: HTTP_STATUS.UNAUTHORIZED, code: 'AUTH_REQUIRED' }), { status: HTTP_STATUS.UNAUTHORIZED });
  const { id } = (await context?.params) || { id: '' };
  try {
    const ok = await deleteNotificationForUser(req.user.id, req.user.role, id);
    if (!ok) return NextResponse.json(createErrorResponse('Notification not found.', { statusCode: HTTP_STATUS.NOT_FOUND, code: 'NOT_FOUND' }), { status: HTTP_STATUS.NOT_FOUND });
    return NextResponse.json(createSuccessResponse(null, { message: 'Notification deleted.' }), { status: HTTP_STATUS.OK });
  } catch (error: any) {
    return NextResponse.json(createErrorResponse(error?.message || 'Failed to delete notification.', { statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR, code: 'NOTIFICATION_DELETE_FAILED' }), { status: HTTP_STATUS.INTERNAL_SERVER_ERROR });
  }
}));

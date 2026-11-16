/**
 * GET /api/v1/users/profile - Get current user profile
 * PATCH /api/v1/users/profile - Update user profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { profileGET, profilePATCH } from '@/backend/controllers/userController';

export async function GET(req: NextRequest): Promise<NextResponse> {
  return (await profileGET(req)) as NextResponse;
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  return (await profilePATCH(req)) as NextResponse;
}

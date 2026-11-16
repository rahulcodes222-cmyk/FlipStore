/**
 * PATCH /api/v1/categories/:id - Update a category (admin only)
 * DELETE /api/v1/categories/:id - Delete a category (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { categoryIdPATCH, categoryIdDELETE } from '@/backend/controllers/categoryController';

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  return (await categoryIdPATCH(req)) as NextResponse;
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  return (await categoryIdDELETE(req)) as NextResponse;
}

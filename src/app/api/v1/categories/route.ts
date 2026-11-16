/**
 * GET /api/v1/categories - List categories with filtering and pagination
 * POST /api/v1/categories - Create a new category (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { GET as categoriesListHandler, POST as categoriesCreateHandler } from '@/backend/controllers/categoryController';

export async function GET(req: NextRequest): Promise<NextResponse> {
  return (await categoriesListHandler(req)) as NextResponse;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  return (await categoriesCreateHandler(req)) as NextResponse;
}

/**
 * GET /api/v1/products - List products with filtering, sorting, pagination
 * POST /api/v1/products - Create a new product (vendor or admin)
 */

import { NextRequest, NextResponse } from 'next/server';
import { GET as productsListHandler, POST as productsCreateHandler } from '@/backend/controllers/productController';

export async function GET(req: NextRequest): Promise<NextResponse> {
  return (await productsListHandler(req)) as NextResponse;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  return (await productsCreateHandler(req)) as NextResponse;
}

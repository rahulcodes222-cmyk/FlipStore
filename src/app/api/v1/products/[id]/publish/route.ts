/**
 * PATCH /api/v1/products/:id/publish - Publish or unpublish a product
 */

import { NextRequest, NextResponse } from 'next/server';
import { productIdPublishPATCH } from '@/backend/controllers/productController';

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  return (await productIdPublishPATCH(req)) as NextResponse;
}

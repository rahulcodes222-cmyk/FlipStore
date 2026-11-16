/**
 * GET /api/v1/users/addresses - Get all addresses
 * POST /api/v1/users/addresses - Add a new address
 */

import { NextRequest, NextResponse } from 'next/server';
import { addressesGET, addressesPOST } from '@/backend/controllers/userController';

export async function GET(req: NextRequest): Promise<NextResponse> {
  return (await addressesGET(req)) as NextResponse;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  return (await addressesPOST(req)) as NextResponse;
}

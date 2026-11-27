import { NextRequest, NextResponse } from 'next/server';
import { StaticPageModel } from '@/backend/models';
import { z } from 'zod';

const staticPageSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200).optional(),
  content: z.string().min(1, 'Content is required').optional(),
  image: z.string().max(2000).optional().or(z.literal('')),
  images: z.array(z.string().max(2000)).max(20).optional(),
  isActive: z.boolean().optional(),
});

export async function GET(req: NextRequest, context: { params: Promise<{ slug: string }> }): Promise<NextResponse> {
  try {
    const { slug } = (await context.params) || {};
    const doc = await StaticPageModel.findOne({ slug }).lean().exec();
    if (!doc) {
      return NextResponse.json(
        { success: false, message: 'Static page not found.' },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { success: true, data: doc },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { success: false, message: 'Failed to fetch static page.' },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ slug: string }> }): Promise<NextResponse> {
  try {
    const { slug } = (await context.params) || {};
    const body = await req.json();
    const parsed = staticPageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: 'Invalid request body.', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const doc = await StaticPageModel.findOneAndUpdate(
      { slug },
      { $set: parsed.data },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).exec();

    return NextResponse.json(
      { success: true, data: doc },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { success: false, message: 'Failed to update static page.' },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ slug: string }> }): Promise<NextResponse> {
  try {
    const { slug } = (await context.params) || {};
    const doc = await StaticPageModel.findOneAndDelete({ slug }).exec();
    if (!doc) {
      return NextResponse.json(
        { success: false, message: 'Static page not found.' },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { success: true, message: 'Static page deleted.' },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { success: false, message: 'Failed to delete static page.' },
      { status: 500 },
    );
  }
}

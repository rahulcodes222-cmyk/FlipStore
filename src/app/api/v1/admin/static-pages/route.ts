import { NextRequest, NextResponse } from 'next/server';
import { StaticPageModel } from '@/backend/models';
import { z } from 'zod';

const staticPageSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  content: z.string().min(1, 'Content is required'),
  image: z.string().max(2000).optional().or(z.literal('')),
  images: z.array(z.string().max(2000)).max(20).optional(),
  isActive: z.boolean().default(true),
});

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const docs = await StaticPageModel.find().sort({ updatedAt: -1 }).lean().exec();
    return NextResponse.json({ success: true, data: docs }, { status: 200 });
  } catch {
    return NextResponse.json(
      { success: false, message: 'Failed to fetch static pages.' },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const parsed = staticPageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: 'Invalid request body.', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { title, content, image, images, isActive } = parsed.data;
    const slug = String(title)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const existing = await StaticPageModel.findOne({ slug }).exec();
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'A page with this slug already exists.' },
        { status: 400 },
      );
    }

    const doc = await StaticPageModel.create({
      slug,
      title,
      content,
      image: image || '',
      images: Array.isArray(images) ? images.filter(Boolean) : [],
      isActive,
    });

    return NextResponse.json(
      { success: true, data: doc },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { success: false, message: 'Failed to create static page.' },
      { status: 500 },
    );
  }
}

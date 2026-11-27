import { NextRequest, NextResponse } from 'next/server';
import { StaticPageModel } from '@/backend/models';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> },
): Promise<NextResponse> {
  try {
    const { slug } = (await context?.params) || {};
    const doc = await StaticPageModel.findOne({ slug, isActive: true }).lean().exec();
    if (!doc) {
      return NextResponse.json(
        { success: false, message: 'Page not found.' },
        { status: 404 },
      );
    }
    return NextResponse.json(
      {
        success: true,
        data: {
          ...doc,
          image: typeof (doc as any).image === 'string' ? (doc as any).image : '',
          images: Array.isArray((doc as any).images) ? (doc as any).images.filter((x: any) => typeof x === 'string') : [],
        },
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { success: false, message: 'Failed to fetch static page.' },
      { status: 500 },
    );
  }
}

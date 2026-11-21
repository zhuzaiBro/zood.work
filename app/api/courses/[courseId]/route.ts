import { NextRequest } from 'next/server';
import { proxyPlatform } from '@/lib/platform/proxy';

type Params = { params: Promise<{ courseId: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { courseId } = await params;
  return proxyPlatform(request, `/api/platform/courses/${courseId}`);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { courseId } = await params;
  return proxyPlatform(request, `/api/platform/courses/${courseId}`);
}

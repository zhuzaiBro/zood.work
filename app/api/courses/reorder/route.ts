import { NextRequest, NextResponse } from 'next/server';
import { platformServer } from '@/lib/platform/server';
import { platformErrorResponse } from '@/lib/platform/proxy';

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const orderedCourseIds = Array.isArray(body.orderedCourseIds) ? body.orderedCourseIds : [];
    await platformServer('/api/platform/admin/reorder', {
      method: 'POST',
      body: { resource: 'courses', ids: orderedCourseIds },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return platformErrorResponse(error);
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { platformServer } from '@/lib/platform/server';
import { platformErrorResponse } from '@/lib/platform/proxy';

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const orderedLessonIds = Array.isArray(body.orderedLessonIds) ? body.orderedLessonIds : body.ids;
    await platformServer('/api/platform/admin/reorder', {
      method: 'POST',
      body: { resource: 'lessons', ids: orderedLessonIds },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return platformErrorResponse(error);
  }
}
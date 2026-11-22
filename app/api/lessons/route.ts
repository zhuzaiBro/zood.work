import { NextRequest, NextResponse } from 'next/server';
import { platformServer } from '@/lib/platform/server';
import { platformErrorResponse } from '@/lib/platform/proxy';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const lesson = await platformServer('/api/platform/admin/lessons', {
      method: 'POST',
      body,
    });
    return NextResponse.json(lesson);
  } catch (error) {
    return platformErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const id = typeof body.id === 'string' ? body.id : '';
    const lesson = await platformServer(`/api/platform/admin/lessons/${id}`, {
      method: 'PATCH',
      body,
    });
    return NextResponse.json(lesson);
  } catch (error) {
    return platformErrorResponse(error);
  }
}

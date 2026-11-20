import { NextRequest, NextResponse } from 'next/server';
import { platformServer } from '@/lib/platform/server';
import { platformErrorResponse } from '@/lib/platform/proxy';

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = typeof body.userId === 'string' ? body.userId.trim() : '';
    const profile = await platformServer(`/api/platform/admin/users/${userId}/membership`, {
      method: 'PATCH',
      body,
    });
    return NextResponse.json(profile);
  } catch (error) {
    return platformErrorResponse(error);
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { platformServer } from '@/lib/platform/server';
import { platformErrorResponse } from '@/lib/platform/proxy';

async function forward(request: NextRequest, method: string) {
  const body = await request.json();
  const id = typeof body.id === 'string' ? body.id : '';
  const path = method === 'POST'
    ? '/api/platform/admin/chapters'
    : `/api/platform/admin/chapters/${id}`;
  return platformServer(path, { method, body });
}

export async function POST(request: NextRequest) {
  try {
    return NextResponse.json(await forward(request, 'POST'));
  } catch (error) {
    return platformErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    return NextResponse.json(await forward(request, 'PATCH'));
  } catch (error) {
    return platformErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const id = typeof body.id === 'string' ? body.id : '';
    return NextResponse.json(await platformServer(`/api/platform/admin/chapters/${id}`, { method: 'DELETE' }));
  } catch (error) {
    return platformErrorResponse(error);
  }
}

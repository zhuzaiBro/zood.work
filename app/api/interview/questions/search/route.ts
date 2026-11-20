import { NextRequest, NextResponse } from 'next/server';
import { platformPublic } from '@/lib/platform/client';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim() ?? '';

  if (!q) {
    return NextResponse.json({ questions: [] });
  }

  if (q.length > 100) {
    return NextResponse.json({ error: '搜索关键词过长' }, { status: 400 });
  }

  let data: Array<{
    id: string;
    title: string;
    content: string | null;
    difficulty: string | null;
    is_vip: boolean | null;
    collection_id: string | null;
    interview_collections: { title: string } | null;
  }> = [];
  try {
    const result = await platformPublic<{ questions: typeof data }>(
      `/api/platform/interview/questions/search?q=${encodeURIComponent(q)}`,
    );
    data = result.questions ?? [];
  } catch (error) {
    const message = error instanceof Error ? error.message : '搜索面试题失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const keywords = q.toLowerCase().split(/\s+/).filter(Boolean);
  const questions = (data ?? [])
    .filter((item) => {
      if (keywords.length <= 1) return true;
      const haystack = `${item.title}\n${item.content ?? ''}`.toLowerCase();
      return keywords.every((keyword) => haystack.includes(keyword));
    })
    .map((item) => {
      const collection = item.interview_collections as { title: string } | null;
      return {
        id: item.id,
        title: item.title,
        difficulty: item.difficulty,
        is_vip: item.is_vip,
        collection_id: item.collection_id,
        collection_title: collection?.title ?? null,
        excerpt: buildExcerpt(item.title, item.content, q),
      };
    });

  return NextResponse.json({ questions });
}

function buildExcerpt(title: string, content: string | null, query: string) {
  const plain = (content ?? '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#>*_\-\[\]()!`]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!plain) return '';

  const lowerPlain = plain.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const matchIndex = lowerPlain.indexOf(lowerQuery);

  if (matchIndex >= 0) {
    const start = Math.max(0, matchIndex - 40);
    const end = Math.min(plain.length, matchIndex + lowerQuery.length + 80);
    const snippet = plain.slice(start, end).trim();
    return `${start > 0 ? '…' : ''}${snippet}${end < plain.length ? '…' : ''}`;
  }

  const titleHit = title.toLowerCase().includes(lowerQuery);
  if (titleHit) {
    return plain.slice(0, 120) + (plain.length > 120 ? '…' : '');
  }

  return plain.slice(0, 120) + (plain.length > 120 ? '…' : '');
}

import type { Database } from '@/types/database.types';

export type DirectoryCollection = Pick<
  Database['public']['Tables']['interview_collections']['Row'],
  'id' | 'title' | 'description' | 'created_at' | 'icon'
>;
export type CountedCollection = DirectoryCollection & { questionCount: number };

function getQuestionCounts(payload: unknown) {
  const counts = new Map<string, number>();
  if (!payload || typeof payload !== 'object') return counts;

  for (const [key, value] of Object.entries(payload)) {
    const row = value && typeof value === 'object' ? value as Record<string, unknown> : null;
    const id = Array.isArray(payload) ? row?.collection_id ?? row?.id : key;
    const rawCount = row ? row.count ?? row.question_count ?? row.total : value;
    const count = typeof rawCount === 'string' ? Number(rawCount) : rawCount;
    if (typeof id === 'string' && typeof count === 'number' && Number.isSafeInteger(count) && count > 0) {
      counts.set(id, count);
    }
  }
  return counts;
}

export function buildInterviewDirectory(collections: DirectoryCollection[], questionCounts: unknown) {
  const counts = getQuestionCounts(questionCounts);
  const entries = collections.map((collection) => ({
    ...collection,
    questionCount: counts.get(collection.id) ?? 0,
  }));
  const available = entries.filter((entry) => entry.questionCount > 0);
  const empty = entries.filter((entry) => entry.questionCount === 0);
  // Keep the API's sort order in the directory while featuring the newest set with questions.
  const [featured] = [...available].sort(
    (a, b) => (Date.parse(b.created_at) || 0) - (Date.parse(a.created_at) || 0),
  );

  return {
    featured,
    remaining: [...available.filter((entry) => entry !== featured), ...empty],
    totalQuestions: available.reduce((total, entry) => total + entry.questionCount, 0),
  };
}

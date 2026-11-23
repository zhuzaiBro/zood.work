import 'server-only';
import { unstable_cache } from 'next/cache';
import { platformPublic } from '@/lib/platform/client';
import type { Database } from '@/types/database.types';

export type Collection = Pick<
  Database['public']['Tables']['interview_collections']['Row'],
  'id' | 'title' | 'description' | 'icon'
>;
export type Question = Pick<
  Database['public']['Tables']['interview_question']['Row'],
  'id' | 'title' | 'difficulty' | 'is_vip' | 'vip_level_required' | 'sort' | 'created_at'
> & {
  interview_question_tags: {
    interview_tags: Pick<Database['public']['Tables']['interview_tags']['Row'], 'id' | 'name'>;
  }[];
};

export const getCollectionPageData = unstable_cache(
  async (id: string) => {
    // Cache only through unstable_cache below. An inner force-cache fetch is
    // untagged, so revalidateTag still replays the question list from before
    // the last import.
    const data = await platformPublic<{
      collection: Collection | null;
      questions: Question[];
    }>(`/api/platform/interview/collections/${id}`, { cache: 'no-store' });

    return {
      collection: data.collection,
      questions: (data.questions ?? []).map((question) => ({
        ...question,
        interview_question_tags: question.interview_question_tags ?? [],
      })),
    };
  },
  ['interview-collection-page-v4'],
  { revalidate: 300, tags: ['interview-collections'] },
);

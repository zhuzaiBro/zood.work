import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import TagFilter from '@/components/interview/TagFilter';
import CollectionCard from '@/components/interview/CollectionCard';
import InterviewQuestionSearch from '@/components/interview/InterviewQuestionSearch';
import QuestionContributionForm from '@/components/interview/QuestionContributionForm';
import { Database } from '@/types/database.types';

type Collection = Database['public']['Tables']['interview_collections']['Row'];
type Tag = Database['public']['Tables']['interview_tags']['Row'];

export default async function InterviewPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; q?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;
  const currentTagSlug = params.tag;
  const searchQuery = params.q?.trim() ?? '';
  const isSearching = searchQuery.length > 0;

  // 1. Fetch all tags for the filter list
  const { data: tags } = await supabase
    .from('interview_tags')
    .select('*')
    .order('sort', { ascending: true })
    .order('created_at', { ascending: true });

  // 2. Fetch collections based on filter
  let collections: Collection[] | null = [];

  // Default to first tag if no tag provided
  const effectiveTagSlug = currentTagSlug || (tags && tags.length > 0 ? (tags[0] as { slug: string }).slug : null);

  if (effectiveTagSlug) {
    // If a tag is selected, we need to find collections associated with this tag.
    // First, get the tag ID.
    const { data: currentTag } = await supabase
      .from('interview_tags')
      .select('id')
      .eq('slug', effectiveTagSlug)
      .single();

    if (currentTag) {
      // Then get collection IDs from the junction table
      const { data: relations } = await supabase
        .from('interview_collection_tags')
        .select('collection_id')
        .eq('tag_id', (currentTag as { id: string }).id);

      if (relations && relations.length > 0) {
        const collectionIds = relations.map((r: { collection_id: string }) => r.collection_id);
        const { data } = await supabase
          .from('interview_collections')
          .select('*')
          .in('id', collectionIds)
          .order('sort', { ascending: true })
          .order('created_at', { ascending: false });
        collections = data;
      }
    }
  } else {
    // Fallback if no tags exist at all
    const { data } = await supabase
      .from('interview_collections')
      .select('*')
      .order('sort', { ascending: true })
      .order('created_at', { ascending: false });
    collections = data;
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#f3f7fc_34%,#f6f8fb_100%)] pb-12">
      <div className="mt-[-5rem] bg-[linear-gradient(180deg,#f8fbff_0%,#f3f7fc_34%,#f6f8fb_100%)] pt-24">
        <div className="container mx-auto px-4 pb-3">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">🔥</span>
            <h1 className="text-2xl font-bold text-gray-900">热门面试题库</h1>
          </div>

          <Suspense fallback={<div className="mb-4 h-11 rounded-xl bg-white/70" />}>
            <InterviewQuestionSearch initialQuery={searchQuery} />
          </Suspense>

          <Suspense fallback={null}>
            <TagFilter tags={tags || []} />
          </Suspense>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-2">
        {!isSearching && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {collections?.map((collection) => (
              <CollectionCard key={collection.id} collection={collection} />
            ))}
            {(!collections || collections.length === 0) && (
              <div className="col-span-full py-12 text-center text-gray-500">
                暂无面试题集
              </div>
            )}
          </div>
        )}

        <div className="mt-10">
          <QuestionContributionForm />
        </div>
      </div>
    </div>
  );
}

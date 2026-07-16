create index if not exists idx_interview_question_collection_sort_created
  on public.interview_question (collection_id, sort, created_at);

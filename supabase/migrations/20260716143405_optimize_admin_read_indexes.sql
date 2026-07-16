create index if not exists idx_user_profiles_created_at
  on public.user_profiles (created_at desc);

create index if not exists idx_videos_created_at
  on public.videos (created_at desc);

create index if not exists idx_course_enrollments_course_created
  on public.course_enrollments (course_id, created_at desc);

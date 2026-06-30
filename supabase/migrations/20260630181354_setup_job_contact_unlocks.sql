create table if not exists public.job_contact_unlocks (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  job_id uuid not null references public.job_listings(id) on delete cascade,
  month_start date not null,
  access_type text not null default 'quota',
  created_at timestamptz not null default now(),
  constraint job_contact_unlocks_access_type_check
    check (access_type in ('quota', 'member', 'admin')),
  constraint job_contact_unlocks_user_job_unique
    unique (user_id, job_id)
);

comment on table public.job_contact_unlocks is '记录用户解锁岗位联系方式的行为。普通用户每自然月最多 3 个新岗位，会员不扣额度。';
comment on column public.job_contact_unlocks.month_start is '解锁发生月份第一天，用于按自然月统计普通用户额度';
comment on column public.job_contact_unlocks.access_type is 'quota 普通用户额度，member 会员直看，admin 管理员操作';

create index if not exists idx_job_contact_unlocks_user_month
on public.job_contact_unlocks(user_id, month_start, created_at desc);

create index if not exists idx_job_contact_unlocks_job_id
on public.job_contact_unlocks(job_id);

alter table public.job_contact_unlocks enable row level security;

grant select on public.job_contact_unlocks to authenticated;
grant insert on public.job_contact_unlocks to authenticated;

drop policy if exists "Users can read own job contact unlocks" on public.job_contact_unlocks;
drop policy if exists "Users can insert own job contact unlocks" on public.job_contact_unlocks;
drop policy if exists "Admins can manage job contact unlocks" on public.job_contact_unlocks;

create policy "Users can read own job contact unlocks"
on public.job_contact_unlocks
for select
to authenticated
using (user_id = (select auth.uid()));

create policy "Users can insert own job contact unlocks"
on public.job_contact_unlocks
for insert
to authenticated
with check (user_id = (select auth.uid()));

create policy "Admins can manage job contact unlocks"
on public.job_contact_unlocks
for all
to authenticated
using (
  exists (
    select 1
    from public.user_profiles
    where user_profiles.id = (select auth.uid())
      and user_profiles.is_admin is true
  )
)
with check (
  exists (
    select 1
    from public.user_profiles
    where user_profiles.id = (select auth.uid())
      and user_profiles.is_admin is true
  )
);

-- 联系方式不能通过公开 Data API 直接读取，只允许通过服务端解锁接口返回。
revoke select on public.job_listings from anon, authenticated;

grant select (
  id,
  source_id,
  external_id,
  title,
  position_id,
  status,
  description,
  requirements,
  benefits,
  extra_content,
  company_name,
  company_external_id,
  company_intro,
  company_logo,
  company_website,
  company_size,
  work_type_id,
  work_type_name,
  office_mode_id,
  office_mode_name,
  location,
  base_location,
  min_salary,
  max_salary,
  tags,
  is_top_job,
  urgency_id,
  urgency_name,
  view_count,
  apply_count,
  source_created_at,
  source_slug,
  source_name,
  first_synced_at,
  last_synced_at,
  created_at,
  updated_at
) on public.job_listings to anon, authenticated;

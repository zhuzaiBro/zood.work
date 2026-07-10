alter table public.user_profiles
  add column if not exists vip_expires_at timestamptz;

comment on column public.user_profiles.vip_expires_at is '会员权益到期时间；为空表示未设置到期时间，通常用于永久/手动会员。';

create table if not exists public.interview_referral_rewards (
  id uuid primary key default gen_random_uuid(),
  referrer_user_id uuid not null references public.user_profiles(id) on delete cascade,
  referred_user_id uuid not null references public.user_profiles(id) on delete cascade,
  source_collection_id uuid references public.interview_collections(id) on delete set null,
  source_url text,
  reward_days integer not null default 1 check (reward_days > 0 and reward_days <= 30),
  reward_vip_level integer not null default 1 check (reward_vip_level > 0 and reward_vip_level <= 5),
  awarded_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint interview_referral_rewards_no_self_referral
    check (referrer_user_id <> referred_user_id),
  constraint interview_referral_rewards_referred_unique
    unique (referred_user_id)
);

create index if not exists idx_interview_referral_rewards_referrer_created
on public.interview_referral_rewards(referrer_user_id, created_at desc);

create index if not exists idx_interview_referral_rewards_collection
on public.interview_referral_rewards(source_collection_id);

alter table public.interview_referral_rewards enable row level security;

grant select on public.interview_referral_rewards to authenticated;

drop policy if exists "Users can read own interview referral rewards" on public.interview_referral_rewards;

create policy "Users can read own interview referral rewards"
on public.interview_referral_rewards
for select
to authenticated
using (
  (select auth.uid()) = referrer_user_id
  or (select auth.uid()) = referred_user_id
);

comment on table public.interview_referral_rewards is '面试题分享邀请注册奖励记录，同一个被邀请用户只发放一次奖励。';

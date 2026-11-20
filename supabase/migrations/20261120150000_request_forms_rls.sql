-- Reviewable access model for course purchase and membership consultation forms.
-- Do not apply this to the hosted Supabase project until it has been reviewed.
-- It is compatible with the existing Auth helpers: auth.uid() and user_profiles.is_admin.
-- Ordinary inserts stay on the caller's JWT. The service role is not granted new access here.

alter table public.course_purchase_requests enable row level security;
alter table public.membership_consultation_requests enable row level security;

drop policy if exists "Anyone can submit a pending course purchase request" on public.course_purchase_requests;
create policy "Anyone can submit a pending course purchase request"
on public.course_purchase_requests
for insert
to anon, authenticated
with check (
  status = 'pending'
  and length(trim(phone)) > 0
  and length(trim(wechat)) > 0
  and (
    (auth.uid() is null and user_id is null)
    or user_id = (select auth.uid())
  )
);

drop policy if exists "Users can read own course purchase requests" on public.course_purchase_requests;
create policy "Users can read own course purchase requests"
on public.course_purchase_requests
for select
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "Admins can manage course purchase requests" on public.course_purchase_requests;
create policy "Admins can manage course purchase requests"
on public.course_purchase_requests
for all
to authenticated
using (
  exists (
    select 1 from public.user_profiles
    where user_profiles.id = (select auth.uid())
      and user_profiles.is_admin is true
  )
)
with check (
  exists (
    select 1 from public.user_profiles
    where user_profiles.id = (select auth.uid())
      and user_profiles.is_admin is true
  )
);

drop policy if exists "Anyone can submit a pending membership consultation" on public.membership_consultation_requests;
create policy "Anyone can submit a pending membership consultation"
on public.membership_consultation_requests
for insert
to anon, authenticated
with check (
  status = 'pending'
  and length(trim(phone)) > 0
  and length(trim(wechat)) > 0
  and (
    (auth.uid() is null and user_id is null)
    or user_id = (select auth.uid())
  )
);

drop policy if exists "Users can read own membership consultations" on public.membership_consultation_requests;
create policy "Users can read own membership consultations"
on public.membership_consultation_requests
for select
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "Admins can manage membership consultations" on public.membership_consultation_requests;
create policy "Admins can manage membership consultations"
on public.membership_consultation_requests
for all
to authenticated
using (
  exists (
    select 1 from public.user_profiles
    where user_profiles.id = (select auth.uid())
      and user_profiles.is_admin is true
  )
)
with check (
  exists (
    select 1 from public.user_profiles
    where user_profiles.id = (select auth.uid())
      and user_profiles.is_admin is true
  )
);

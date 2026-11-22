#!/usr/bin/env bash
# Applies the reviewable request-form policies to a throwaway local Postgres.
# It does not use 127.0.0.1:55432 or any production credential.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NAME="zood-rls-test-$$"
PORT="${RLS_TEST_PORT:-55499}"

docker rm -f "$NAME" >/dev/null 2>&1 || true
docker run -d --name "$NAME" \
  -e POSTGRES_PASSWORD=test \
  -e POSTGRES_DB=zood_rls \
  -p "127.0.0.1:${PORT}:5432" \
  postgres:17 >/dev/null

cleanup() { docker rm -f "$NAME" >/dev/null 2>&1 || true; }
trap cleanup EXIT

for _ in $(seq 1 30); do
  if docker exec "$NAME" pg_isready -U postgres >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

docker exec -i "$NAME" psql -U postgres -d zood_rls <<'SQL'
create schema if not exists auth;
create or replace function auth.uid() returns uuid
language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
create table public.user_profiles (
  id uuid primary key,
  is_admin boolean
);
create table public.course_purchase_requests (
  id bigint generated always as identity primary key,
  course_id uuid,
  course_title text,
  course_price numeric,
  user_id uuid,
  phone text not null,
  wechat text not null,
  note text,
  status text not null,
  admin_note text,
  contacted_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create table public.membership_consultation_requests (
  id bigint generated always as identity primary key,
  user_id uuid,
  phone text not null,
  wechat text not null,
  note text,
  source text,
  plan_price numeric,
  status text not null,
  admin_note text,
  created_at timestamptz default now()
);
insert into public.user_profiles (id, is_admin) values
  ('11111111-1111-4111-8111-111111111111', false),
  ('22222222-2222-4222-8222-222222222222', true);
SQL

docker exec -i "$NAME" psql -U postgres -d zood_rls < "$ROOT/supabase/migrations/20261120150000_request_forms_rls.sql"

docker exec -i "$NAME" psql -U postgres -d zood_rls -v ON_ERROR_STOP=1 <<'SQL'
create role anon nologin;
create role authenticated nologin;
grant anon, authenticated to postgres;
grant usage on schema public to anon, authenticated;
grant select on public.user_profiles to anon, authenticated;
grant select, insert, update, delete on public.course_purchase_requests, public.membership_consultation_requests to anon, authenticated;
alter table public.course_purchase_requests force row level security;
alter table public.membership_consultation_requests force row level security;

set role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
insert into public.course_purchase_requests (phone, wechat, status, user_id)
values ('13800000000', 'wechat-a', 'pending', '11111111-1111-4111-8111-111111111111');

do $$
begin
  begin
    insert into public.course_purchase_requests (phone, wechat, status, user_id)
    values ('13800000000', 'wechat-a', 'paid', '11111111-1111-4111-8111-111111111111');
    raise exception 'paid insert should have failed';
  exception when insufficient_privilege or check_violation or others then
    if sqlerrm = 'paid insert should have failed' then
      raise;
    end if;
  end;
  begin
    insert into public.course_purchase_requests (phone, wechat, status, user_id)
    values ('13800000000', 'wechat-a', 'pending', '22222222-2222-4222-8222-222222222222');
    raise exception 'cross-user insert should have failed';
  exception when insufficient_privilege or check_violation or others then
    if sqlerrm = 'cross-user insert should have failed' then
      raise;
    end if;
  end;
end $$;

set role postgres;
select set_config('request.jwt.claim.sub', '', true);
set role anon;
insert into public.membership_consultation_requests (phone, wechat, status, user_id)
values ('13800000000', 'wechat-a', 'pending', null);

set role postgres;
select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', true);
set role authenticated;
update public.course_purchase_requests set status = 'contacted' where phone = '13800000000';
SQL

echo "request form RLS checks passed"

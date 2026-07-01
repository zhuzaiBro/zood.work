-- 原平台 source_url 只是后台溯源字段，不算岗位联系方式。
-- 岗位广场只保留直接联系方式：email / phone / wechat / telegram。
delete from public.job_listings
where nullif(btrim(coalesce(email, '')), '') is null
  and nullif(btrim(coalesce(phone, '')), '') is null
  and nullif(btrim(coalesce(wechat, '')), '') is null
  and nullif(btrim(coalesce(telegram, '')), '') is null;

alter table public.job_listings
drop constraint if exists job_listings_contact_required_check;

alter table public.job_listings
add constraint job_listings_contact_required_check
check (
  nullif(btrim(coalesce(email, '')), '') is not null
  or nullif(btrim(coalesce(phone, '')), '') is not null
  or nullif(btrim(coalesce(wechat, '')), '') is not null
  or nullif(btrim(coalesce(telegram, '')), '') is not null
);

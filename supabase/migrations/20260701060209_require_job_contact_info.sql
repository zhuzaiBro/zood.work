-- 岗位广场只保留可投递/可联系的岗位。
-- 联系方式包括外部投递入口 source_url，以及 email / phone / wechat / telegram。
delete from public.job_listings
where nullif(btrim(coalesce(source_url, '')), '') is null
  and nullif(btrim(coalesce(email, '')), '') is null
  and nullif(btrim(coalesce(phone, '')), '') is null
  and nullif(btrim(coalesce(wechat, '')), '') is null
  and nullif(btrim(coalesce(telegram, '')), '') is null;

alter table public.job_listings
drop constraint if exists job_listings_contact_required_check;

alter table public.job_listings
add constraint job_listings_contact_required_check
check (
  nullif(btrim(coalesce(source_url, '')), '') is not null
  or nullif(btrim(coalesce(email, '')), '') is not null
  or nullif(btrim(coalesce(phone, '')), '') is not null
  or nullif(btrim(coalesce(wechat, '')), '') is not null
  or nullif(btrim(coalesce(telegram, '')), '') is not null
);

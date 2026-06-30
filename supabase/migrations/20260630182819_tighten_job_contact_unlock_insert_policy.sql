-- 普通用户不能直接写入解锁记录，否则可伪造 access_type 绕过额度。
-- 解锁记录只能通过服务端接口使用 service role 写入；后台管理仍由 Admin RLS 策略控制。
drop policy if exists "Users can insert own job contact unlocks" on public.job_contact_unlocks;

comment on table public.job_contact_unlocks is
  '记录用户解锁岗位联系方式的行为。普通用户每自然月最多 3 个新岗位，会员不扣额度；写入必须通过服务端解锁接口。';

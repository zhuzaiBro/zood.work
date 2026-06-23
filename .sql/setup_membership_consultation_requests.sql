-- 会员开通咨询表
-- 在 Supabase Dashboard 的 SQL Editor 中执行此脚本

CREATE TABLE IF NOT EXISTS public.membership_consultation_requests (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  phone TEXT NOT NULL,
  wechat TEXT NOT NULL,
  note TEXT,
  source TEXT,
  plan_price NUMERIC(10, 2) DEFAULT 129,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_note TEXT,
  contacted_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT membership_consultation_requests_status_check
    CHECK (status IN ('pending', 'contacted', 'paid', 'closed'))
);

CREATE INDEX IF NOT EXISTS idx_membership_consultation_requests_user_id
ON public.membership_consultation_requests(user_id);

CREATE INDEX IF NOT EXISTS idx_membership_consultation_requests_status_created
ON public.membership_consultation_requests(status, created_at DESC);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_membership_consultation_requests_updated_at
ON public.membership_consultation_requests;

CREATE TRIGGER update_membership_consultation_requests_updated_at
BEFORE UPDATE ON public.membership_consultation_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.membership_consultation_requests ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON public.membership_consultation_requests TO authenticated, anon;

DROP POLICY IF EXISTS "Users can read own membership consultations" ON public.membership_consultation_requests;
DROP POLICY IF EXISTS "Admins can manage membership consultations" ON public.membership_consultation_requests;

CREATE POLICY "Users can read own membership consultations"
ON public.membership_consultation_requests
FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Admins can manage membership consultations"
ON public.membership_consultation_requests
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_profiles
    WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.is_admin IS TRUE
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.user_profiles
    WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.is_admin IS TRUE
  )
);

COMMENT ON TABLE public.membership_consultation_requests IS '永久会员开通咨询，后台主动联系用户完成支付';
COMMENT ON COLUMN public.membership_consultation_requests.phone IS '用户提交的手机号';
COMMENT ON COLUMN public.membership_consultation_requests.wechat IS '用户提交的微信号';
COMMENT ON COLUMN public.membership_consultation_requests.source IS '咨询来源，例如 profile、floating_contact';

NOTIFY pgrst, 'reload schema';

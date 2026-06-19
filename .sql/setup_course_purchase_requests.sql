-- 课程购买意向表
-- 在 Supabase Dashboard 的 SQL Editor 中执行此脚本

CREATE TABLE IF NOT EXISTS public.course_purchase_requests (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  course_title TEXT,
  course_price NUMERIC(10, 2) DEFAULT 0,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  phone TEXT NOT NULL,
  wechat TEXT NOT NULL,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_note TEXT,
  contacted_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT course_purchase_requests_status_check
    CHECK (status IN ('pending', 'contacted', 'paid', 'closed'))
);

CREATE INDEX IF NOT EXISTS idx_course_purchase_requests_course_id
ON public.course_purchase_requests(course_id);

CREATE INDEX IF NOT EXISTS idx_course_purchase_requests_user_id
ON public.course_purchase_requests(user_id);

CREATE INDEX IF NOT EXISTS idx_course_purchase_requests_status_created
ON public.course_purchase_requests(status, created_at DESC);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_course_purchase_requests_updated_at
ON public.course_purchase_requests;

CREATE TRIGGER update_course_purchase_requests_updated_at
BEFORE UPDATE ON public.course_purchase_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.course_purchase_requests ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON public.course_purchase_requests TO authenticated;

DROP POLICY IF EXISTS "Users can read own purchase requests" ON public.course_purchase_requests;
DROP POLICY IF EXISTS "Users can insert own purchase requests" ON public.course_purchase_requests;
DROP POLICY IF EXISTS "Admins can manage purchase requests" ON public.course_purchase_requests;

CREATE POLICY "Users can read own purchase requests"
ON public.course_purchase_requests
FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own purchase requests"
ON public.course_purchase_requests
FOR INSERT
TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Admins can manage purchase requests"
ON public.course_purchase_requests
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

COMMENT ON TABLE public.course_purchase_requests IS '记录付费课程购买意向，后台主动联系用户完成线下支付';
COMMENT ON COLUMN public.course_purchase_requests.phone IS '用户提交的联系电话';
COMMENT ON COLUMN public.course_purchase_requests.wechat IS '用户提交的微信号';

SELECT
  schemaname,
  tablename,
  policyname,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'course_purchase_requests'
ORDER BY policyname;

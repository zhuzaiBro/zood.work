-- 课程用户开通表
-- 在 Supabase Dashboard 的 SQL Editor 中执行此脚本

CREATE TABLE IF NOT EXISTS public.course_enrollments (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'manual',
  status TEXT NOT NULL DEFAULT 'active',
  granted_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  revoked_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT course_enrollments_status_check
    CHECK (status IN ('active', 'revoked')),
  CONSTRAINT course_enrollments_course_user_unique
    UNIQUE (course_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_course_enrollments_course_id
ON public.course_enrollments(course_id);

CREATE INDEX IF NOT EXISTS idx_course_enrollments_user_id
ON public.course_enrollments(user_id);

CREATE INDEX IF NOT EXISTS idx_course_enrollments_status_created
ON public.course_enrollments(status, created_at DESC);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_course_enrollments_updated_at
ON public.course_enrollments;

CREATE TRIGGER update_course_enrollments_updated_at
BEFORE UPDATE ON public.course_enrollments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.course_enrollments TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.course_enrollments TO authenticated;

DROP POLICY IF EXISTS "Users can read own course enrollments" ON public.course_enrollments;
DROP POLICY IF EXISTS "Admins can manage course enrollments" ON public.course_enrollments;

CREATE POLICY "Users can read own course enrollments"
ON public.course_enrollments
FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Admins can manage course enrollments"
ON public.course_enrollments
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

COMMENT ON TABLE public.course_enrollments IS '记录管理员为用户手动开通课程的授权关系';
COMMENT ON COLUMN public.course_enrollments.source IS '授权来源，例如 manual、purchase_request、migration';
COMMENT ON COLUMN public.course_enrollments.status IS '授权状态：active 已开通，revoked 已撤销';

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
  AND tablename = 'course_enrollments'
ORDER BY policyname;

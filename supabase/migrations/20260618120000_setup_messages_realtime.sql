-- 实时客服聊天 messages 表

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  sender_type TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT messages_sender_type_check
    CHECK (sender_type IN ('user', 'admin', 'system')),
  CONSTRAINT messages_content_length_check
    CHECK (char_length(trim(content)) > 0 AND char_length(content) <= 2000)
);

CREATE INDEX IF NOT EXISTS idx_messages_session_created
  ON public.messages(session_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_messages_user_id
  ON public.messages(user_id)
  WHERE user_id IS NOT NULL;

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT ON public.messages TO authenticated, anon;

DROP POLICY IF EXISTS "Anyone can read messages in known sessions" ON public.messages;
DROP POLICY IF EXISTS "Users can send chat messages" ON public.messages;
DROP POLICY IF EXISTS "Admins can send admin messages" ON public.messages;
DROP POLICY IF EXISTS "Admins can read all messages" ON public.messages;

CREATE POLICY "Anyone can read messages in known sessions"
ON public.messages
FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Users can send chat messages"
ON public.messages
FOR INSERT
TO authenticated, anon
WITH CHECK (
  sender_type = 'user'
  AND char_length(trim(content)) > 0
);

CREATE POLICY "Admins can send admin messages"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  sender_type IN ('admin', 'system')
  AND EXISTS (
    SELECT 1
    FROM public.user_profiles
    WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.is_admin IS TRUE
  )
);

CREATE POLICY "Admins can read all messages"
ON public.messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_profiles
    WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.is_admin IS TRUE
  )
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END $$;

COMMENT ON TABLE public.messages IS '站点右下角实时客服聊天消息';
COMMENT ON COLUMN public.messages.session_id IS '会话 ID：登录用户通常为 user_id，访客为 localStorage 持久化 UUID';
COMMENT ON COLUMN public.messages.sender_type IS 'user | admin | system';

NOTIFY pgrst, 'reload schema';

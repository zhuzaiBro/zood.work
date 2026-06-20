-- 回填缺失的 user_profiles，并为后续新注册用户自动创建 profile
-- 建议在 Supabase SQL Editor 中执行

CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.generate_profile_username(
  p_user_id UUID,
  p_email TEXT,
  p_phone TEXT,
  p_raw_user_meta_data JSONB DEFAULT '{}'::JSONB
)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = ''
AS $$
DECLARE
  base TEXT;
BEGIN
  base := NULLIF(TRIM(COALESCE(
    p_raw_user_meta_data ->> 'address',
    p_raw_user_meta_data ->> 'wallet_address',
    p_raw_user_meta_data ->> 'user_name',
    p_raw_user_meta_data ->> 'username',
    p_raw_user_meta_data ->> 'preferred_username',
    split_part(COALESCE(p_email, ''), '@', 1),
    NULLIF(regexp_replace(COALESCE(p_phone, ''), '\D', '', 'g'), '')
  )), '');

  base := lower(regexp_replace(COALESCE(base, 'user'), '[^a-z0-9_]+', '_', 'g'));
  base := regexp_replace(base, '^_+|_+$', '', 'g');
  base := LEFT(COALESCE(NULLIF(base, ''), 'user'), 24);

  RETURN base || '_' || LEFT(replace(p_user_id::TEXT, '-', ''), 8);
END;
$$;

CREATE OR REPLACE FUNCTION private.handle_auth_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id,
    username,
    display_name,
    avatar_url,
    bio,
    vip_level,
    is_admin
  )
  VALUES (
    NEW.id,
    private.generate_profile_username(NEW.id, NEW.email, NEW.phone, NEW.raw_user_meta_data),
    COALESCE(
      NULLIF(TRIM(NEW.raw_user_meta_data ->> 'full_name'), ''),
      NULLIF(TRIM(NEW.raw_user_meta_data ->> 'name'), ''),
      NULLIF(TRIM(NEW.raw_user_meta_data ->> 'user_name'), ''),
      NULLIF(TRIM(NEW.raw_user_meta_data ->> 'preferred_username'), ''),
      CASE
        WHEN NULLIF(TRIM(NEW.raw_user_meta_data ->> 'address'), '') IS NOT NULL
          THEN LEFT(lower(NEW.raw_user_meta_data ->> 'address'), 6) || '...' || RIGHT(lower(NEW.raw_user_meta_data ->> 'address'), 4)
        ELSE NULL
      END,
      NEW.email,
      NEW.phone,
      '用户 ' || LEFT(replace(NEW.id::TEXT, '-', ''), 8)
    ),
    COALESCE(
      NULLIF(TRIM(NEW.raw_user_meta_data ->> 'avatar_url'), ''),
      NULLIF(TRIM(NEW.raw_user_meta_data ->> 'picture'), ''),
      'https://api.dicebear.com/7.x/identicon/svg?seed=' || NEW.id::TEXT
    ),
    NULL,
    0,
    FALSE
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_create_profile ON auth.users;

CREATE TRIGGER on_auth_user_created_create_profile
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION private.handle_auth_user_profile();

INSERT INTO public.user_profiles (
  id,
  username,
  display_name,
  avatar_url,
  bio,
  vip_level,
  is_admin
)
SELECT
  au.id,
  private.generate_profile_username(au.id, au.email, au.phone, au.raw_user_meta_data),
  COALESCE(
    NULLIF(TRIM(au.raw_user_meta_data ->> 'full_name'), ''),
    NULLIF(TRIM(au.raw_user_meta_data ->> 'name'), ''),
    NULLIF(TRIM(au.raw_user_meta_data ->> 'user_name'), ''),
    NULLIF(TRIM(au.raw_user_meta_data ->> 'preferred_username'), ''),
    CASE
      WHEN NULLIF(TRIM(au.raw_user_meta_data ->> 'address'), '') IS NOT NULL
        THEN LEFT(lower(au.raw_user_meta_data ->> 'address'), 6) || '...' || RIGHT(lower(au.raw_user_meta_data ->> 'address'), 4)
      ELSE NULL
    END,
    au.email,
    au.phone,
    '用户 ' || LEFT(replace(au.id::TEXT, '-', ''), 8)
  ),
  COALESCE(
    NULLIF(TRIM(au.raw_user_meta_data ->> 'avatar_url'), ''),
    NULLIF(TRIM(au.raw_user_meta_data ->> 'picture'), ''),
    'https://api.dicebear.com/7.x/identicon/svg?seed=' || au.id::TEXT
  ),
  NULL,
  0,
  FALSE
FROM auth.users AS au
LEFT JOIN public.user_profiles AS up
  ON up.id = au.id
WHERE up.id IS NULL;

-- 验证是否还有缺失 profile 的 Auth 用户
SELECT COUNT(*) AS missing_profile_count
FROM auth.users AS au
LEFT JOIN public.user_profiles AS up
  ON up.id = au.id
WHERE up.id IS NULL;

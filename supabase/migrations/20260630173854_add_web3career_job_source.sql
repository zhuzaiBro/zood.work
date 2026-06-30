insert into public.job_sources (
  slug,
  name,
  base_url,
  is_active,
  sync_config
) values (
  'web3career',
  'Web3.career',
  'https://web3.career',
  true,
  jsonb_build_object(
    'provider', 'web3career',
    'list_path', '/remote-jobs',
    'pages', jsonb_build_array(1, 2),
    'limit', 40
  )
)
on conflict (slug) do update set
  name = excluded.name,
  base_url = excluded.base_url,
  is_active = excluded.is_active,
  sync_config = excluded.sync_config,
  updated_at = now();

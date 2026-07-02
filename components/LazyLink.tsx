'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, type ComponentProps } from 'react';

type LazyLinkProps = ComponentProps<typeof Link>;

function hrefToString(href: LazyLinkProps['href']): string | null {
  if (typeof href === 'string') return href;
  if (typeof href === 'object' && href !== null && 'pathname' in href) {
    const path = href.pathname ?? '';
    const query = href.query;
    if (!query || typeof query !== 'object') return path || null;
    const search = new URLSearchParams(
      Object.entries(query as Record<string, string>).filter(([, v]) => v != null),
    ).toString();
    return search ? `${path}?${search}` : path || null;
  }
  return null;
}

/** 禁用自动 prefetch，鼠标悬停 / 聚焦时再预加载 */
export default function LazyLink({
  href,
  onMouseEnter,
  onFocus,
  prefetch = false,
  ...props
}: LazyLinkProps) {
  const router = useRouter();
  const prefetched = useRef(false);

  const prefetchOnce = () => {
    if (prefetched.current) return;
    const url = hrefToString(href);
    if (!url) return;
    prefetched.current = true;
    router.prefetch(url);
  };

  return (
    <Link
      href={href}
      prefetch={prefetch}
      onMouseEnter={(event) => {
        prefetchOnce();
        onMouseEnter?.(event);
      }}
      onFocus={(event) => {
        prefetchOnce();
        onFocus?.(event);
      }}
      {...props}
    />
  );
}

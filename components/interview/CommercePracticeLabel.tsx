import Image from 'next/image';
import type { CommercePlatform } from '@/lib/interview/commercePlatforms';

export default function CommercePracticeLabel({ platform, showIcon = true }: {
  platform?: CommercePlatform;
  showIcon?: boolean;
}) {
  if (!platform) return null;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium leading-5">
      {showIcon && <Image src={platform.icon} alt="" width={20} height={20} unoptimized className="h-5 w-5 shrink-0 rounded object-contain" />}
      <span>{platform.name}场景 · 原创模拟</span>
    </span>
  );
}

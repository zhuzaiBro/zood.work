'use client';

import Image from 'next/image';
import { useState } from 'react';

export default function CollectionIcon({ icon, title }: { icon: string | null; title: string }) {
  const [failedIcon, setFailedIcon] = useState<string | null>(null);
  const isImage = icon && /^(https?:\/\/|\/)/.test(icon);
  const fallback = icon && !isImage ? icon : title.slice(0, 1);

  return (
    <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 text-lg font-bold text-sky-700" aria-hidden="true">
      {isImage && failedIcon !== icon ? (
        <Image
          src={icon}
          alt=""
          width={36}
          height={36}
          unoptimized
          onError={() => setFailedIcon(icon)}
          className="h-full w-full bg-white object-contain p-1"
        />
      ) : fallback}
    </span>
  );
}

'use client';

export default function CompanyLogo({ logo, company }: { logo: string | null; company: string | null }) {
  return (
    <span aria-hidden="true" className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg border border-slate-200 bg-sky-50 text-lg font-bold text-sky-800">
      {(company?.trim() || '招').slice(0, 1).toUpperCase()}
      {logo && <img key={logo} src={logo} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" width={48} height={48}
        className="absolute inset-0 h-full w-full bg-white object-contain p-1 opacity-0"
        onLoad={event => { event.currentTarget.style.opacity = '1'; }}
        onError={event => { event.currentTarget.style.opacity = '0'; }} />}
    </span>
  );
}

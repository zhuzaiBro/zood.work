'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FloatingContact from '@/components/FloatingContact';
import { isLightContentPage } from '@/lib/layout';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith('/admin');

  const lightContentPage = isLightContentPage(pathname);

  if (isAdminRoute) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className={`flex-1 ${lightContentPage ? 'pt-[var(--site-header-height)] bg-gray-50' : 'pt-20'}`}>{children}</main>
      <Footer />
      <FloatingContact />
    </div>
  );
}

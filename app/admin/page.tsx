'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminListSkeleton } from '@/components/ui/PageSkeleton';

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/questions');
  }, [router]);

  return <AdminListSkeleton />;
}

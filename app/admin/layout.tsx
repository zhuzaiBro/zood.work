import { Metadata } from 'next';
import AdminLayoutClient from '@/components/admin/AdminLayoutClient';

export const metadata: Metadata = {
  title: '管理后台 - Zood',
  description: '面试题管理和其他管理功能',
};

// Admin pages fetch their authenticated data in the browser. Keep the route
// segment as a static shell so navigation never waits on server rendering.
export const dynamic = 'force-static';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}

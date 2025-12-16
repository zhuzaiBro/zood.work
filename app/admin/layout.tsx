import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '管理后台 - Blog',
  description: '面试题管理和其他管理功能',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}


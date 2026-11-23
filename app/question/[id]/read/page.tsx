import { notFound } from 'next/navigation';
import QuestionReader from '@/components/question/QuestionReader';
import { isUuid } from '@/lib/interview-referral-cookies';
import { serverUser } from '@/lib/auth/server';
import { getQuestionPageData } from '@/lib/interview/getQuestionPageData';
import { getEffectiveVipLevel } from '@/lib/membership';
import { platformServer } from '@/lib/platform/server';

export const dynamic = 'force-dynamic';
export const preferredRegion = 'hkg1';

export default async function MemberQuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const data = await getQuestionPageData(id, 'session');
  if (!data) notFound();

  let access: 'login' | 'upgrade' | undefined;
  const requiredLevel = data.question.vip_level_required ?? 0;
  if (requiredLevel > 0) {
    if (!(await serverUser())) {
      access = 'login';
    } else {
      try {
        const { profile } = await platformServer<{
          profile: { vip_level?: number | null; vip_expires_at?: string | null } | null;
        }>('/api/platform/me/profile');
        if (getEffectiveVipLevel(profile) < requiredLevel) access = 'upgrade';
      } catch {
        access = 'upgrade';
      }
    }
  }

  return <QuestionReader data={data} access={access} />;
}

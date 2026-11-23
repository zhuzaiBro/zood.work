import 'server-only';
import { platformRequest, PlatformError } from '@/lib/platform/http';
import { platformServer } from '@/lib/platform/server';
import type { Database } from '@/types/database.types';

type Tables = Database['public']['Tables'];
type CollectionTitle = Pick<Tables['interview_collections']['Row'], 'title'>;
type InterviewQuestion = Tables['interview_question']['Row'] & {
  interview_collections?: CollectionTitle | CollectionTitle[] | null;
  interview_question_tags?: { interview_tags: Tables['interview_tags']['Row'] }[];
};
type QuestionNavItem = Pick<InterviewQuestion, 'id' | 'title'>;

export type QuestionPageData = {
  question: InterviewQuestion;
  navigation?: {
    questions?: QuestionNavItem[];
    index?: number;
    count?: number;
    previous?: QuestionNavItem | null;
    next?: QuestionNavItem | null;
  };
};

export function hasPublicAnswer(question: Pick<InterviewQuestion, 'is_vip' | 'vip_level_required'>) {
  return !question.is_vip && (question.vip_level_required ?? 0) <= 0;
}

export async function getQuestionPageData(id: string, viewer: 'public' | 'session') {
  const path = `/api/platform/interview/questions/${encodeURIComponent(id)}`;
  try {
    const data = viewer === 'public'
      ? await platformRequest<QuestionPageData>(path)
      : await platformServer<QuestionPageData>(path, { cache: 'no-store' });
    return data.question ? data : null;
  } catch (error) {
    if (error instanceof PlatformError && error.status === 404) return null;
    throw error;
  }
}

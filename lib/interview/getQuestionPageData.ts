import 'server-only';
import { cache } from 'react';
import { platformServer } from '@/lib/platform/server';
import type { Database } from '@/types/database.types';

type Tables = Database['public']['Tables'];
type CollectionTitle = Pick<Tables['interview_collections']['Row'], 'title'>;
export type InterviewQuestion = Tables['interview_question']['Row'] & {
  interview_collections?: CollectionTitle | CollectionTitle[] | null;
  interview_question_tags?: { interview_tags: Tables['interview_tags']['Row'] }[];
};
type SidebarItem = Pick<InterviewQuestion, 'id' | 'title'>;
export type QuestionNavItem = Pick<InterviewQuestion, 'id' | 'title' | 'sort' | 'created_at'>;

type QuestionPageData = {
  question: InterviewQuestion | null;
  navigation?: {
    questions?: SidebarItem[];
    index?: number;
    count?: number;
    previous?: QuestionNavItem | null;
    next?: QuestionNavItem | null;
  };
};

// The page and its layout share the caller's result for this render.
export const getQuestionPageData = cache((id: string) =>
  platformServer<QuestionPageData>(`/api/platform/interview/questions/${encodeURIComponent(id)}`),
);

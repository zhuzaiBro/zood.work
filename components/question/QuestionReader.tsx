import { commercePlatformFor } from '@/lib/interview/commercePlatforms';
import CommercePracticeLabel from '@/components/interview/CommercePracticeLabel';
import QuestionSidebar from '@/components/question/QuestionSidebar';
import Link from 'next/link';
import type { QuestionPageData } from '@/lib/interview/getQuestionPageData';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CodeBlock from '@/components/CodeBlock';
import QuestionToc from '@/components/question/QuestionToc';
import MarkdownHeading, { getMarkdownHeadings } from '@/components/MarkdownHeading';
import QuestionFavoriteButton from '@/components/interview/QuestionFavoriteButton';
import ReferralShareButton from '@/components/interview/ReferralShareButton';
import QuestionAnswerPanel from '@/components/question/QuestionAnswerPanel';

type ReaderProps = {
  data: QuestionPageData;
  access?: 'login' | 'upgrade';
};

export default function QuestionReader({ data, access }: ReaderProps) {
  const { question, navigation } = data;
  const collectionQuestions = navigation?.questions?.length ? navigation.questions : [question];
  const collection = question.interview_collections;
  const collectionTitle = Array.isArray(collection) ? collection[0]?.title : collection?.title;
  const previousQuestion = navigation?.previous;
  const nextQuestion = navigation?.next;
  const currentQuestionIndex = navigation?.index ?? -1;
  const collectionQuestionCount = navigation?.count ?? 0;

  return (
    <div className="min-h-screen mt-[-5rem] bg-gray-50 pt-32 pb-12 bg-gradient-to-b from-blue-50 to-gray-50">
      <div className="container mx-auto px-4 max-w-[1400px]">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Left Sidebar: Question List */}
          <QuestionSidebar questions={collectionQuestions} activeQuestionId={question.id} collectionTitle={collectionTitle} />

          {/* Main Content */}
          <article className="flex-1 min-w-0">
            <div className="mb-6">
              <Link
                href={`/interview/${question.collection_id}`}
                className="inline-flex items-center text-gray-500 hover:text-gray-900 transition-colors"
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                返回题库
              </Link>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
              {/* Title */}
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 leading-snug">
                {question.title}
              </h1>

              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <span className={`
                  px-2.5 py-0.5 rounded text-xs font-medium
                  ${question.difficulty === '简单' ? 'bg-green-100 text-green-700' : ''}
                  ${question.difficulty === '中等' ? 'bg-yellow-100 text-yellow-700' : ''}
                  ${question.difficulty === '困难' ? 'bg-red-100 text-red-700' : ''}
                  ${!question.difficulty ? 'bg-gray-100 text-gray-600' : ''}
                `}>
                  {question.difficulty || '未知'}
                </span>

                <span className="contents text-slate-600"><CommercePracticeLabel platform={commercePlatformFor(question.collection_id)} /></span>
              {question.interview_question_tags?.map((tagRel) => (
                  <span
                    key={tagRel.interview_tags.id}
                    className="px-2.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded border border-gray-200"
                  >
                    {tagRel.interview_tags.name}
                  </span>
                ))}
              </div>

              {/* Action Bar */}
              <div className="mb-8 flex flex-col gap-4 border-b border-gray-100 pb-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <QuestionFavoriteButton questionId={question.id} variant="pill" />
                  <ReferralShareButton
                    sharePath={`/question/${question.id}`}
                    title={question.title}
                    collectionId={question.collection_id}
                    className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 font-semibold text-gray-600 shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                  />
                </div>

                <div className="flex flex-col gap-2 md:items-end">
                  {collectionQuestionCount > 0 && currentQuestionIndex >= 0 && (
                    <span className="text-xs font-medium text-gray-400">
                      第 {currentQuestionIndex + 1} / {collectionQuestionCount} 题
                    </span>
                  )}
                  <div className="flex items-center gap-2">
                    {previousQuestion ? (
                      <Link
                        href={`/question/${previousQuestion.id}`}
                        className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        上一题
                      </Link>
                    ) : (
                      <span className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-full border border-gray-100 bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-300">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        上一题
                      </span>
                    )}

                    {nextQuestion ? (
                      <Link
                        href={`/question/${nextQuestion.id}`}
                        className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
                      >
                        下一题
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    ) : (
                      <span className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-full border border-gray-100 bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-300">
                        下一题
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <QuestionAnswerPanel canHide={!access && Boolean(question.content)}>
                <div className="question-prose prose prose-slate max-w-none relative">
                {access ? (
                  <div className="py-24 px-6 text-center bg-gray-50 rounded-xl border border-gray-200 flex flex-col items-center justify-center relative overflow-hidden">
                    {/* 背景装饰 */}
                    <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('/zood.jpg')] bg-cover bg-center filter blur-sm"></div>

                    <div className="relative z-10 max-w-md mx-auto">
                      <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg text-white text-3xl">
                        🔒
                      </div>

                      <h3 className="text-xl font-bold text-gray-900 mb-3">
                        {access === 'login' ? '需要登录查看' : `需要 VIP${question.vip_level_required} 等级`}
                      </h3>

                      <p className="text-gray-500 mb-8 leading-relaxed">
                        {access === 'login'
                          ? '这是一道精选面试题，请登录后解锁完整解析和代码示例。'
                          : `本题属于高阶面试题库，需要 VIP${question.vip_level_required} 会员权益才能查看完整解析。`
                        }
                      </p>

                      {access === 'login' ? (
                        <Link
                          href="/login"
                          className="inline-flex items-center justify-center px-8 py-3 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                          立即登录
                        </Link>
                      ) : (
                        <Link href="/profile" className="inline-flex items-center justify-center px-8 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold rounded-full hover:from-yellow-600 hover:to-orange-600 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                          升级 VIP 会员
                        </Link>
                      )}
                    </div>
                  </div>
                ) : question.content ? (
                  <ReactMarkdown
                    components={{
                      code: ({ node, inline, className, children, ...props }: any) => (
                        <CodeBlock
                          inline={inline}
                          className={className}
                          {...props}
                        >
                          {children}
                        </CodeBlock>
                      ),
                      h1: (props) => <MarkdownHeading level={1} {...props} />,
                      h2: (props) => <MarkdownHeading level={2} {...props} />,
                      h3: (props) => <MarkdownHeading level={3} {...props} />,
                      h4: (props) => <MarkdownHeading level={4} {...props} />,
                      h5: (props) => <MarkdownHeading level={5} {...props} />,
                      h6: (props) => <MarkdownHeading level={6} {...props} />,
                    }}
                    remarkPlugins={[remarkGfm]}
                  >
                    {question.content}
                  </ReactMarkdown>
                ) : (
                  <div className="py-12 text-center text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    暂无答案内容，待补充...
                  </div>
                )}
                </div>
              </QuestionAnswerPanel>

              <div className="mt-10 grid gap-3 border-t border-gray-100 pt-6 md:grid-cols-2">
                {previousQuestion ? (
                  <Link
                    href={`/question/${previousQuestion.id}`}
                    className="group rounded-xl border border-gray-100 bg-gray-50/70 p-4 transition-colors hover:border-blue-200 hover:bg-blue-50"
                  >
                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-500 group-hover:text-blue-700">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      上一题
                    </div>
                    <div className="line-clamp-2 text-sm font-medium text-gray-900">
                      {previousQuestion.title}
                    </div>
                  </Link>
                ) : (
                  <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 text-sm text-gray-300">
                    已经是第一题
                  </div>
                )}

                {nextQuestion ? (
                  <Link
                    href={`/question/${nextQuestion.id}`}
                    className="group rounded-xl border border-blue-100 bg-blue-50/70 p-4 text-right transition-colors hover:border-blue-300 hover:bg-blue-100"
                  >
                    <div className="mb-2 flex items-center justify-end gap-2 text-sm font-semibold text-blue-600">
                      下一题
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                    <div className="line-clamp-2 text-sm font-medium text-gray-900">
                      {nextQuestion.title}
                    </div>
                  </Link>
                ) : (
                  <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 text-right text-sm text-gray-300">
                    已经是最后一题
                  </div>
                )}
              </div>
            </div>
          </article>

          {/* Right Sidebar: TOC */}
          <aside className="hidden w-56 flex-shrink-0 xl:block 2xl:w-64">
            {question.content && !access && (
              <QuestionToc toc={getMarkdownHeadings(question.content)} />
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

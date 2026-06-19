'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const parseTags = (value: string) =>
  Array.from(
    new Set(
      value
        .split(/[,，#\n]/)
        .map((tag) => tag.trim())
        .filter(Boolean)
    )
  ).slice(0, 12);

export default function QuestionContributionForm() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [source, setSource] = useState('');
  const [contact, setContact] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const tags = parseTags(tagsInput);

  const resetForm = () => {
    setTitle('');
    setContent('');
    setTagsInput('');
    setSource('');
    setContact('');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!user) {
      setError('请先登录后再投稿。');
      return;
    }

    if (!title.trim() || !content.trim()) {
      setError('问题标题和描述不能为空。');
      return;
    }

    if (tags.length === 0) {
      setError('请至少添加一个 tag，方便后续整理。');
      return;
    }

    setIsSubmitting(true);

    const supabase = createClient();
    const { error: insertError } = await supabase
      .from('interview_question_submissions')
      .insert({
        user_id: user.id,
        title: title.trim(),
        content: content.trim(),
        tags,
        source: source.trim() || null,
        contact: contact.trim() || null,
      });

    setIsSubmitting(false);

    if (insertError) {
      if (insertError.code === '42501') {
        setError('投稿权限还没有初始化，请先执行 .sql/setup_interview_contributions.sql。');
        return;
      }

      setError(insertError.message || '提交失败，请稍后再试。');
      return;
    }

    resetForm();
    setSuccess('投递已收到，管理员整理后会归入合适的专题或题集。');
  };

  return (
    <>
      <div className="relative overflow-hidden rounded-3xl border border-blue-100 bg-white p-5 shadow-sm">
        <div className="absolute right-[-3rem] top-[-3rem] h-32 w-32 rounded-full bg-blue-100/70 blur-2xl" />
        <div className="absolute bottom-[-3.5rem] left-12 h-24 w-24 rounded-full bg-cyan-100/80 blur-2xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-600">Build in Public</p>
            <h2 className="mt-1 text-2xl font-bold text-gray-950">有问题？快速投递给社区</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
              面试题、学习卡点、项目踩坑都可以先丢进来，打上 tag，平台再统一整理成专题和题集。
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setError('');
              setSuccess('');
              setIsOpen(true);
            }}
            className="inline-flex h-12 items-center justify-center rounded-2xl bg-gray-950 px-6 text-sm font-bold text-white shadow-lg shadow-gray-900/15 transition hover:-translate-y-0.5 hover:bg-blue-600"
          >
            我要投稿
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/40 px-4 py-8 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-gray-200 bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-6 border-b border-gray-100 bg-white/95 px-6 py-5 backdrop-blur">
              <div>
                <p className="text-sm font-semibold text-blue-600">面试题投稿</p>
                <h3 className="mt-1 text-2xl font-bold text-gray-950">快速投递一个问题</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full border border-gray-200 px-3 py-1 text-xl leading-none text-gray-500 transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900"
                aria-label="关闭投稿弹窗"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6">
              {!isLoading && !isAuthenticated && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  普通用户登录后即可投稿。
                  <Link
                    href="/login?redirect=/interview"
                    className="ml-2 font-bold text-amber-900 underline underline-offset-4"
                  >
                    去登录
                  </Link>
                </div>
              )}

              {success && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                  {success}
                </div>
              )}

              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </div>
              )}

              <label className="space-y-2">
                <span className="text-sm font-semibold text-gray-800">问题标题</span>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="例如：ERC20 approve 和 permit 的区别是什么？"
                  className="h-12 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-gray-800">Tags</span>
                <input
                  value={tagsInput}
                  onChange={(event) => setTagsInput(event.target.value)}
                  placeholder="例如：Solidity, ERC20, AI Agent, Next.js"
                  className="h-12 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
                <div className="flex flex-wrap gap-2">
                  {tags.length > 0 ? (
                    tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700"
                      >
                        #{tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400">用逗号、# 或换行分隔，最多保留 12 个 tag。</span>
                  )}
                </div>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-gray-800">问题描述 / 背景</span>
                <textarea
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder="可以只写问题，也可以补充面试场景、学习卡点、你已经尝试过的方案或希望社区整理的方向。"
                  rows={8}
                  className="w-full resize-y rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm leading-6 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-gray-800">来源 / 场景</span>
                  <input
                    value={source}
                    onChange={(event) => setSource(event.target.value)}
                    placeholder="可选：面试、课程、项目、工作场景"
                    className="h-12 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-gray-800">联系方式</span>
                  <input
                    value={contact}
                    onChange={(event) => setContact(event.target.value)}
                    placeholder="可选：方便审核时联系你"
                    className="h-12 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </label>
              </div>

              <div className="flex flex-col gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs leading-5 text-gray-500">
                  投递内容会先进入整理队列，不会强制归属到任何题集。
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="h-11 rounded-2xl border border-gray-200 px-5 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={!isAuthenticated || isSubmitting}
                    className="h-11 rounded-2xl bg-blue-600 px-6 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none"
                  >
                    {isSubmitting ? '提交中...' : '提交投稿'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

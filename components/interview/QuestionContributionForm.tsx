'use client';

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { FormOutlined } from '@ant-design/icons';
import { platformBrowser, PlatformError } from '@/lib/platform/client';
import { useAuth } from '@/hooks/useAuth';
import {
  INTERVIEW_SUBMISSION_ATTACHMENT_ACCEPT,
  uploadInterviewSubmissionAttachment,
  validateInterviewSubmissionAttachment,
} from '@/lib/uploadInterviewSubmissionAttachment';

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
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const tags = parseTags(tagsInput);

  useEffect(() => {
    if (isOpen) dialogRef.current?.showModal();
  }, [isOpen]);

  const resetForm = () => {
    setTitle('');
    setContent('');
    setTagsInput('');
    setSource('');
    setContact('');
    setAttachmentFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const clearAttachment = () => {
    setAttachmentFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;

    if (!file) {
      setAttachmentFile(null);
      return;
    }

    const validationError = validateInterviewSubmissionAttachment(file);

    if (validationError) {
      setAttachmentFile(null);
      setError(validationError);
      event.target.value = '';
      return;
    }

    setError('');
    setAttachmentFile(file);
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

    if (attachmentFile) {
      const validationError = validateInterviewSubmissionAttachment(attachmentFile);

      if (validationError) {
        setError(validationError);
        return;
      }
    }

    setIsSubmitting(true);
    let uploadedAttachmentPath: string | null = null;
    let attachmentName: string | null = null;
    let attachmentMimeType: string | null = null;

    if (attachmentFile) {
      const uploadResult = await uploadInterviewSubmissionAttachment(attachmentFile);

      if ('error' in uploadResult) {
        setIsSubmitting(false);
        setError(uploadResult.error);
        return;
      }

      uploadedAttachmentPath = uploadResult.path;
      attachmentName = uploadResult.fileName;
      attachmentMimeType = uploadResult.mimeType;
    }

    try {
      await platformBrowser('/api/platform/interview/submissions', {
        method: 'POST',
        body: {
          title: title.trim(),
          content: content.trim(),
          contact: contact.trim() || null,
          source: source.trim() || null,
          tags,
          attachment_path: uploadedAttachmentPath,
          attachment_name: attachmentName,
          attachment_mime_type: attachmentMimeType,
        },
      });
    } catch (submitError) {
      setIsSubmitting(false);
      const code = submitError instanceof PlatformError ? submitError.code : undefined;
      if (code === '42501') {
        setError('投稿权限还没有初始化，请先执行 .sql/setup_interview_contributions.sql。');
        return;
      }

      if (code === 'PGRST204') {
        setError('投稿附件字段尚未初始化，请在 Supabase 执行 .sql/add_interview_submission_attachments.sql。');
        return;
      }

      setError(submitError instanceof Error ? submitError.message : '提交失败，请稍后再试。');
      return;
    }

    setIsSubmitting(false);

    resetForm();
    setSuccess('投递已收到，管理员整理后会归入合适的专题或题集。');
  };

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => {
          setError('');
          setSuccess('');
          setIsOpen(true);
        }}
        className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-700 transition-colors hover:border-sky-300 hover:text-sky-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 sm:px-4"
      >
        <FormOutlined aria-hidden="true" />
        我要投稿
      </button>

      {isOpen && (
        <dialog
          ref={dialogRef}
          aria-labelledby="submission-heading"
          onClose={() => setIsOpen(false)}
          className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-3xl overflow-y-auto rounded-lg border border-slate-200 bg-white text-slate-900 shadow-xl backdrop:bg-black/45"
        >
          <div className="sticky top-0 z-10 flex items-start justify-between gap-6 border-b border-gray-100 bg-white/95 px-6 py-5 backdrop-blur">
            <div>
              <h2 id="submission-heading" className="text-xl font-black text-slate-950">分享一道面试题</h2>
            </div>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="rounded-full border border-gray-200 px-3 py-1 text-xl leading-none text-gray-500 transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900"
              aria-label="关闭投稿弹窗"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6">
            {!isLoading && !isAuthenticated && (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
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
              <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                {success}
              </div>
            )}

            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-gray-800">问题标题</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="例如：ERC20 approve 和 permit 的区别是什么？"
                className="h-12 w-full rounded-md border border-gray-200 bg-gray-50 px-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-gray-800">Tags</span>
              <input
                value={tagsInput}
                onChange={(event) => setTagsInput(event.target.value)}
                placeholder="例如：Solidity, ERC20, AI Agent, Next.js"
                className="h-12 w-full rounded-md border border-gray-200 bg-gray-50 px-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
              />
              <div className="flex flex-wrap gap-2">
                {tags.length > 0 ? (
                  tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700"
                    >
                      #{tag}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-400">用逗号、# 或换行分隔，最多保留 12 个 tag。</span>
                )}
              </div>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-gray-800">问题描述 / 背景</span>
              <textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="可以只写问题，也可以补充面试场景、学习卡点、你已经尝试过的方案或希望社区整理的方向。"
                rows={8}
                className="w-full resize-y rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm leading-6 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-gray-800">来源 / 场景</span>
                <input
                  value={source}
                  onChange={(event) => setSource(event.target.value)}
                  placeholder="可选：面试、课程、项目、工作场景"
                  className="h-12 w-full rounded-md border border-gray-200 bg-gray-50 px-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-gray-800">联系方式</span>
                <input
                  value={contact}
                  onChange={(event) => setContact(event.target.value)}
                  placeholder="可选：方便审核时联系你"
                  className="h-12 w-full rounded-md border border-gray-200 bg-gray-50 px-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
                />
              </label>
            </div>

            <label className="block space-y-3">
              <span className="text-sm font-semibold text-gray-800">附件资料</span>
              <div className="rounded-md border border-dashed border-sky-200 bg-sky-50/50 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      支持上传 PDF、Word、Excel
                    </p>
                    <p className="mt-1 text-xs leading-5 text-gray-500">
                      可选，最多 1 个附件，单文件不超过 20MB。
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={INTERVIEW_SUBMISSION_ATTACHMENT_ACCEPT}
                    onChange={handleFileChange}
                    className="block w-full max-w-xs cursor-pointer text-sm text-gray-600 file:mr-4 file:rounded-xl file:border-0 file:bg-gray-950 file:px-4 file:py-2 file:text-sm file:font-bold file:text-white hover:file:bg-blue-600"
                  />
                </div>

                {attachmentFile ? (
                  <div className="mt-3 flex flex-col gap-2 rounded-md border border-sky-100 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{attachmentFile.name}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {(attachmentFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={clearAttachment}
                      className="h-10 rounded-xl border border-gray-200 px-4 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
                    >
                      移除附件
                    </button>
                  </div>
                ) : (
                  <p className="mt-3 text-xs leading-5 text-gray-500">
                    适合补充题目截图、题面 PDF、整理过的 Excel 表格等资料。
                  </p>
                )}
              </div>
            </label>

            <div className="flex flex-col gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-5 text-gray-500">
                投递内容会先进入整理队列，不会强制归属到任何题集。
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => dialogRef.current?.close()}
                  className="h-11 rounded-md border border-gray-200 px-5 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={!isAuthenticated || isSubmitting}
                  className="h-11 rounded-md bg-blue-600 px-6 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none"
                >
                  {isSubmitting ? '提交中...' : '提交投稿'}
                </button>
              </div>
            </div>
          </form>
        </dialog>
      )}
    </>
  );
}

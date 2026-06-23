'use client';

import { FormEvent, useEffect, useState } from 'react';

type MembershipConsultationModalProps = {
  open: boolean;
  onClose: () => void;
  source?: string;
};

export default function MembershipConsultationModal({
  open,
  onClose,
  source = 'unknown',
}: MembershipConsultationModalProps) {
  const [phone, setPhone] = useState('');
  const [wechat, setWechat] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, isSubmitting, onClose]);

  const resetForm = () => {
    setPhone('');
    setWechat('');
    setNote('');
    setError('');
    setSuccess('');
  };

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
    resetForm();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedPhone = phone.trim();
    const normalizedWechat = wechat.trim();

    if (!normalizedPhone) {
      setError('请填写手机号');
      return;
    }

    if (!normalizedWechat) {
      setError('请填写微信号');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/membership-consultation-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: normalizedPhone,
          wechat: normalizedWechat,
          note: note.trim() || null,
          source,
        }),
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(body.error || '提交失败，请稍后再试');
      }

      setSuccess('提交成功，我会尽快通过微信或手机号联系你完成开通。');
      setPhone('');
      setWechat('');
      setNote('');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '提交失败，请稍后再试');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="border-b border-gray-100 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-blue-600">永久会员咨询</p>
              <h2 className="mt-1 text-2xl font-bold text-gray-950">提交开通意向</h2>
              <p className="mt-2 text-sm leading-6 text-gray-500">
                目前暂未接入线上支付，提交后我会主动联系你完成支付和开通。
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              aria-label="关闭会员咨询"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 px-6 py-5">
            <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
              <p className="text-sm font-semibold text-gray-900">尊享永久会员</p>
              <p className="mt-1 text-sm text-gray-600">
                限时 ¥129 / 永久 · 解锁全部面试题、模拟面试与专属答疑
              </p>
            </div>

            <label className="block">
              <span className="text-sm font-semibold text-gray-800">手机号 *</span>
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="请输入手机号"
                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-gray-800">微信号 *</span>
              <input
                value={wechat}
                onChange={(event) => setWechat(event.target.value)}
                placeholder="请输入微信号"
                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-gray-800">备注</span>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="可填写想咨询的问题、方便联系的时间等"
                rows={3}
                className="mt-2 w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </label>

            {error && (
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700">
                {success}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {isSubmitting ? '提交中...' : '提交咨询'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

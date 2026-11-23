"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ContactResponse = {
  contacts?: {
    email?: string | null;
    phone?: string | null;
    wechat?: string | null;
    telegram?: string | null;
  };
  isMember?: boolean;
  unlocked?: boolean;
  limit?: number;
  used?: number;
  remaining?: number | null;
  message?: string;
  error?: string;
  code?: string;
};

export default function JobContactPanel({ jobId }: { jobId: string }) {
  const [data, setData] = useState<ContactResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadContacts = async (mode?: "status") => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const url =
        mode === "status"
          ? `/api/jobs/${jobId}/contact?mode=status`
          : `/api/jobs/${jobId}/contact`;
      const response = await fetch(url, {
        method: mode === "status" ? "GET" : "POST",
        headers: { Accept: "application/json" },
      });
      const payload = (await response.json()) as ContactResponse;
      setData(payload);
    } catch {
      setData({ error: "网络异常，暂时无法获取联系方式" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadContacts("status");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  const contacts = data?.contacts;
  const hasContact =
    contacts?.email ||
    contacts?.phone ||
    contacts?.wechat ||
    contacts?.telegram;

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900">岗位联系方式</h3>
          <p className="mt-2 text-xs leading-6 text-slate-600">
            普通用户每月可免费查看 3 个岗位的联系方式，会员不限次数。
          </p>
        </div>
      </div>

      {data?.unlocked && contacts ? (
        <div className="mt-4 space-y-3">
          <ContactRow label="邮箱" value={contacts.email} />
          <ContactRow label="手机" value={contacts.phone} />
          <ContactRow label="微信" value={contacts.wechat} />
          <ContactRow label="Telegram" value={contacts.telegram} />

          {!hasContact && (
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
              这个岗位暂时没有同步到明确联系方式。
            </div>
          )}

          {data.message && (
            <p className="text-xs leading-6 text-slate-600">{data.message}</p>
          )}
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-4">
            <div className="space-y-2 text-sm text-slate-700">
              <SkeletonLine label="邮箱 / 手机" />
              <SkeletonLine label="微信 / Telegram" />
            </div>
          </div>
          <button
            type="button"
            onClick={() => loadContacts()}
            disabled={isLoading}
            className="w-full rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "正在确认..." : "查看联系方式"}
          </button>
          {data?.error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
              <p>{data.error}</p>
              {data.code === "MONTHLY_LIMIT_REACHED" && (
                <Link
                  href="/profile"
                  className="mt-2 inline-flex font-bold text-blue-700 hover:underline"
                >
                  去开通会员 →
                </Link>
              )}
              {data.code === "AUTH_REQUIRED" && (
                <Link
                  href="/login"
                  className="mt-2 inline-flex font-bold text-blue-700 hover:underline"
                >
                  去登录 →
                </Link>
              )}
            </div>
          )}
          {typeof data?.remaining === "number" && (
            <p className="text-xs text-slate-500">
              本月剩余 {data.remaining} / {data.limit ?? 3} 次免费查看机会
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function ContactRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 break-all text-sm font-bold text-slate-900">{value}</p>
    </div>
  );
}

function SkeletonLine({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span>{label}</span>
      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">
        解锁后可见
      </span>
    </div>
  );
}

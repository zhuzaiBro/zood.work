"use client";

import Link from "next/link";
import { useState } from "react";

type ContactResponse = {
  contacts?: {
    applyUrl?: string | null;
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

  const loadContacts = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/jobs/${jobId}/contact`, {
        method: "GET",
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

  const contacts = data?.contacts;
  const hasContact =
    contacts?.applyUrl ||
    contacts?.email ||
    contacts?.phone ||
    contacts?.wechat ||
    contacts?.telegram;

  return (
    <div className="rounded-[26px] border border-[#75c0f7]/18 bg-[#071225]/86 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-black text-white">岗位联系方式</h3>
          <p className="mt-2 text-xs leading-6 text-slate-400">
            普通用户每月可免费查看 3 个岗位联系方式；会员可无限查看。
          </p>
        </div>
        <span className="rounded-full bg-[#75c0f7]/12 px-3 py-1 text-xs font-bold text-[#75c0f7]">
          {data?.isMember ? "会员直看" : "3 次/月"}
        </span>
      </div>

      {data?.unlocked && contacts ? (
        <div className="mt-4 space-y-3">
          {contacts.applyUrl && (
            <a
              href={contacts.applyUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between rounded-2xl bg-[#75c0f7] px-4 py-3 text-sm font-black text-[#041020] transition hover:bg-sky-200"
            >
              去来源站投递
              <span>↗</span>
            </a>
          )}
          <ContactRow label="邮箱" value={contacts.email} />
          <ContactRow label="手机" value={contacts.phone} />
          <ContactRow label="微信" value={contacts.wechat} />
          <ContactRow label="Telegram" value={contacts.telegram} />

          {!hasContact && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-300">
              这个岗位暂时没有同步到明确联系方式。
            </div>
          )}

          {data.message && (
            <p className="text-xs leading-6 text-slate-400">{data.message}</p>
          )}
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4">
            <div className="space-y-2 text-sm text-slate-300">
              <SkeletonLine label="来源投递链接" />
              <SkeletonLine label="邮箱 / 微信 / Telegram" />
            </div>
          </div>
          <button
            type="button"
            onClick={loadContacts}
            disabled={isLoading}
            className="w-full rounded-2xl bg-[#75c0f7] px-5 py-3 text-sm font-black text-[#041020] transition hover:bg-sky-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "正在解锁..." : "查看联系方式"}
          </button>
          {data?.error && (
            <div className="rounded-2xl border border-red-300/20 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-100">
              <p>{data.error}</p>
              {data.code === "MONTHLY_LIMIT_REACHED" && (
                <Link
                  href="/profile"
                  className="mt-2 inline-flex font-bold text-[#75c0f7] hover:text-sky-200"
                >
                  去开通会员 →
                </Link>
              )}
              {data.code === "AUTH_REQUIRED" && (
                <Link
                  href="/login"
                  className="mt-2 inline-flex font-bold text-[#75c0f7] hover:text-sky-200"
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
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 break-all text-sm font-bold text-slate-100">{value}</p>
    </div>
  );
}

function SkeletonLine({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span>{label}</span>
      <span className="rounded-full bg-slate-500/20 px-3 py-1 text-xs text-slate-500">
        解锁后可见
      </span>
    </div>
  );
}

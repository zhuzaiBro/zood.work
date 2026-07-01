import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";

const MONTHLY_FREE_UNLOCK_LIMIT = 3;

type Params = Promise<{ id: string }>;

type JobContact = {
  id: string;
  title: string | null;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  wechat: string | null;
  telegram: string | null;
};

export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const { id } = await params;
    const mode = request.nextUrl.searchParams.get("mode");
    const isStatusOnly = mode === "status";
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          error: "请先登录后查看岗位联系方式",
          code: "AUTH_REQUIRED",
        },
        { status: 401 }
      );
    }

    const admin = createAdminClient();

    const { data: profile, error: profileError } = await admin
      .from("user_profiles")
      .select("id, vip_level")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    const isMember = (profile?.vip_level ?? 0) > 0;
    const { data: jobData, error: jobError } = await (admin as any)
      .from("job_listings")
      .select("id, title, company_name, email, phone, wechat, telegram")
      .eq("id", id)
      .maybeSingle();

    if (jobError) {
      return NextResponse.json({ error: jobError.message }, { status: 500 });
    }
    const job = jobData as JobContact | null;
    if (!job) {
      return NextResponse.json({ error: "岗位不存在" }, { status: 404 });
    }

    const monthStart = getShanghaiMonthStart();
    const { data: existingUnlock, error: existingError } = await (admin as any)
      .from("job_contact_unlocks")
      .select("id, access_type, month_start")
      .eq("user_id", user.id)
      .eq("job_id", job.id)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json({ error: existingError.message }, { status: 500 });
    }

    const quotaUsed = await countMonthlyQuotaUnlocks(admin, user.id, monthStart);
    const hasInvalidMemberUnlock =
      Boolean(existingUnlock) &&
      existingUnlock.access_type === "member" &&
      !isMember;
    const hasExistingUnlock = Boolean(existingUnlock) && !hasInvalidMemberUnlock;
    let remaining = Math.max(0, MONTHLY_FREE_UNLOCK_LIMIT - quotaUsed);

    if (isStatusOnly) {
      const shouldReveal = isMember || hasExistingUnlock;
      return NextResponse.json({
        job: {
          id: job.id,
          title: job.title,
          companyName: job.company_name,
        },
        contacts: shouldReveal ? normalizeContacts(job) : undefined,
        isMember,
        unlocked: shouldReveal,
        limit: MONTHLY_FREE_UNLOCK_LIMIT,
        used: quotaUsed,
        remaining: isMember ? null : remaining,
        message: isMember
          ? "已解锁岗位联系方式"
          : hasExistingUnlock
            ? "该岗位已解锁，本月额度不会重复扣除"
            : undefined,
      });
    }

    if (!isMember && !hasExistingUnlock && remaining <= 0) {
      return NextResponse.json(
        {
          error: "本月免费查看次数已用完，开通会员后可无限查看岗位联系方式",
          code: "MONTHLY_LIMIT_REACHED",
          isMember,
          limit: MONTHLY_FREE_UNLOCK_LIMIT,
          used: quotaUsed,
          remaining: 0,
        },
        { status: 403 }
      );
    }

    if (!hasExistingUnlock) {
      const accessType = isMember ? "member" : "quota";
      const { error: insertError } = hasInvalidMemberUnlock
        ? await (admin as any)
            .from("job_contact_unlocks")
            .update({
              month_start: monthStart,
              access_type: accessType,
            })
            .eq("id", existingUnlock.id)
        : await (admin as any)
            .from("job_contact_unlocks")
            .insert({
              user_id: user.id,
              job_id: job.id,
              month_start: monthStart,
              access_type: accessType,
            });

      if (insertError && insertError.code !== "23505") {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }

      if (!isMember) {
        remaining = Math.max(0, remaining - 1);
      }
    }

    return NextResponse.json({
      job: {
        id: job.id,
        title: job.title,
        companyName: job.company_name,
      },
      contacts: normalizeContacts(job),
      isMember,
      unlocked: true,
      limit: MONTHLY_FREE_UNLOCK_LIMIT,
      used: isMember
        ? quotaUsed
        : hasExistingUnlock
          ? quotaUsed
          : quotaUsed + 1,
      remaining: isMember ? null : remaining,
      message: isMember
        ? "已解锁岗位联系方式"
        : hasExistingUnlock
          ? "该岗位已解锁，本月额度不会重复扣除"
          : `已使用 1 次免费查看机会，本月剩余 ${remaining} 次`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "获取岗位联系方式失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function countMonthlyQuotaUnlocks(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  monthStart: string
) {
  const { count, error } = await (admin as any)
    .from("job_contact_unlocks")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("month_start", monthStart)
    .eq("access_type", "quota");

  if (error) {
    throw new Error(error.message);
  }
  return count ?? 0;
}

function normalizeContacts(job: JobContact) {
  return {
    email: job.email,
    phone: job.phone,
    wechat: job.wechat,
    telegram: job.telegram,
  };
}

function getShanghaiMonthStart() {
  const now = new Date();
  const shanghaiTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const year = shanghaiTime.getUTCFullYear();
  const month = String(shanghaiTime.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}-01`;
}

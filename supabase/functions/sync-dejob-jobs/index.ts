import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SOURCE_SLUG = "dejob";

type DejobTag = { tagId: number; tagName: string };

type DejobJob = {
  topicId: number;
  user?: Record<string, unknown>;
  isTopJob?: boolean;
  content?: string;
  content2?: string;
  content3?: string;
  content5?: string;
  email?: string;
  phone?: string;
  wechat?: string;
  telegram?: string;
  positionName?: string;
  positionId?: number;
  viewCount?: number;
  applyCount?: number;
  createTime?: number;
  url?: string;
  workTypeId?: number;
  workTypeName?: string;
  officeModeId?: number;
  officeModeName?: string;
  company?: string;
  companyIntroduction?: string;
  companySizeName?: string;
  companyLogo?: string;
  companyWebsite?: string;
  companyId?: number;
  minSalary?: number;
  maxSalary?: number;
  leverId?: number;
  leverName?: string;
  location?: string;
  tags?: DejobTag[];
  base?: string;
  status?: number;
};

type DejobListResponse = {
  errorCode: number;
  message?: string;
  data?: {
    page?: { page: number; limit: number; total: number };
    results?: DejobJob[];
  };
  success?: boolean;
};

type DejobDetailResponse = {
  errorCode: number;
  message?: string;
  data?: DejobJob;
  success?: boolean;
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function msToIso(ms?: number) {
  if (!ms) return null;
  return new Date(ms).toISOString();
}

function mapDejobToRow(sourceId: string, job: DejobJob) {
  return {
    source_id: sourceId,
    external_id: String(job.topicId),
    title: job.positionName ?? null,
    position_id: job.positionId ?? null,
    status: job.status ?? 0,
    description: job.content ?? null,
    requirements: job.content2 ?? null,
    benefits: job.content3 ?? null,
    extra_content: job.content5 ?? null,
    company_name: job.company ?? null,
    company_external_id: job.companyId != null ? String(job.companyId) : null,
    company_intro: job.companyIntroduction ?? null,
    company_logo: job.companyLogo ?? null,
    company_website: job.companyWebsite ?? null,
    company_size: job.companySizeName ?? null,
    work_type_id: job.workTypeId ?? null,
    work_type_name: job.workTypeName ?? null,
    office_mode_id: job.officeModeId ?? null,
    office_mode_name: job.officeModeName ?? null,
    location: job.location ?? null,
    base_location: job.base ?? null,
    min_salary: job.minSalary ?? null,
    max_salary: job.maxSalary ?? null,
    email: job.email ?? null,
    phone: job.phone ?? null,
    wechat: job.wechat ?? null,
    telegram: job.telegram ?? null,
    source_url: job.url ?? null,
    tags: job.tags ?? [],
    is_top_job: job.isTopJob ?? false,
    urgency_id: job.leverId ?? null,
    urgency_name: job.leverName ?? null,
    view_count: job.viewCount ?? 0,
    apply_count: job.applyCount ?? 0,
    publisher: job.user ?? null,
    raw_data: job,
    source_created_at: msToIso(job.createTime),
    last_synced_at: new Date().toISOString(),
  };
}

async function fetchDejob<T>(
  url: string,
  token: string,
  referer: string,
): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json, text/plain, */*",
      "Accept-Language": "zh",
      Referer: referer,
      "User-Agent":
        "Mozilla/5.0 (compatible; ZoodJobSync/1.0; +https://zood.work)",
      "X-User-Token": token,
    },
  });

  if (!response.ok) {
    throw new Error(`DeJob API ${response.status}: ${url}`);
  }

  return (await response.json()) as T;
}

Deno.serve(async (req) => {
  const cronSecret = Deno.env.get("CRON_SECRET");
  const requestSecret = req.headers.get("x-cron-secret");

  if (!cronSecret || requestSecret !== cronSecret) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const dejobToken = Deno.env.get("DEJOB_USER_TOKEN");

  if (!supabaseUrl || !serviceRoleKey || !dejobToken) {
    return jsonResponse({ error: "Missing required environment variables" }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: source, error: sourceError } = await supabase
    .from("job_sources")
    .select("id, base_url, sync_config")
    .eq("slug", SOURCE_SLUG)
    .eq("is_active", true)
    .single();

  if (sourceError || !source) {
    return jsonResponse({ error: "Job source not found", detail: sourceError }, 404);
  }

  const syncConfig = (source.sync_config ?? {}) as Record<string, unknown>;
  const page = Number(syncConfig.page ?? 1);
  const limit = Number(syncConfig.limit ?? 20);
  const listPath = String(syncConfig.list_path ?? "/api/worker/topics");
  const detailTemplate = String(
    syncConfig.detail_path_template ?? "/api/worker/{id}",
  );
  const baseUrl = String(source.base_url ?? "https://dejob.ai").replace(/\/$/, "");

  const { data: run, error: runError } = await supabase
    .from("job_sync_runs")
    .insert({ source_id: source.id, status: "running" })
    .select("id")
    .single();

  if (runError || !run) {
    return jsonResponse({ error: "Failed to create sync run", detail: runError }, 500);
  }

  let jobsFetched = 0;
  let jobsCreated = 0;
  let jobsSkipped = 0;
  let jobsFailed = 0;
  let errorMessage: string | null = null;

  try {
    const listUrl =
      `${baseUrl}${listPath}?page=${page}&limit=${limit}`;
    const listPayload = await fetchDejob<DejobListResponse>(
      listUrl,
      dejobToken,
      `${baseUrl}/job`,
    );

    if (listPayload.errorCode !== 0 || !listPayload.data?.results) {
      throw new Error(listPayload.message || "Invalid DeJob list response");
    }

    const results = listPayload.data.results;
    jobsFetched = results.length;

    const externalIds = results.map((item) => String(item.topicId));
    const { data: existingRows, error: existingError } = await supabase
      .from("job_listings")
      .select("external_id")
      .eq("source_id", source.id)
      .in("external_id", externalIds);

    if (existingError) {
      throw existingError;
    }

    const existingSet = new Set((existingRows ?? []).map((row) => row.external_id));

    for (const item of results) {
      const externalId = String(item.topicId);

      if (existingSet.has(externalId)) {
        jobsSkipped += 1;
        continue;
      }

      try {
        const detailPath = detailTemplate.replace("{id}", externalId);
        const detailUrl = `${baseUrl}${detailPath}`;
        const detailPayload = await fetchDejob<DejobDetailResponse>(
          detailUrl,
          dejobToken,
          `${baseUrl}/jobDetail?id=${externalId}`,
        );

        if (detailPayload.errorCode !== 0 || !detailPayload.data) {
          throw new Error(detailPayload.message || `Detail fetch failed: ${externalId}`);
        }

        const row = mapDejobToRow(source.id, detailPayload.data);
        const { error: insertError } = await supabase
          .from("job_listings")
          .insert(row);

        if (insertError) {
          throw insertError;
        }

        jobsCreated += 1;
        existingSet.add(externalId);
      } catch (error) {
        jobsFailed += 1;
        console.error(`Failed to sync job ${externalId}:`, error);
      }
    }
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : String(error);
  }

  const finalStatus = errorMessage ? "failed" : "success";

  await supabase
    .from("job_sync_runs")
    .update({
      status: finalStatus,
      jobs_fetched: jobsFetched,
      jobs_created: jobsCreated,
      jobs_skipped: jobsSkipped,
      jobs_failed: jobsFailed,
      error_message: errorMessage,
      finished_at: new Date().toISOString(),
    })
    .eq("id", run.id);

  if (errorMessage) {
    return jsonResponse(
      {
        ok: false,
        run_id: run.id,
        jobs_fetched: jobsFetched,
        jobs_created: jobsCreated,
        jobs_skipped: jobsSkipped,
        jobs_failed: jobsFailed,
        error: errorMessage,
      },
      500,
    );
  }

  return jsonResponse({
    ok: true,
    run_id: run.id,
    jobs_fetched: jobsFetched,
    jobs_created: jobsCreated,
    jobs_skipped: jobsSkipped,
    jobs_failed: jobsFailed,
  });
});

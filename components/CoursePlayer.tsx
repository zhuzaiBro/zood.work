"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Hls from "hls.js";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database.types";
import { useAuth } from "@/hooks/useAuth";
import { videoApiUrl } from "@/lib/videoApi";
import CodeBlock from "@/components/CodeBlock";
import LessonDocumentViewer from "@/components/LessonDocumentViewer";
import { extractLessonCodeExamples } from "@/lib/lessonCodeExamples";
import {
  hasLessonDocument,
  isDocumentOnlyLesson,
} from "@/lib/lessonContent";

interface Lesson {
  id: string;
  title: string;
  description?: string | null;
  duration?: string;
  durationSeconds?: number;
  isFree: boolean;
  hasVideo?: boolean;
  isLocked: boolean;
  coursewareName?: string | null;
  coursewareUrl?: string | null;
  contentHtml?: string | null;
  contentMarkdown?: string | null;
  videoUrl?: string | null;
  videoId?: string | null; // 外部 Video Manager API 的视频 ID
  accessReason?: "login" | "purchase" | null;
}

interface Chapter {
  id: string;
  title: string;
  lessons: Lesson[];
}

interface CourseDetail {
  id: string;
  title: string;
  description?: string | null;
  coverImageUrl?: string | null;
  price: number;
  isFree: boolean;
  hasAccess: boolean;
  accessSource?: "free" | "admin" | "enrollment" | "none";
  status: string;
  createdAt?: string | null;
}

interface CoursePlayerProps {
  courseId?: string;
  courseTitle?: string;
}

interface LessonProgress {
  lesson_id: string;
  video_id: string | null;
  current_seconds: number;
  duration_seconds: number | null;
  last_watched_at: string;
}

interface LocalLessonProgress {
  courseId?: string;
  lessonId: string;
  videoId?: string;
  currentSeconds: number;
  durationSeconds?: number;
  updatedAt: string;
}

type CourseRow = Database["public"]["Tables"]["courses"]["Row"];
type ChapterRow = Database["public"]["Tables"]["chapters"]["Row"];
type LessonRow = Database["public"]["Tables"]["lessons"]["Row"];

const progressStorageKey = (courseId?: string) =>
  `zood.lesson-progress.${courseId || "default"}`;

const formatLessonDuration = (seconds: number | null): string | undefined => {
  if (!seconds || seconds <= 0) return undefined;

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }

  return `${minutes}:${secs.toString().padStart(2, "0")}`;
};

const mapCourseRow = (course: CourseRow): CourseDetail => ({
  id: course.id,
  title: course.title,
  description: course.description,
  coverImageUrl: course.cover_image_url,
  price: Number(course.price) || 0,
  isFree: course.is_free,
  hasAccess: course.is_free,
  accessSource: course.is_free ? "free" : "none",
  status: course.status,
  createdAt: course.created_at,
});

const mapChaptersAndLessons = (
  chapterRows: ChapterRow[],
  lessonRows: LessonRow[],
  courseRow: CourseRow,
  viewerLoggedIn: boolean,
): Chapter[] =>
  chapterRows.map((chapter) => ({
    id: chapter.id,
    title: chapter.title,
    lessons: lessonRows
      .filter((lesson) => lesson.chapter_id === chapter.id)
      .map((lesson) => {
        const isLessonFree = Boolean(lesson.is_free);
        const hasVideo = Boolean(lesson.video_id?.trim());
        const canWatchVideo =
          hasVideo && viewerLoggedIn && (courseRow.is_free || isLessonFree);
        const accessReason = !hasVideo
          ? null
          : !viewerLoggedIn
            ? "login"
            : canWatchVideo
              ? null
              : "purchase";

        return {
          id: lesson.id,
          title: lesson.title,
          description: lesson.description,
          coursewareName: lesson.courseware_name,
          coursewareUrl: lesson.courseware_url,
          contentHtml: lesson.content_html,
          contentMarkdown: lesson.content_markdown,
          duration: formatLessonDuration(lesson.duration),
          durationSeconds: lesson.duration ?? undefined,
          isFree: isLessonFree,
          hasVideo,
          isLocked: hasVideo && !canWatchVideo,
          accessReason,
          videoUrl: canWatchVideo ? lesson.video_url : null,
          videoId: canWatchVideo ? lesson.video_id : null,
        };
      }),
  }));

const fetchPublicCourseFromSupabase = async (
  targetCourseId: string,
  viewerLoggedIn: boolean,
): Promise<{ course: CourseDetail; chapters: Chapter[] } | null> => {
  const supabase = createClient();
  const { data: courseData, error: courseError } = await supabase
    .from("courses")
    .select(
      "id,title,description,cover_image_url,price,is_free,status,created_at,created_by,updated_at",
    )
    .eq("id", targetCourseId)
    .eq("status", "published")
    .maybeSingle();

  if (courseError) throw courseError;
  const course = courseData as CourseRow | null;
  if (!course) return null;

  const { data: chapterData, error: chaptersError } = await supabase
    .from("chapters")
    .select("id,course_id,title,description,sort_order,created_at,updated_at")
    .eq("course_id", targetCourseId)
    .order("sort_order", { ascending: true });

  if (chaptersError) throw chaptersError;

  const chapterRows = (chapterData ?? []) as ChapterRow[];
  const chapterIds = chapterRows.map((chapter) => chapter.id);
  let lessons: LessonRow[] = [];

  if (chapterIds.length > 0) {
    const canLoadPublicVideoFields = viewerLoggedIn && course.is_free;
    const lessonSelect = canLoadPublicVideoFields
      ? "id,chapter_id,title,description,courseware_name,courseware_url,content_html,content_markdown,video_id,video_url,duration,is_free,is_locked,sort_order,created_at,updated_at"
      : "id,chapter_id,title,description,courseware_name,courseware_url,content_html,content_markdown,duration,is_free,is_locked,sort_order,created_at,updated_at";
    const { data: lessonData, error: lessonsError } = await supabase
      .from("lessons")
      .select(lessonSelect)
      .in("chapter_id", chapterIds)
      .order("sort_order", { ascending: true });

    if (lessonsError) throw lessonsError;
    lessons = (lessonData ?? []) as LessonRow[];
  }

  return {
    course: mapCourseRow(course),
    chapters: mapChaptersAndLessons(chapterRows, lessons, course, viewerLoggedIn),
  };
};

const fetchFirstPublishedCourseFromSupabase = async (
  viewerLoggedIn: boolean,
): Promise<{ course: CourseDetail; chapters: Chapter[] } | null> => {
  const supabase = createClient();
  const { data: courseData, error } = await supabase
    .from("courses")
    .select(
      "id,title,description,cover_image_url,price,is_free,status,created_at,created_by,updated_at",
    )
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) throw error;

  const courses = (courseData ?? []) as CourseRow[];
  const firstCourse = courses?.[0];
  if (!firstCourse) return null;

  return fetchPublicCourseFromSupabase(firstCourse.id, viewerLoggedIn);
};

export default function CoursePlayer({
  courseId,
  courseTitle,
}: CoursePlayerProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("catalog");
  const [selectedChapter, setSelectedChapter] = useState<string>("all");
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(
    new Set()
  );
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [learningWorkspaceTab, setLearningWorkspaceTab] = useState("courseware");
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [purchasePhone, setPurchasePhone] = useState("");
  const [purchaseWechat, setPurchaseWechat] = useState("");
  const [purchaseNote, setPurchaseNote] = useState("");
  const [purchaseError, setPurchaseError] = useState("");
  const [purchaseSuccess, setPurchaseSuccess] = useState("");
  const [isSubmittingPurchase, setIsSubmittingPurchase] = useState(false);

  // 视频播放器相关状态
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerAnchorRef = useRef<HTMLDivElement>(null);
  const streamContainerRef = useRef<HTMLDivElement>(null);
  const [isMiniPlayer, setIsMiniPlayer] = useState(false);
  const [miniPlayerDismissed, setMiniPlayerDismissed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playerStatus, setPlayerStatus] = useState("");
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const pendingResumeTimeRef = useRef(0);
  const resumeAppliedLessonRef = useRef<string | null>(null);
  const lastProgressSaveAtRef = useRef(0);

  const tabs = [
    { id: "catalog", label: "课程目录" },
    { id: "details", label: "课程详情" },
    { id: "homework", label: "随堂作业" },
    { id: "faq", label: "常见问题" },
  ];

  const isPaidCourse = Boolean(course && !course.isFree);
  const hasCourseAccess = Boolean(course?.hasAccess);
  const shouldShowPurchaseButton = isAuthenticated && isPaidCourse && !hasCourseAccess;
  const accessBadgeText =
    course?.accessSource === "admin"
      ? "管理员预览"
      : course?.accessSource === "enrollment"
        ? "平台已开通"
        : "已开通";
  const coursePrice = Number(course?.price ?? 0);
  const loginRedirectPath = courseId
    ? `/learn?courseId=${encodeURIComponent(courseId)}`
    : "/learn";
  const loginHref = `/login?redirect=${encodeURIComponent(loginRedirectPath)}`;
  const requiresLoginToWatch =
    !isAuthLoading &&
    Boolean(currentLesson?.hasVideo) &&
    (!isAuthenticated || currentLesson?.accessReason === "login");
  const codeExamples = useMemo(
    () => extractLessonCodeExamples(currentLesson?.contentMarkdown),
    [currentLesson?.contentMarkdown],
  );
  const isCurrentDocumentOnly = Boolean(
    currentLesson && isDocumentOnlyLesson(currentLesson),
  );
  const documentChapters = useMemo(
    () =>
      chapters
        .map((chapter) => ({
          id: chapter.id,
          title: chapter.title,
          lessons: chapter.lessons
            .filter((lesson) => hasLessonDocument(lesson))
            .map((lesson) => ({
              id: lesson.id,
              title: lesson.title,
              description: lesson.description,
              contentMarkdown: lesson.contentMarkdown?.trim() ?? "",
              isLocked: lesson.accessReason === "purchase",
              accessReason: (lesson.accessReason === "purchase"
                ? "purchase"
                : null) as "purchase" | null,
              coursewareName: lesson.coursewareName,
              coursewareUrl: lesson.coursewareUrl,
            })),
        }))
        .filter((chapter) => chapter.lessons.length > 0),
    [chapters],
  );
  const learningWorkspaceTabs = useMemo(() => {
    if (isCurrentDocumentOnly) return [];

    const tabs: { id: string; label: string }[] = [];

    if (currentLesson?.coursewareUrl) {
      tabs.push({ id: "courseware", label: "课件资料" });
    }

    if (codeExamples.length > 0) {
      tabs.push({ id: "code", label: `代码学习 (${codeExamples.length})` });
    }

    if (currentLesson?.contentMarkdown) {
      tabs.push({ id: "lesson", label: "课时讲义" });
    }

    return tabs;
  }, [
    codeExamples.length,
    currentLesson?.contentMarkdown,
    currentLesson?.coursewareUrl,
    isCurrentDocumentOnly,
  ]);

  const clearVideoPlayer = () => {
    const video = videoRef.current;
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    if (video) {
      video.pause();
      video.removeAttribute("src");
      video.load();
    }
  };

  const toggleChapter = (chapterId: string) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(chapterId)) {
      newExpanded.delete(chapterId);
    } else {
      newExpanded.add(chapterId);
    }
    setExpandedChapters(newExpanded);
  };

  const handleChapterFilterChange = (chapterId: string) => {
    setSelectedChapter(chapterId);
    if (chapterId !== "all") {
      setExpandedChapters(new Set([chapterId]));
    }
  };

  const flattenLessons = (chapterList: Chapter[]) =>
    chapterList.flatMap((chapter) => chapter.lessons);

  const findChapterIdByLessonId = (chapterList: Chapter[], lessonId: string) => {
    for (const chapter of chapterList) {
      if (chapter.lessons.some((lesson) => lesson.id === lessonId)) {
        return chapter.id;
      }
    }
    return null;
  };

  const expandChapterForLesson = (chapterList: Chapter[], lessonId: string) => {
    const chapterId = findChapterIdByLessonId(chapterList, lessonId) ?? chapterList[0]?.id;
    if (chapterId) {
      setExpandedChapters(new Set([chapterId]));
    }
  };

  const getLocalProgress = (
    lessonId?: string,
    targetCourseId = courseId
  ): LocalLessonProgress | null => {
    if (typeof window === "undefined") return null;

    try {
      const raw = window.localStorage.getItem(progressStorageKey(targetCourseId));
      if (!raw) return null;

      const parsed = JSON.parse(raw) as LocalLessonProgress;
      if (lessonId && parsed.lessonId !== lessonId) return null;
      return parsed;
    } catch {
      return null;
    }
  };

  const saveLocalProgress = (
    lesson: Lesson,
    currentSeconds: number,
    durationSeconds?: number
  ) => {
    if (typeof window === "undefined") return;

    const payload: LocalLessonProgress = {
      courseId,
      lessonId: lesson.id,
      videoId: lesson.videoId ?? undefined,
      currentSeconds: Math.max(0, Math.floor(currentSeconds)),
      durationSeconds: durationSeconds ? Math.floor(durationSeconds) : undefined,
      updatedAt: new Date().toISOString(),
    };

    window.localStorage.setItem(progressStorageKey(courseId), JSON.stringify(payload));
  };

  const saveDocumentLessonProgress = async (lesson: Lesson) => {
    saveLocalProgress(lesson, 0);

    if (!isAuthenticated) return;

    try {
      await fetch("/api/learning/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          lessonId: lesson.id,
          currentSeconds: 0,
          watchSeconds: 0,
        }),
      });
    } catch (error) {
      console.warn("保存文档课时进度失败:", error);
    }
  };

  const loadRemoteProgress = async (
    targetCourseId?: string,
    lessonId?: string
  ): Promise<LessonProgress | null> => {
    const params = new URLSearchParams();
    if (targetCourseId) params.set("courseId", targetCourseId);
    if (lessonId) params.set("lessonId", lessonId);

    const response = await fetch(`/api/learning/progress?${params.toString()}`, {
      cache: "no-store",
    });

    if (!response.ok) return null;

    const body = await response.json();
    return (body.progress ?? null) as LessonProgress | null;
  };

  const restoreInitialLesson = async (
    targetCourseId: string | undefined,
    chapterList: Chapter[]
  ) => {
    const allLessons = flattenLessons(chapterList);
    if (allLessons.length === 0) return;

    const localProgress = getLocalProgress(undefined, targetCourseId);
    let remoteProgress: LessonProgress | null = null;

    try {
      remoteProgress = await loadRemoteProgress(targetCourseId);
    } catch (error) {
      console.warn("读取远端学习进度失败，使用本地缓存兜底:", error);
    }

    const remoteTime = remoteProgress?.last_watched_at
      ? new Date(remoteProgress.last_watched_at).getTime()
      : 0;
    const localTime = localProgress?.updatedAt
      ? new Date(localProgress.updatedAt).getTime()
      : 0;
    const useRemote = Boolean(remoteProgress?.lesson_id && remoteTime >= localTime);
    const targetLessonId = useRemote ? remoteProgress?.lesson_id : localProgress?.lessonId;
    const targetLesson =
      allLessons.find((lesson) => lesson.id === targetLessonId) ?? allLessons[0];

    pendingResumeTimeRef.current = useRemote
      ? remoteProgress?.current_seconds ?? 0
      : localProgress?.currentSeconds ?? 0;
    resumeAppliedLessonRef.current = null;
    expandChapterForLesson(chapterList, targetLesson.id);
    setCurrentLesson(targetLesson);
  };

  const selectLessonById = (lessonId: string) => {
    const lesson = flattenLessons(chapters).find((item) => item.id === lessonId);
    if (lesson) {
      void handleLessonClick(lesson);
    }
  };

  const handleLessonClick = async (lesson: Lesson) => {
    const needsVideoLogin =
      Boolean(lesson.hasVideo) &&
      (!isAuthenticated || lesson.accessReason === "login");
    const needsVideoPurchase =
      Boolean(lesson.hasVideo) &&
      lesson.accessReason === "purchase" &&
      lesson.isLocked;

    if (needsVideoPurchase && shouldShowPurchaseButton) {
      setCurrentLesson(lesson);
      handleOpenPurchaseModal();
      return;
    }

    if (needsVideoLogin) {
      pendingResumeTimeRef.current = 0;
      resumeAppliedLessonRef.current = null;
      setCurrentLesson(lesson);
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      setPlayerStatus("登录后即可观看当前课程视频");
      expandChapterForLesson(chapters, lesson.id);
      saveLocalProgress(lesson, 0);
      if (isDocumentOnlyLesson(lesson) || hasLessonDocument(lesson)) {
        void saveDocumentLessonProgress(lesson);
      }
      return;
    }

    if (needsVideoPurchase) {
      pendingResumeTimeRef.current = 0;
      resumeAppliedLessonRef.current = null;
      setCurrentLesson(lesson);
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      setPlayerStatus("当前课时需要先开通课程权限");
      expandChapterForLesson(chapters, lesson.id);
      saveLocalProgress(lesson, 0);
      if (isDocumentOnlyLesson(lesson) || hasLessonDocument(lesson)) {
        void saveDocumentLessonProgress(lesson);
      }
      return;
    }

    if (!lesson.isLocked) {
      const localProgress = getLocalProgress(lesson.id);

      try {
        const remoteProgress = await loadRemoteProgress(courseId, lesson.id);
        const remoteTime = remoteProgress?.last_watched_at
          ? new Date(remoteProgress.last_watched_at).getTime()
          : 0;
        const localTime = localProgress?.updatedAt
          ? new Date(localProgress.updatedAt).getTime()
          : 0;

        pendingResumeTimeRef.current =
          remoteProgress && remoteTime >= localTime
            ? remoteProgress.current_seconds
            : localProgress?.currentSeconds ?? 0;
      } catch (error) {
        console.warn("读取课时进度失败，使用本地缓存:", error);
        pendingResumeTimeRef.current = localProgress?.currentSeconds ?? 0;
      }

      resumeAppliedLessonRef.current = null;
      setCurrentLesson(lesson);
      expandChapterForLesson(chapters, lesson.id);
      if (isDocumentOnlyLesson(lesson) || hasLessonDocument(lesson)) {
        void saveDocumentLessonProgress(lesson);
      }
      // 重置播放状态
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
    } else if (shouldShowPurchaseButton) {
      setCurrentLesson(lesson);
      handleOpenPurchaseModal();
    } else {
      pendingResumeTimeRef.current = 0;
      resumeAppliedLessonRef.current = null;
      setCurrentLesson(lesson);
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      setPlayerStatus("当前课时需要先开通课程权限");
    }
  };

  const resetPurchaseForm = () => {
    setPurchasePhone("");
    setPurchaseWechat("");
    setPurchaseNote("");
    setPurchaseError("");
    setPurchaseSuccess("");
  };

  const handleOpenPurchaseModal = () => {
    setPurchaseModalOpen(true);
    setPurchaseError("");
    setPurchaseSuccess("");
  };

  const handleClosePurchaseModal = () => {
    if (isSubmittingPurchase) return;
    setPurchaseModalOpen(false);
    resetPurchaseForm();
  };

  const handleSubmitPurchaseRequest = async () => {
    const phone = purchasePhone.trim();
    const wechat = purchaseWechat.trim();

    if (!course?.id) {
      setPurchaseError("课程信息还没有加载完成，请稍后再试");
      return;
    }

    if (!phone) {
      setPurchaseError("请填写手机号");
      return;
    }

    if (!wechat) {
      setPurchaseError("请填写微信号");
      return;
    }

    setIsSubmittingPurchase(true);
    setPurchaseError("");
    setPurchaseSuccess("");

    try {
      const response = await fetch("/api/course-purchase-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: course.id,
          phone,
          wechat,
          note: purchaseNote.trim() || null,
        }),
      });
      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(body.error || "提交失败，请稍后再试");
      }

      setPurchaseSuccess("提交成功，我会尽快通过微信或手机号联系你完成支付。");
      setPurchasePhone("");
      setPurchaseWechat("");
      setPurchaseNote("");
    } catch (error) {
      setPurchaseError(error instanceof Error ? error.message : "提交失败，请稍后再试");
    } finally {
      setIsSubmittingPurchase(false);
    }
  };

  // 格式化时间
  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return "0:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, "0")}:${s
        .toString()
        .padStart(2, "0")}`;
    }
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // 公开课程内容优先直连 Supabase；付费权益/管理员预览再回到 Node API。
  useEffect(() => {
    if (isAuthLoading) return;

    let timeoutId: NodeJS.Timeout | null = null;
    let isCancelled = false;

    const fetchCourseViaApi = async (targetCourseId: string) => {
      const response = await fetch(`/api/courses/${targetCourseId}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        let errorMessage = "获取课程失败";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          console.error("获取课程失败:", errorData);
        } catch (e) {
          console.error("解析错误响应失败:", e);
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      return (await response.json()) as {
        course: CourseDetail;
        chapters?: Chapter[];
      };
    };

    const fetchFirstCourseViaApi = async () => {
      let listResponse = await fetch("/api/courses/list?status=published");

      if (!listResponse.ok) {
        console.warn("获取已发布课程失败，尝试获取所有课程...");
        listResponse = await fetch("/api/courses/list");
      }

      if (!listResponse.ok) {
        const errorData = await listResponse.json();
        console.error("获取课程列表失败:", errorData);
        throw new Error(errorData.error || "获取课程列表失败");
      }

      const { courses } = await listResponse.json();
      const firstCourse = courses?.[0];
      if (!firstCourse?.id) return null;

      return fetchCourseViaApi(firstCourse.id);
    };

    const fetchCourseData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // 添加超时保护
        timeoutId = setTimeout(() => {
          if (isCancelled) return;
          console.error("获取课程数据超时");
          setError("请求超时，请检查网络连接或稍后重试");
          setIsLoading(false);
        }, 10000); // 10秒超时

        let data: { course: CourseDetail; chapters?: Chapter[] } | null = null;
        let loadedCourseId = courseId;

        try {
          data = courseId
            ? await fetchPublicCourseFromSupabase(courseId, isAuthenticated)
            : await fetchFirstPublishedCourseFromSupabase(isAuthenticated);
          loadedCourseId = data?.course.id ?? courseId;
        } catch (supabaseError) {
          console.warn("Supabase 公开课程读取失败，回退到 Node API:", supabaseError);
        }

        if (!data) {
          data = courseId
            ? await fetchCourseViaApi(courseId)
            : await fetchFirstCourseViaApi();
          loadedCourseId = data?.course.id ?? courseId;
        }

        if (!data) {
          if (isCancelled) return;
          setCourse(null);
          setChapters([]);
          setIsLoading(false);
          return;
        }

        const needsEntitlementOverlay =
          isAuthenticated && Boolean(data.course && !data.course.isFree);

        if (needsEntitlementOverlay) {
          try {
            data = await fetchCourseViaApi(data.course.id);
            loadedCourseId = data.course.id;
          } catch (overlayError) {
            console.warn("读取课程权益失败，继续展示公开课程内容:", overlayError);
          }
        }

        if (isCancelled) return;

        const nextChapters = data.chapters || [];
        setCourse(data.course);
        setChapters(nextChapters);

        // 默认展开第一个章节
        if (nextChapters.length > 0) {
          await restoreInitialLesson(loadedCourseId, nextChapters);
        }

        // 清除超时
        if (timeoutId) clearTimeout(timeoutId);
      } catch (err: any) {
        if (isCancelled) return;
        console.error("获取课程数据失败:", err);
        const errorMessage = err.message || "加载课程失败";
        setError(errorMessage);
        // 失败时显示空状态
        setChapters([]);
      } finally {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchCourseData();

    // 清理函数
    return () => {
      isCancelled = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, isAuthenticated, isAuthLoading]);

  // // 全屏切换
  // const toggleFullscreen = () => {
  //   const container = streamContainerRef.current;
  //   if (!container) return;

  //   if (!isFullscreen) {
  //     if (container.requestFullscreen) {
  //       container.requestFullscreen();
  //     } else if ((container as any).webkitRequestFullscreen) {
  //       (container as any).webkitRequestFullscreen();
  //     } else if ((container as any).mozRequestFullScreen) {
  //       (container as any).mozRequestFullScreen();
  //     } else if ((container as any).msRequestFullscreen) {
  //       (container as any).msRequestFullscreen();
  //     }
  //   } else {
  //     if (document.exitFullscreen) {
  //       document.exitFullscreen();
  //     } else if ((document as any).webkitExitFullscreen) {
  //       (document as any).webkitExitFullscreen();
  //     } else if ((document as any).mozCancelFullScreen) {
  //       (document as any).mozCancelFullScreen();
  //     } else if ((document as any).msExitFullscreen) {
  //       (document as any).msExitFullscreen();
  //     }
  //   }
  // };

  // // 监听全屏状态变化
  // useEffect(() => {
  //   const handleFullscreenChange = () => {
  //     setIsFullscreen(!!document.fullscreenElement);
  //   };

  //   document.addEventListener("fullscreenchange", handleFullscreenChange);
  //   document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
  //   document.addEventListener("mozfullscreenchange", handleFullscreenChange);
  //   document.addEventListener("MSFullscreenChange", handleFullscreenChange);

  //   return () => {
  //     document.removeEventListener("fullscreenchange", handleFullscreenChange);
  //     document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
  //     document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
  //     document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
  //   };
  // }, []);

  const saveLessonProgress = async (
    lesson: Lesson,
    currentSeconds: number,
    durationSeconds?: number,
    force = false,
    watchSeconds = 0,
    segmentName?: string
  ) => {
    if (!lesson.videoId || currentSeconds < 1) return;

    const now = Date.now();
    if (!force && watchSeconds <= 0 && now - lastProgressSaveAtRef.current < 10000) return;
    lastProgressSaveAtRef.current = now;

    saveLocalProgress(lesson, currentSeconds, durationSeconds);

    try {
      await fetch("/api/learning/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          lessonId: lesson.id,
          videoId: lesson.videoId,
          currentSeconds,
          durationSeconds,
          watchSeconds,
          segmentName,
        }),
      });
    } catch (error) {
      console.warn("保存学习进度失败:", error);
    }
  };

  // 通过外部 Video Manager API 获取签名 m3u8，并用 hls.js 播放
  useEffect(() => {
    const video = videoRef.current;
    const videoId = currentLesson?.videoId;
    const lessonId = currentLesson?.id;

    if (!video || !lessonId || !currentLesson || isAuthLoading || !currentLesson.hasVideo) {
      setPlayerStatus("");
      return;
    }

    if (!isAuthenticated || currentLesson.accessReason === "login") {
      clearVideoPlayer();
      setPlayerStatus("登录后即可观看当前课程视频");
      return;
    }

    if (currentLesson.isLocked) {
      clearVideoPlayer();
      setPlayerStatus("当前课时需要先开通课程权限");
      return;
    }

    if (!videoId) {
      clearVideoPlayer();
      setPlayerStatus("");
      return;
    }

    let cancelled = false;
    const reportedSegments = new Set<string>();
    let watchedSecondsSinceLastLog = 0;
    let lastWatchTick = 0;
    let watchLogIntervalId: number | null = null;

    const destroyHls = () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      video.removeAttribute("src");
      video.load();
    };

    const applyResumeTime = () => {
      if (resumeAppliedLessonRef.current === lessonId) return;

      const resumeSeconds = pendingResumeTimeRef.current;
      const safeDuration = Number.isFinite(video.duration) ? video.duration : 0;

      if (resumeSeconds > 5 && (!safeDuration || resumeSeconds < safeDuration - 5)) {
        video.currentTime = resumeSeconds;
        setCurrentTime(resumeSeconds);
        setPlayerStatus(`已恢复到 ${formatTime(resumeSeconds)}`);
        window.setTimeout(() => {
          if (!cancelled) setPlayerStatus("");
        }, 1800);
      }

      resumeAppliedLessonRef.current = lessonId;
    };

    const flushWatchLog = async (token: string, force = false) => {
      if (!force && watchedSecondsSinceLastLog < 15) return;
      if (watchedSecondsSinceLastLog <= 0) return;

      const watchSeconds = Math.floor(watchedSecondsSinceLastLog);
      watchedSecondsSinceLastLog = 0;
      const segmentName = `lesson:${lessonId}`;

      saveLessonProgress(
        currentLesson,
        video.currentTime,
        video.duration || duration,
        true,
        watchSeconds,
        segmentName
      );

      try {
        await fetch(videoApiUrl(`/api/videos/${videoId}/segments`), {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ segmentName, watchSeconds }),
        });
      } catch (error) {
        console.warn("上报视频观看时长失败:", error);
      }
    };

    const updateTime = () => {
      const nextTime = video.currentTime;
      setCurrentTime(nextTime);

      if (!video.paused && !video.ended) {
        const now = Date.now();
        if (lastWatchTick > 0) {
          const deltaSeconds = Math.min(5, Math.max(0, (now - lastWatchTick) / 1000));
          watchedSecondsSinceLastLog += deltaSeconds;
        }
        lastWatchTick = now;
      }

      saveLessonProgress(currentLesson, nextTime, video.duration || duration);
    };
    const updateDuration = () => {
      if (video.duration && !isNaN(video.duration)) {
        setDuration(video.duration);
      }
      applyResumeTime();
    };
    const handlePlay = () => {
      lastWatchTick = Date.now();
      setIsPlaying(true);
    };
    const handlePause = () => {
      lastWatchTick = 0;
      setIsPlaying(false);
      saveLessonProgress(currentLesson, video.currentTime, video.duration || duration, true);
    };
    const handleEnded = () => {
      lastWatchTick = 0;
      setIsPlaying(false);
      saveLessonProgress(currentLesson, video.currentTime, video.duration || duration, true);
    };

    const reportSegment = async (token: string, segmentName: string) => {
      if (!segmentName || reportedSegments.has(segmentName)) return;
      reportedSegments.add(segmentName);

      try {
        await fetch(videoApiUrl(`/api/videos/${videoId}/segments`), {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ segmentName }),
        });
      } catch (error) {
        console.warn("上报视频切片失败:", error);
      }
    };

    const setupPlayer = async () => {
      destroyHls();
      setPlayerStatus("正在获取播放授权...");

      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const token = session?.access_token;
      if (!token) {
        clearVideoPlayer();
        setPlayerStatus("请先登录后观看视频");
        return;
      }

      try {
        const response = await fetch(
          videoApiUrl(`/api/videos/${videoId}/play?token=${encodeURIComponent(token)}`),
          { headers: { Accept: "application/json" } }
        );
        const body = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(body.message || body.code || "获取播放地址失败");
        }

        if (cancelled) return;

        const playUrl = body.playUrl as string;
        if (!playUrl) {
          throw new Error("视频 API 未返回 playUrl");
        }

        video.addEventListener("timeupdate", updateTime);
        video.addEventListener("loadedmetadata", updateDuration);
        video.addEventListener("durationchange", updateDuration);
        video.addEventListener("play", handlePlay);
        video.addEventListener("pause", handlePause);
        video.addEventListener("ended", handleEnded);
        video.addEventListener("loadeddata", updateDuration);

        if (token) {
          watchLogIntervalId = window.setInterval(() => {
            flushWatchLog(token);
          }, 15000);
        }

        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = playUrl;
          try {
            await video.play();
            setPlayerStatus("");
          } catch {
            setPlayerStatus("已就绪，请点击播放");
          }
          return;
        }

        if (!Hls.isSupported()) {
          setPlayerStatus("当前浏览器不支持 HLS 播放");
          return;
        }

        const hls = new Hls({ enableWorker: true, lowLatencyMode: false });
        hlsRef.current = hls;
        hls.loadSource(playUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setPlayerStatus("已就绪");
          video.play().catch(() => setPlayerStatus("已就绪，请点击播放"));
        });

        hls.on(Hls.Events.FRAG_LOADED, (_event, data) => {
          const segmentName =
            data.frag?.relurl ||
            data.frag?.url?.split("?")[0]?.split("/").pop() ||
            "";
          if (token) reportSegment(token, segmentName);
          if (token) flushWatchLog(token);
        });

        hls.on(Hls.Events.ERROR, (_event, data) => {
          console.warn("HLS 播放错误:", data);
          if (!data.fatal) return;

          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            setPlayerStatus("网络异常，正在重试...");
            hls.startLoad();
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            setPlayerStatus("媒体异常，正在恢复...");
            hls.recoverMediaError();
          } else {
            setPlayerStatus(`播放失败: ${data.details}`);
            destroyHls();
          }
        });
      } catch (error: any) {
        setPlayerStatus(error.message || "播放失败");
      }
    };

    setupPlayer();

    return () => {
      cancelled = true;
      video.removeEventListener("timeupdate", updateTime);
      video.removeEventListener("loadedmetadata", updateDuration);
      video.removeEventListener("durationchange", updateDuration);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("loadeddata", updateDuration);
      if (watchLogIntervalId) {
        window.clearInterval(watchLogIntervalId);
      }
      saveLessonProgress(
        currentLesson,
        video.currentTime,
        video.duration || duration,
        true,
        Math.floor(watchedSecondsSinceLastLog),
        `lesson:${lessonId}`
      );
      destroyHls();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentLesson?.id,
    currentLesson?.videoId,
    currentLesson?.accessReason,
    isAuthenticated,
    isAuthLoading,
  ]);

  // 快进/快退
  const skipTime = (seconds: number) => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = Math.max(
        0,
        Math.min(video.currentTime + seconds, video.duration)
      );
    }
  };

  // 跳转到指定时间
  const seekTo = (time: number) => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = time;
    }
  };

  // 设置播放速度
  const changePlaybackRate = (rate: number) => {
    const video = videoRef.current;
    if (video) {
      video.playbackRate = rate;
      setPlaybackRate(rate);
    }
  };

  // 控制栏自动隐藏
  useEffect(() => {
    if (showControls) {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = setTimeout(() => {
        if (isPlaying) {
          setShowControls(false);
        }
      }, 3000);
    }
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [showControls, isPlaying]);

  useEffect(() => {
    if (learningWorkspaceTabs.length === 0) return;

    if (!learningWorkspaceTabs.some((tab) => tab.id === learningWorkspaceTab)) {
      setLearningWorkspaceTab(learningWorkspaceTabs[0].id);
    }
  }, [learningWorkspaceTab, learningWorkspaceTabs]);

  const canUseMiniPlayer =
    Boolean(currentLesson?.hasVideo) &&
    !isCurrentDocumentOnly &&
    !requiresLoginToWatch &&
    currentLesson?.accessReason !== "purchase";

  const showMiniPlayer = canUseMiniPlayer && isMiniPlayer && !miniPlayerDismissed;
  const miniPlayerClassName =
    "fixed bottom-4 right-4 z-[55] w-[min(520px,calc(100vw-2rem))] rounded-2xl shadow-[0_24px_80px_rgba(15,23,42,0.5)] ring-1 ring-white/10 sm:bottom-6 sm:right-6 lg:bottom-8 lg:right-8 animate-in fade-in slide-in-from-bottom-4 duration-300";

  useEffect(() => {
    setIsMiniPlayer(false);
    setMiniPlayerDismissed(false);
  }, [currentLesson?.id]);

  useEffect(() => {
    const anchor = playerAnchorRef.current;
    if (!anchor || !canUseMiniPlayer) {
      setIsMiniPlayer(false);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsMiniPlayer(false);
          setMiniPlayerDismissed(false);
        } else {
          const hasScrolledPastPlayer = entry.boundingClientRect.bottom <= 88;
          setIsMiniPlayer(hasScrolledPastPlayer);
        }
      },
      {
        threshold: 0,
        rootMargin: "-88px 0px 0px 0px",
      },
    );

    observer.observe(anchor);
    return () => observer.disconnect();
  }, [canUseMiniPlayer, currentLesson?.id]);

  const scrollToMainPlayer = () => {
    setMiniPlayerDismissed(false);
    playerAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const filteredChapters =
    selectedChapter === "all"
      ? chapters
      : chapters.filter((ch) => ch.id === selectedChapter);
  const filteredLessons = flattenLessons(filteredChapters);
  const currentChapterId = currentLesson
    ? findChapterIdByLessonId(chapters, currentLesson.id)
    : null;
  const totalLessonCount = flattenLessons(chapters).length;

  if (isLoading || isAuthLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载课程中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#f3f7fc_34%,#f6f8fb_100%)]">
      <div className="sticky top-[var(--site-header-height)] z-40 border-b border-slate-200/70 bg-[#f7fafe]/88 backdrop-blur-xl">
        <div className="mx-auto max-w-[1680px] px-4 py-3 sm:px-6 xl:px-8">
          <div className="flex items-center justify-between">
            <Link
              href="/courses"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <span>返回</span>
            </Link>

            <div className="flex flex-wrap items-center justify-end gap-3">
              {course && (
                <h1 className="text-lg font-semibold text-gray-900">
                  {course.title}
                </h1>
              )}
              {!isAuthenticated && (
                <Link
                  href={loginHref}
                  className="rounded-full bg-gray-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gray-800"
                >
                  登录后看视频
                </Link>
              )}
              {isPaidCourse && hasCourseAccess && (
                <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200">
                  {accessBadgeText}
                </span>
              )}
              {course?.isFree && (
                <span className="rounded-full bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 ring-1 ring-green-200">
                  免费课程
                </span>
              )}
              {shouldShowPurchaseButton && (
                <button
                  type="button"
                  onClick={handleOpenPurchaseModal}
                  className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
                >
                  立即购买{coursePrice > 0 ? ` ¥${coursePrice}` : ""}
                </button>
              )}
            
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1720px] px-4 py-6 sm:px-6 xl:px-8 xl:py-8">
        <div
          className={`grid gap-4 xl:gap-6 ${
            isSidebarCollapsed
              ? "xl:grid-cols-[72px_minmax(0,1fr)]"
              : "xl:grid-cols-[340px_minmax(0,1fr)] 2xl:grid-cols-[360px_minmax(0,1fr)]"
          }`}
        >
          {/* 左侧：课程目录 */}
          <div className="w-full xl:sticky xl:top-[calc(var(--site-header-height)+88px)] xl:self-start">
            {/* 标签页 */}
            <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(148,163,184,0.12)]">
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-4 py-3">
                {!isSidebarCollapsed ? (
                  <div className="grid flex-1 grid-cols-2 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-3 py-3 text-sm font-semibold transition-colors ${
                          activeTab === tab.id
                            ? "bg-blue-50 text-blue-600 shadow-[inset_0_-2px_0_0_#2563eb]"
                            : "text-gray-600 hover:text-gray-900 hover:bg-white/80"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-500 ring-1 ring-slate-200">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                    </svg>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setIsSidebarCollapsed((value) => !value)}
                  className="ml-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-500 ring-1 ring-slate-200 transition hover:text-slate-900"
                  aria-label={isSidebarCollapsed ? "展开学习栏" : "最小化学习栏"}
                  title={isSidebarCollapsed ? "展开学习栏" : "最小化学习栏"}
                >
                  <svg
                    className={`h-5 w-5 transition-transform ${isSidebarCollapsed ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              </div>

              {/* 章节筛选 */}
              {!isSidebarCollapsed && activeTab === "catalog" && (
                <div className="border-b border-slate-200 bg-white px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-950">课程章节</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {chapters.length} 个章节 / {totalLessonCount} 节课
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleChapterFilterChange("all")}
                      className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition ${
                        selectedChapter === "all"
                          ? "bg-slate-950 text-white ring-slate-950"
                          : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50 hover:text-slate-950"
                      }`}
                    >
                      全部
                    </button>
                  </div>

                  <div className="mt-4 grid max-h-64 grid-cols-2 gap-2 overflow-y-auto pr-1">
                    {chapters.map((chapter, index) => {
                      const isSelected = selectedChapter === chapter.id;
                      const isCurrent = currentChapterId === chapter.id;

                      return (
                        <button
                          key={chapter.id}
                          type="button"
                          onClick={() => handleChapterFilterChange(chapter.id)}
                          className={`group flex min-h-[108px] flex-col rounded-2xl px-3 py-3 text-left ring-1 transition ${
                            isSelected
                              ? "bg-blue-600 text-white ring-blue-600 shadow-sm"
                              : isCurrent
                              ? "bg-blue-50 text-blue-700 ring-blue-200 hover:bg-blue-100"
                              : "bg-slate-50 text-slate-700 ring-slate-200 hover:bg-white hover:text-slate-950"
                          }`}
                        >
                          <span
                            className={`text-[11px] font-bold ${
                              isSelected ? "text-blue-100" : "text-slate-400"
                            }`}
                          >
                            CH {String(index + 1).padStart(2, "0")}
                          </span>
                          <span className="mt-1 line-clamp-2 text-sm font-semibold leading-5">
                            {chapter.title}
                          </span>
                          <span
                            className={`mt-2 text-xs ${
                              isSelected ? "text-blue-100" : "text-slate-500"
                            }`}
                          >
                            {chapter.lessons.length} 节课
                            {isCurrent ? " / 正在学习" : ""}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 章节列表 */}
              {!isSidebarCollapsed && activeTab === "catalog" && (
                <div className="max-h-[calc(100vh-260px)] overflow-y-auto">
                  {filteredChapters.map((chapter) => (
                    <div
                      key={chapter.id}
                      className="border-b border-slate-100 last:border-b-0"
                    >
                      <button
                        onClick={() => toggleChapter(chapter.id)}
                        className={`group flex w-full items-center justify-between gap-3 px-5 py-4 transition-colors ${
                          currentChapterId === chapter.id
                            ? "bg-blue-50/70"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        <span className="min-w-0 flex-1 text-left">
                          <span className="line-clamp-2 text-sm font-semibold text-slate-900">
                            {chapter.title}
                          </span>
                          <span className="mt-1 block text-xs text-slate-500">
                            {chapter.lessons.length} 节课
                            {currentChapterId === chapter.id ? " / 正在学习" : ""}
                          </span>
                        </span>
                        <svg
                          className={`h-4 w-4 flex-shrink-0 text-slate-400 transition-transform group-hover:text-slate-600 ${
                            expandedChapters.has(chapter.id) ? "rotate-180" : ""
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>

                      {expandedChapters.has(chapter.id) && (
                        <div className="bg-slate-50/70">
                          {chapter.lessons.map((lesson, index) => (
                            <button
                              key={lesson.id}
                              onClick={() => void handleLessonClick(lesson)}
                              className={`w-full border-b border-slate-100 px-5 py-4 text-left text-sm transition-colors last:border-b-0 ${
                                currentLesson?.id === lesson.id
                                  ? "border-l-4 border-blue-600 bg-blue-50/80 text-blue-700"
                                  : lesson.hasVideo && lesson.accessReason === "login"
                                  ? "text-amber-700 hover:bg-amber-50"
                                  : lesson.hasVideo && lesson.isLocked
                                  ? "text-gray-500 hover:bg-slate-100"
                                  : "text-gray-700 hover:bg-white"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-start gap-3">
                                    <span className="mt-0.5 text-xs font-bold text-slate-400">
                                      {String(index + 1).padStart(2, "0")}
                                    </span>
                                    <span className="line-clamp-2 leading-6">{lesson.title}</span>
                                  </div>
                                  {lesson.duration && (
                                    <div className="mt-2 pl-7 text-xs text-gray-500">
                                      {lesson.duration}
                                    </div>
                                  )}
                                </div>
                                <div className="flex flex-shrink-0 flex-wrap justify-end gap-2">
                                  {isDocumentOnlyLesson(lesson) ? (
                                    <span className="whitespace-nowrap rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                                      文档
                                    </span>
                                  ) : (
                                    <>
                                      {lesson.isFree && (
                                        <span className="whitespace-nowrap rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                                          免费试听
                                        </span>
                                      )}
                                      {lesson.coursewareUrl && (
                                        <span className="whitespace-nowrap rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">
                                          课件
                                        </span>
                                      )}
                                      {lesson.contentMarkdown?.includes("```") && (
                                        <span className="whitespace-nowrap rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">
                                          代码
                                        </span>
                                      )}
                                    </>
                                  )}
                                  {lesson.hasVideo && lesson.accessReason === "login" && (
                                    <span className="whitespace-nowrap rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                                      视频需登录
                                    </span>
                                  )}
                                  {lesson.hasVideo && lesson.isLocked && lesson.accessReason !== "login" && (
                                    <svg
                                      className="w-4 h-4 text-gray-400"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                      />
                                    </svg>
                                  )}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {isSidebarCollapsed && (
                <div className="flex max-h-[calc(100vh-260px)] flex-col items-center gap-3 overflow-y-auto px-3 py-4">
                  {filteredLessons.map((lesson, index) => {
                      const isActive = currentLesson?.id === lesson.id;
                      return (
                        <button
                          key={lesson.id}
                          type="button"
                          onClick={() => void handleLessonClick(lesson)}
                          className={`flex h-11 w-11 items-center justify-center rounded-2xl text-xs font-bold transition ${
                            isActive
                              ? "bg-blue-600 text-white shadow-sm"
                              : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900"
                          }`}
                          title={lesson.title}
                        >
                          {String(index + 1).padStart(2, "0")}
                        </button>
                      );
                    })}
                </div>
              )}

              {/* 其他标签页内容 */}
              {!isSidebarCollapsed && activeTab !== "catalog" && (
                <div className="p-4 text-gray-600 text-sm">
                  {activeTab === "details" && (
                    <div>
                      <h3 className="font-medium mb-2">课程详情</h3>
                      <p className="text-gray-500">
                        这里显示课程的详细介绍、学习目标、适用人群等信息。
                      </p>
                    </div>
                  )}
                  {activeTab === "homework" && (
                    <div>
                      <h3 className="font-medium mb-2">随堂作业</h3>
                      <p className="text-gray-500">这里显示随堂作业列表。</p>
                    </div>
                  )}
                  {activeTab === "faq" && (
                    <div>
                      <h3 className="font-medium mb-2">常见问题</h3>
                      <p className="text-gray-500">这里显示常见问题解答。</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 右侧：视频播放器 */}
          <div className="flex-1 min-w-0">
            <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_28px_90px_rgba(148,163,184,0.14)]">
              {currentLesson ? (
                isCurrentDocumentOnly ? (
                  <div className="p-0">
                    <LessonDocumentViewer
                      chapters={documentChapters}
                      activeLessonId={currentLesson.id}
                      onSelectLesson={selectLessonById}
                      blocked={currentLesson.accessReason === "purchase"}
                      blockTitle="当前课时需要先开通课程权限"
                      blockDescription="开通课程后即可阅读完整文档内容。"
                      loginHref={loginHref}
                      onPurchase={handleOpenPurchaseModal}
                      showPurchaseButton={shouldShowPurchaseButton}
                    />
                  </div>
                ) : (
                <div>
                  <div ref={playerAnchorRef} className="relative w-full">
                    {showMiniPlayer && (
                      <div
                        className="aspect-video w-full bg-slate-950"
                        aria-hidden
                      />
                    )}
                    <div
                      ref={streamContainerRef}
                      className={`aspect-video bg-black relative overflow-hidden group ${
                        showMiniPlayer
                          ? miniPlayerClassName
                          : "w-full"
                      }`}
                      onMouseMove={() => setShowControls(true)}
                      onMouseLeave={() => {
                        if (isPlaying) {
                          setShowControls(false);
                        }
                      }}
                    >
                    {showMiniPlayer && (
                      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-2 bg-gradient-to-b from-black/80 to-transparent px-2.5 pb-6 pt-2">
                        <button
                          type="button"
                          onClick={scrollToMainPlayer}
                          className="min-w-0 flex-1 truncate text-left text-xs font-medium text-white/90 transition hover:text-white"
                          title={currentLesson.title}
                        >
                          {currentLesson.title}
                        </button>
                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            onClick={scrollToMainPlayer}
                            className="rounded-md bg-white/15 px-2 py-1 text-[11px] font-medium text-white backdrop-blur transition hover:bg-white/25"
                            title="回到播放器"
                          >
                            回顶部
                          </button>
                          <button
                            type="button"
                            onClick={() => setMiniPlayerDismissed(true)}
                            className="rounded-md bg-white/15 p-1 text-white backdrop-blur transition hover:bg-white/25"
                            aria-label="关闭小窗"
                            title="关闭小窗"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                    <div className="relative h-full w-full">
                      <video
                        ref={videoRef}
                        className="h-full w-full bg-black"
                        controls={!requiresLoginToWatch}
                        playsInline
                        preload="metadata"
                      />
                      {playerStatus && !requiresLoginToWatch && (
                        <div className="pointer-events-none absolute left-4 top-4 rounded-full bg-black/70 px-3 py-1 text-xs font-medium text-white backdrop-blur">
                          {playerStatus}
                        </div>
                      )}
                      {requiresLoginToWatch && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/75 px-6 text-center">
                          <div className="max-w-md">
                            <p className="text-lg font-semibold text-white">登录后即可观看视频课程</p>
                            <p className="mt-2 text-sm leading-6 text-white/75">
                              请先登录账号，再播放视频、同步学习进度并继续上次观看位置。
                            </p>
                            <button
                              type="button"
                              onClick={() => router.push(loginHref)}
                              className="mt-5 inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
                            >
                              去登录
                            </button>
                          </div>
                        </div>
                      )}
                      {!requiresLoginToWatch && currentLesson.accessReason === "purchase" && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/75 px-6 text-center">
                          <div className="max-w-md">
                            <p className="text-lg font-semibold text-white">当前课时需要先开通课程权限</p>
                            <p className="mt-2 text-sm leading-6 text-white/75">
                              登录后购买或开通课程，即可观看完整视频内容。
                            </p>
                            {shouldShowPurchaseButton ? (
                              <button
                                type="button"
                                onClick={handleOpenPurchaseModal}
                                className="mt-5 inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
                              >
                                立即购买{coursePrice > 0 ? ` ¥${coursePrice}` : ""}
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => router.push(loginHref)}
                                className="mt-5 inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
                              >
                                登录后开通
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                      {!currentLesson.hasVideo && !currentLesson.accessReason && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black text-sm text-white/70">
                          当前课时暂无视频，请查看下方讲义或文档
                        </div>
                      )}
                    </div>
                  </div>
                  </div>
                  <div className="border-t border-gray-200 p-6 lg:p-8">
                    <div className="rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,#fbfdff_0%,#f7faff_100%)] px-5 py-5 shadow-sm sm:px-6">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="max-w-3xl">
                          <p className="text-sm font-semibold text-sky-600">当前课时</p>
                          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 lg:text-[2rem]">
                            {currentLesson.title}
                          </h2>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {currentLesson.duration && (
                            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm font-medium text-slate-600 ring-1 ring-slate-200">
                              <svg
                                className="h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              时长 {currentLesson.duration}
                            </span>
                          )}
                          {currentLesson.isFree && (
                            <span className="rounded-full bg-green-100 px-3 py-1.5 text-sm font-semibold text-green-700">
                              免费试听
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {currentLesson.description && (
                      <p className="mt-5 max-w-4xl text-sm leading-7 text-gray-600 lg:text-[15px]">
                        {currentLesson.description}
                      </p>
                    )}
                    {learningWorkspaceTabs.length > 0 && (
                      <div className="mt-7 overflow-hidden rounded-[30px] border border-slate-200 bg-[linear-gradient(180deg,#fbfdff_0%,#f6f9fd_100%)] shadow-sm">
                        <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-sky-600">学习工作台</p>
                              <h3 className="mt-1 text-lg font-bold text-slate-950">
                                课件、代码与讲义
                              </h3>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {learningWorkspaceTabs.map((tab) => (
                                <button
                                  key={tab.id}
                                  type="button"
                                  onClick={() => setLearningWorkspaceTab(tab.id)}
                                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                                    learningWorkspaceTab === tab.id
                                      ? "bg-slate-950 text-white shadow-sm"
                                      : "bg-white text-slate-500 ring-1 ring-slate-200 hover:text-slate-900"
                                  }`}
                                >
                                  {tab.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="p-5 sm:p-6 lg:p-7">
                          {learningWorkspaceTab === "courseware" && currentLesson.coursewareUrl && (
                            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
                              <div className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm">
                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-500">
                                  Courseware
                                </p>
                                <h4 className="mt-3 text-2xl font-bold text-slate-950">
                                  {currentLesson.coursewareName || "当前课时课件"}
                                </h4>
                                <p className="mt-3 text-sm leading-7 text-slate-500">
                                  这部分适合先下载资料，再配合视频与讲义一起看。你可以把课件当成本节课的结构化索引。
                                </p>
                                <div className="mt-6 flex flex-wrap gap-3">
                                  <a
                                    href={currentLesson.coursewareUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                                  >
                                    下载课件
                                  </a>
                                  <a
                                    href={currentLesson.coursewareUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
                                  >
                                    新窗口打开
                                  </a>
                                </div>
                              </div>

                              <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
                                <p className="text-sm font-semibold text-slate-900">使用建议</p>
                                <ul className="mt-3 space-y-3 text-sm leading-6 text-slate-600">
                                  <li>先快速浏览目录，知道本节课覆盖哪些知识点。</li>
                                  <li>看视频时同步在课件上定位章节，形成自己的知识地图。</li>
                                  <li>课后回看时优先翻课件，再回视频找重点片段。</li>
                                </ul>
                              </div>
                            </div>
                          )}

                          {learningWorkspaceTab === "code" && (
                            <div className="space-y-5">
                              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-500">
                                  Code Practice
                                </p>
                                <h4 className="mt-2 text-2xl font-bold text-slate-950">
                                  从讲义里拆出来的代码片段
                                </h4>
                                <p className="mt-3 text-sm leading-7 text-slate-500">
                                  这一栏会自动提取课时讲义中的代码块，方便你单独刷代码，不用在整篇讲义里来回找。
                                </p>
                              </div>

                              <div className="space-y-4">
                                {codeExamples.map((example, index) => (
                                  <div
                                    key={example.id}
                                    className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                                  >
                                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                                      <div>
                                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                                          Snippet {String(index + 1).padStart(2, "0")}
                                        </p>
                                        <h5 className="mt-1 text-lg font-bold text-slate-950">
                                          {example.title}
                                        </h5>
                                      </div>
                                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                        {example.language}
                                      </span>
                                    </div>
                                    <div className="px-5 py-5">
                                      <CodeBlock className={`language-${example.language}`}>
                                        {example.code}
                                      </CodeBlock>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {learningWorkspaceTab === "lesson" && currentLesson.contentMarkdown && (
                            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                              <div className="mb-4">
                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-500">
                                  Lesson Notes
                                </p>
                                <h4 className="mt-2 text-2xl font-bold text-slate-950">课时讲义</h4>
                              </div>
                              <div className="document-prose prose prose-slate max-w-none prose-headings:scroll-mt-24 prose-pre:overflow-x-auto">
                                <ReactMarkdown
                                  remarkPlugins={[remarkGfm]}
                                  components={{
                                    code: CodeBlock as any,
                                  }}
                                >
                                  {currentLesson.contentMarkdown}
                                </ReactMarkdown>
                              </div>
                            </div>
                          )}

                        </div>
                      </div>
                    )}
                  </div>
                </div>
                )
              ) : (
                <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <svg
                      className="w-20 h-20 mx-auto mb-4 opacity-50"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="text-lg font-medium">请选择课程开始学习</p>
                    <p className="text-sm mt-2">从左侧目录中选择一个课程</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {purchaseModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-gray-100 px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-blue-600">付费课程咨询</p>
                  <h2 className="mt-1 text-2xl font-bold text-gray-950">提交购买意向</h2>
                  <p className="mt-2 text-sm leading-6 text-gray-500">
                    目前暂未接入线上支付，提交后我会主动联系你完成支付和开通。
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleClosePurchaseModal}
                  className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                  aria-label="关闭购买咨询"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                <p className="text-sm font-semibold text-gray-900">{course?.title}</p>
                <p className="mt-1 text-sm text-gray-600">
                  课程价格：{coursePrice > 0 ? `¥${coursePrice}` : "待确认"}
                </p>
              </div>

              <label className="block">
                <span className="text-sm font-semibold text-gray-800">手机号 *</span>
                <input
                  value={purchasePhone}
                  onChange={(event) => setPurchasePhone(event.target.value)}
                  placeholder="请输入手机号"
                  className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-gray-800">微信号 *</span>
                <input
                  value={purchaseWechat}
                  onChange={(event) => setPurchaseWechat(event.target.value)}
                  placeholder="请输入微信号"
                  className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-gray-800">备注</span>
                <textarea
                  value={purchaseNote}
                  onChange={(event) => setPurchaseNote(event.target.value)}
                  placeholder="可填写想咨询的问题、方便联系的时间等"
                  rows={3}
                  className="mt-2 w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </label>

              {purchaseError && (
                <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {purchaseError}
                </div>
              )}

              {purchaseSuccess && (
                <div className="rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700">
                  {purchaseSuccess}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
              <button
                type="button"
                onClick={handleClosePurchaseModal}
                disabled={isSubmittingPurchase}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSubmitPurchaseRequest}
                disabled={isSubmittingPurchase}
                className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmittingPurchase ? "提交中..." : "提交购买意向"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

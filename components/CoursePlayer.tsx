"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Hls from "hls.js";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { videoApiUrl } from "@/lib/videoApi";

interface Lesson {
  id: string;
  title: string;
  duration?: string;
  durationSeconds?: number;
  isFree: boolean;
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

const progressStorageKey = (courseId?: string) =>
  `zood.lesson-progress.${courseId || "default"}`;

export default function CoursePlayer({
  courseId,
  courseTitle,
}: CoursePlayerProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("catalog");
  const [selectedChapter, setSelectedChapter] = useState<string>("all");
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(
    new Set()
  );
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
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
  const streamContainerRef = useRef<HTMLDivElement>(null);
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
    { id: "teacher", label: "教师简介" },
    { id: "mirror", label: "课程镜像" },
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

  const toggleChapter = (chapterId: string) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(chapterId)) {
      newExpanded.delete(chapterId);
    } else {
      newExpanded.add(chapterId);
    }
    setExpandedChapters(newExpanded);
  };

  const flattenLessons = (chapterList: Chapter[]) =>
    chapterList.flatMap((chapter) => chapter.lessons);

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
      videoId: lesson.videoId,
      currentSeconds: Math.max(0, Math.floor(currentSeconds)),
      durationSeconds: durationSeconds ? Math.floor(durationSeconds) : undefined,
      updatedAt: new Date().toISOString(),
    };

    window.localStorage.setItem(progressStorageKey(courseId), JSON.stringify(payload));
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
    const accessibleLessons = allLessons.filter((lesson) => !lesson.isLocked);

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
      accessibleLessons.find((lesson) => lesson.id === targetLessonId) ??
      allLessons.find((lesson) => lesson.id === targetLessonId) ??
      accessibleLessons[0] ??
      allLessons[0];

    pendingResumeTimeRef.current = useRemote
      ? remoteProgress?.current_seconds ?? 0
      : localProgress?.currentSeconds ?? 0;
    resumeAppliedLessonRef.current = null;
    setCurrentLesson(targetLesson);
  };

  const handleLessonClick = async (lesson: Lesson) => {
    if (lesson.accessReason === "login") {
      pendingResumeTimeRef.current = 0;
      resumeAppliedLessonRef.current = null;
      setCurrentLesson(lesson);
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      setPlayerStatus("登录后即可观看当前课程视频");
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

  // 从 API 获取课程数据
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;

    const fetchCourseData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log("开始获取课程数据, courseId:", courseId);

        // 添加超时保护
        timeoutId = setTimeout(() => {
          console.error("获取课程数据超时");
          setError("请求超时，请检查网络连接或稍后重试");
          setIsLoading(false);
        }, 10000); // 10秒超时

        if (!courseId) {
          // 如果没有 courseId，尝试获取第一个课程（先尝试已发布的，如果没有则获取所有）
          console.log("没有 courseId，获取课程列表...");
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
          console.log("课程列表:", courses);

          if (courses && courses.length > 0) {
            // 使用第一个课程
            const firstCourse = courses[0];
            console.log("使用第一个课程:", firstCourse.id);
            const detailResponse = await fetch(
              `/api/courses/${firstCourse.id}`,
              { cache: "no-store" }
            );

            if (!detailResponse.ok) {
              const errorData = await detailResponse.json();
              console.error("获取课程详情失败:", errorData);
              throw new Error(errorData.error || "获取课程详情失败");
            }

            const data = await detailResponse.json();
            console.log("课程数据获取成功:", data);
            setCourse(data.course);
            setChapters(data.chapters || []);

            if (data.chapters && data.chapters.length > 0) {
              setExpandedChapters(new Set([data.chapters[0].id]));
              await restoreInitialLesson(firstCourse.id, data.chapters);
            }
            setIsLoading(false);
            return;
          } else {
            // 如果没有课程，显示空状态
            console.log("没有找到课程");
            setChapters([]);
            setIsLoading(false);
            return;
          }
        }

        // 有 courseId，直接获取课程详情
        console.log("获取课程详情:", courseId);
        const response = await fetch(`/api/courses/${courseId}`, {
          cache: "no-store",
        });

        console.log("课程详情响应状态:", response.status);

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

        const data = await response.json();
        console.log("课程数据获取成功:", data);
        setCourse(data.course);
        setChapters(data.chapters || []);

        // 默认展开第一个章节
        if (data.chapters && data.chapters.length > 0) {
          setExpandedChapters(new Set([data.chapters[0].id]));
          await restoreInitialLesson(courseId, data.chapters);
        }

        // 清除超时
        clearTimeout(timeoutId);
      } catch (err: any) {
        console.error("获取课程数据失败:", err);
        const errorMessage = err.message || "加载课程失败";
        setError(errorMessage);
        // 失败时显示空状态
        console.log("数据获取失败，显示空状态");
        setChapters([]);
      } finally {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        setIsLoading(false);
      }
    };

    fetchCourseData();

    // 清理函数
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

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

    if (!video || !lessonId || !currentLesson) {
      setPlayerStatus("");
      return;
    }

    if (currentLesson.accessReason === "login") {
      setPlayerStatus("登录后即可观看当前课程视频");
      return;
    }

    if (currentLesson.isLocked || !videoId) {
      setPlayerStatus("当前课时需要先开通课程权限");
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
        setPlayerStatus("未登录，仅使用本地进度恢复");
      }

      try {
        const response = await fetch(
          videoApiUrl(`/api/videos/${videoId}/play?token=${encodeURIComponent(token || "")}`),
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
  }, [currentLesson?.id, currentLesson?.videoId]);

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

  const filteredChapters =
    selectedChapter === "all"
      ? chapters
      : chapters.filter((ch) => ch.id === selectedChapter);

  if (isLoading) {
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
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-[var(--site-header-height)] z-40">
        <div className="container mx-auto px-4 py-2">
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
                  登录后观看
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

      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* 左侧：课程目录 */}
          <div className="w-full lg:w-80 flex-shrink-0">
            {/* 标签页 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
              <div className="flex flex-wrap border-b border-gray-200">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 min-w-[100px] px-3 py-3 text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* 章节选择下拉框 */}
              {activeTab === "catalog" && (
                <div className="p-4 border-b border-gray-200">
                  <select
                    value={selectedChapter}
                    onChange={(e) => setSelectedChapter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">全部章节</option>
                    {chapters.map((chapter) => (
                      <option key={chapter.id} value={chapter.id}>
                        {chapter.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* 章节列表 */}
              {activeTab === "catalog" && (
                <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
                  {filteredChapters.map((chapter) => (
                    <div
                      key={chapter.id}
                      className="border-b border-gray-100 last:border-b-0"
                    >
                      <button
                        onClick={() => toggleChapter(chapter.id)}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors group"
                      >
                        <span className="text-sm font-medium text-gray-900 text-left flex-1">
                          {chapter.title}
                        </span>
                        <svg
                          className={`w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-transform flex-shrink-0 ${
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
                        <div className="bg-gray-50/50">
                          {chapter.lessons.map((lesson, index) => (
                            <button
                              key={lesson.id}
                              onClick={() => void handleLessonClick(lesson)}
                              className={`w-full px-6 py-3 text-left text-sm transition-colors border-b border-gray-100 last:border-b-0 ${
                                currentLesson?.id === lesson.id
                                  ? "bg-blue-50 text-blue-600 border-l-4 border-blue-600"
                                  : lesson.accessReason === "login"
                                  ? "text-amber-700 hover:bg-amber-50"
                                  : lesson.isLocked
                                  ? "text-gray-500 hover:bg-gray-100"
                                  : "text-gray-700 hover:bg-gray-100"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="flex-1">{lesson.title}</span>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {lesson.isFree && (
                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded whitespace-nowrap">
                                      免费试听
                                    </span>
                                  )}
                                  {lesson.accessReason === "login" && (
                                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 whitespace-nowrap">
                                      需登录
                                    </span>
                                  )}
                                  {lesson.isLocked && lesson.accessReason !== "login" && (
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
                              {lesson.duration && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {lesson.duration}
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* 其他标签页内容 */}
              {activeTab !== "catalog" && (
                <div className="p-4 text-gray-600 text-sm">
                  {activeTab === "details" && (
                    <div>
                      <h3 className="font-medium mb-2">课程详情</h3>
                      <p className="text-gray-500">
                        这里显示课程的详细介绍、学习目标、适用人群等信息。
                      </p>
                    </div>
                  )}
                  {activeTab === "teacher" && (
                    <div>
                      <h3 className="font-medium mb-2">教师简介</h3>
                      <p className="text-gray-500">这里显示教师的介绍信息。</p>
                    </div>
                  )}
                  {activeTab === "mirror" && (
                    <div>
                      <h3 className="font-medium mb-2">课程镜像</h3>
                      <p className="text-gray-500">
                        这里显示课程镜像相关信息。
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
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {currentLesson ? (
                <div>
                  <div
                    ref={streamContainerRef}
                    className="aspect-video bg-black relative overflow-hidden group"
                    onMouseMove={() => setShowControls(true)}
                    onMouseLeave={() => {
                      if (isPlaying) {
                        setShowControls(false);
                      }
                    }}
                  >
                    <div className="relative h-full w-full">
                      <video
                        ref={videoRef}
                        className="h-full w-full bg-black"
                        controls
                        playsInline
                        preload="metadata"
                      />
                      {playerStatus && (
                        <div className="pointer-events-none absolute left-4 top-4 rounded-full bg-black/70 px-3 py-1 text-xs font-medium text-white backdrop-blur">
                          {playerStatus}
                        </div>
                      )}
                      {currentLesson.accessReason === "login" && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/75 px-6 text-center">
                          <div className="max-w-md">
                            <p className="text-lg font-semibold text-white">登录后即可观看视频课程</p>
                            <p className="mt-2 text-sm leading-6 text-white/75">
                              默认需要登录后才能播放视频、同步学习进度并继续上次观看位置。
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
                      {currentLesson.accessReason === "purchase" && (
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
                      {!currentLesson.videoId && !currentLesson.accessReason && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black text-sm text-white/70">
                          当前课程还没有绑定视频 ID
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="p-6 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold text-gray-900">
                        {currentLesson.title}
                      </h2>
                      {currentLesson.isFree && (
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                          免费试听
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      {currentLesson.duration && (
                        <span className="flex items-center gap-1">
                          <svg
                            className="w-4 h-4"
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
                          时长: {currentLesson.duration}
                        </span>
                      )}
                    </div>
                    {currentLesson.description && (
                      <p className="mt-4 text-sm leading-7 text-gray-600">
                        {currentLesson.description}
                      </p>
                    )}
                    {(currentLesson.coursewareUrl || currentLesson.contentMarkdown) && (
                      <div className="mt-6 space-y-6 rounded-2xl border border-gray-200 bg-gray-50/70 p-5">
                        {currentLesson.coursewareUrl && (
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900">课件资料</h3>
                            <div className="mt-3">
                              <a
                                href={currentLesson.coursewareUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                              >
                                下载课件
                                <span className="max-w-[220px] truncate">
                                  {currentLesson.coursewareName || "查看资料"}
                                </span>
                              </a>
                            </div>
                          </div>
                        )}
                        {currentLesson.contentMarkdown && (
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900">课时讲义</h3>
                            <div className="prose prose-slate mt-3 max-w-none prose-headings:scroll-mt-24 prose-pre:overflow-x-auto">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {currentLesson.contentMarkdown}
                              </ReactMarkdown>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
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

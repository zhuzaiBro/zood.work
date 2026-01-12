"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

// 动态导入 Cloudflare Stream 组件（避免 SSR 问题）
const Stream = dynamic(
  () => import("@cloudflare/stream-react").then((mod) => mod.Stream),
  { ssr: false }
);

interface Lesson {
  id: string;
  title: string;
  duration?: string;
  isFree: boolean;
  isLocked: boolean;
  videoUrl?: string;
  videoId?: string; // Cloudflare Stream video ID
}

interface Chapter {
  id: string;
  title: string;
  lessons: Lesson[];
}

interface CoursePlayerProps {
  courseId?: string;
  courseTitle?: string;
}

export default function CoursePlayer({
  courseId,
  courseTitle,
}: CoursePlayerProps) {
  const [activeTab, setActiveTab] = useState("catalog");
  const [selectedChapter, setSelectedChapter] = useState<string>("all");
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(
    new Set()
  );
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [course, setCourse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 视频播放器相关状态
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamContainerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const tabs = [
    { id: "catalog", label: "课程目录" },
    { id: "details", label: "课程详情" },
    { id: "teacher", label: "教师简介" },
    { id: "mirror", label: "课程镜像" },
    { id: "homework", label: "随堂作业" },
    { id: "faq", label: "常见问题" },
  ];

  const toggleChapter = (chapterId: string) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(chapterId)) {
      newExpanded.delete(chapterId);
    } else {
      newExpanded.add(chapterId);
    }
    setExpandedChapters(newExpanded);
  };

  const handleLessonClick = (lesson: Lesson) => {
    if (!lesson.isLocked || lesson.isFree) {
      setCurrentLesson(lesson);
      // 重置播放状态
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
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
              `/api/courses/${firstCourse.id}`
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
        const response = await fetch(`/api/courses/${courseId}`);

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

  // 获取 Stream 组件内部的 video 元素引用并监听事件
  useEffect(() => {
    if (!currentLesson || !currentLesson.videoId) {
      // 如果没有 videoId，清理 ref
      videoRef.current = null;
      return;
    }

    // Stream 组件会在容器内创建 video 元素
    // 我们需要找到这个 video 元素并设置 ref
    const container = streamContainerRef.current;
    if (!container) return;

    let cleanup: (() => void) | null = null;

    const findVideoElement = () => {
      const video = container.querySelector("video") as HTMLVideoElement;
      if (video && video !== videoRef.current) {
        // 清理旧的事件监听器
        if (cleanup) {
          cleanup();
        }

        // 将找到的 video 元素赋值给 ref
        videoRef.current = video;

        // 设置事件监听器
        const updateTime = () => setCurrentTime(video.currentTime);
        const updateDuration = () => {
          if (video.duration && !isNaN(video.duration)) {
            setDuration(video.duration);
          }
        };
        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);

        video.addEventListener("timeupdate", updateTime);
        video.addEventListener("loadedmetadata", updateDuration);
        video.addEventListener("durationchange", updateDuration);
        video.addEventListener("play", handlePlay);
        video.addEventListener("pause", handlePause);
        video.addEventListener("loadeddata", updateDuration);

        // 保存清理函数
        cleanup = () => {
          video.removeEventListener("timeupdate", updateTime);
          video.removeEventListener("loadedmetadata", updateDuration);
          video.removeEventListener("durationchange", updateDuration);
          video.removeEventListener("play", handlePlay);
          video.removeEventListener("pause", handlePause);
          video.removeEventListener("loadeddata", updateDuration);
        };
      }
    };

    // 延迟查找，等待 Stream 组件渲染
    const timeoutId = setTimeout(() => {
      findVideoElement();
    }, 100);

    // 使用 MutationObserver 监听 DOM 变化
    const observer = new MutationObserver(() => {
      findVideoElement();
    });

    observer.observe(container, { childList: true, subtree: true });

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
      if (cleanup) {
        cleanup();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLesson?.videoId]);

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
      {/* 顶部导航栏 */}
      <div className="bg-white border-b border-gray-200 sticky top-20 z-40">
        <div className="container mx-auto px-4 py-4">
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

            <div className="flex items-center gap-4">
              {course && (
                <h1 className="text-lg font-semibold text-gray-900">
                  {course.title}
                </h1>
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
                              onClick={() => handleLessonClick(lesson)}
                              disabled={lesson.isLocked && !lesson.isFree}
                              className={`w-full px-6 py-3 text-left text-sm transition-colors border-b border-gray-100 last:border-b-0 ${
                                currentLesson?.id === lesson.id
                                  ? "bg-blue-50 text-blue-600 border-l-4 border-blue-600"
                                  : lesson.isLocked && !lesson.isFree
                                  ? "text-gray-400 cursor-not-allowed opacity-60"
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
                                  {lesson.isLocked && !lesson.isFree && (
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
                    {
                      <div className="w-full h-full relative">
                        <div className="w-full h-full [&>iframe]:w-full [&>iframe]:h-full">
                          <Stream
                            src={currentLesson.videoId || ""}
                            controls={true}
                            autoplay={true}
                            muted={false}
                          />
                        </div>
                      </div>
                    }
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
    </div>
  );
}

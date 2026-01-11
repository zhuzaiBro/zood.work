"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

// 动态导入 HLS.js（避免 SSR 问题）
let Hls: any = null;
if (typeof window !== "undefined") {
  import("hls.js").then((module) => {
    Hls = module.default;
  });
}

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


export default function CoursePlayer({ courseId, courseTitle }: CoursePlayerProps) {
  const [activeTab, setActiveTab] = useState("catalog");
  const [selectedChapter, setSelectedChapter] = useState<string>("all");
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
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
      return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
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
        console.log('开始获取课程数据, courseId:', courseId);

        // 添加超时保护
        timeoutId = setTimeout(() => {
          console.error('获取课程数据超时');
          setError('请求超时，请检查网络连接或稍后重试');
          setIsLoading(false);
        }, 10000); // 10秒超时

        if (!courseId) {
          // 如果没有 courseId，尝试获取第一个课程（先尝试已发布的，如果没有则获取所有）
          console.log('没有 courseId，获取课程列表...');
          let listResponse = await fetch('/api/courses/list?status=published');
          
          if (!listResponse.ok) {
            console.warn('获取已发布课程失败，尝试获取所有课程...');
            listResponse = await fetch('/api/courses/list');
          }
          
          if (!listResponse.ok) {
            const errorData = await listResponse.json();
            console.error('获取课程列表失败:', errorData);
            throw new Error(errorData.error || '获取课程列表失败');
          }

          const { courses } = await listResponse.json();
          console.log('课程列表:', courses);

          if (courses && courses.length > 0) {
            // 使用第一个课程
            const firstCourse = courses[0];
            console.log('使用第一个课程:', firstCourse.id);
            const detailResponse = await fetch(`/api/courses/${firstCourse.id}`);
            
            if (!detailResponse.ok) {
              const errorData = await detailResponse.json();
              console.error('获取课程详情失败:', errorData);
              throw new Error(errorData.error || '获取课程详情失败');
            }

            const data = await detailResponse.json();
            console.log('课程数据获取成功:', data);
            setCourse(data.course);
            setChapters(data.chapters || []);
            
            if (data.chapters && data.chapters.length > 0) {
              setExpandedChapters(new Set([data.chapters[0].id]));
            }
            setIsLoading(false);
            return;
          } else {
            // 如果没有课程，显示空状态
            console.log('没有找到课程');
            setChapters([]);
            setIsLoading(false);
            return;
          }
        }

        // 有 courseId，直接获取课程详情
        console.log('获取课程详情:', courseId);
        const response = await fetch(`/api/courses/${courseId}`);
        
        console.log('课程详情响应状态:', response.status);
        
        if (!response.ok) {
          let errorMessage = '获取课程失败';
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
            console.error('获取课程失败:', errorData);
          } catch (e) {
            console.error('解析错误响应失败:', e);
            errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log('课程数据获取成功:', data);
        setCourse(data.course);
        setChapters(data.chapters || []);
        
        // 默认展开第一个章节
        if (data.chapters && data.chapters.length > 0) {
          setExpandedChapters(new Set([data.chapters[0].id]));
        }

        // 清除超时
        clearTimeout(timeoutId);
      } catch (err: any) {
        console.error('获取课程数据失败:', err);
        const errorMessage = err.message || '加载课程失败';
        setError(errorMessage);
        // 失败时显示空状态
        console.log('数据获取失败，显示空状态');
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

  // 全屏切换
  const toggleFullscreen = () => {
    const container = streamContainerRef.current;
    if (!container) return;

    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      } else if ((container as any).webkitRequestFullscreen) {
        (container as any).webkitRequestFullscreen();
      } else if ((container as any).mozRequestFullScreen) {
        (container as any).mozRequestFullScreen();
      } else if ((container as any).msRequestFullscreen) {
        (container as any).msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
    }
  };

  // 监听全屏状态变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
    };
  }, []);

  // 初始化 HLS 播放器
  useEffect(() => {
    if (!currentLesson || !currentLesson.videoId) return;

    const video = videoRef.current;
    if (!video) return;

    let hls: any = null;

    // 使用 videoUrl（如果存在），否则构建默认 HLS URL
    const hlsUrl = currentLesson.videoUrl || 
      `https://customer-${process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_ID || 'YOUR_ACCOUNT_ID'}.cloudflarestream.com/${currentLesson.videoId}/manifest/video.m3u8`;

    const initHls = async () => {
      // 检查浏览器是否原生支持 HLS
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        // Safari 原生支持 HLS
        video.src = hlsUrl;
      } else {
        // 动态加载 HLS.js
        try {
          const HlsModule = await import("hls.js");
          const Hls = HlsModule.default;
          
          if (Hls.isSupported()) {
            hls = new Hls({
              enableWorker: true,
              lowLatencyMode: false,
            });
            
            hls.loadSource(hlsUrl);
            hls.attachMedia(video);

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              console.log("HLS 视频加载成功");
            });

            hls.on(Hls.Events.ERROR, (event: any, data: any) => {
              console.error("HLS 错误:", data);
            });
          } else {
            console.error("浏览器不支持 HLS.js");
          }
        } catch (error) {
          console.error("加载 HLS.js 失败:", error);
        }
      }
    };

    initHls();

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLesson?.videoId]);

  // 监听视频元素事件
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

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

    return () => {
      video.removeEventListener("timeupdate", updateTime);
      video.removeEventListener("loadedmetadata", updateDuration);
      video.removeEventListener("durationchange", updateDuration);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("loadeddata", updateDuration);
    };
  }, [currentLesson]);

  // 快进/快退
  const skipTime = (seconds: number) => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = Math.max(0, Math.min(video.currentTime + seconds, video.duration));
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
              href="/learn"
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
                <h1 className="text-lg font-semibold text-gray-900">{course.title}</h1>
              )}
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                登录后购买
              </button>
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
                    <div key={chapter.id} className="border-b border-gray-100 last:border-b-0">
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
                      <p className="text-gray-500">这里显示课程镜像相关信息。</p>
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
                    {currentLesson.videoId ? (
                      <div className="w-full h-full relative">
                        <video
                          ref={videoRef}
                          className="w-full h-full object-contain"
                          playsInline
                        >
                          您的浏览器不支持视频播放。
                        </video>
                        {/* 点击视频区域播放/暂停 */}
                        <div 
                          className="absolute inset-0 z-0 cursor-pointer"
                          onClick={(e) => {
                            // 如果点击的是控制栏，不处理
                            if ((e.target as HTMLElement).closest('.video-controls')) {
                              return;
                            }
                            const video = videoRef.current;
                            if (video) {
                              if (video.paused) {
                                video.play().catch(console.error);
                              } else {
                                video.pause();
                              }
                            }
                          }}
                        />
                        {/* 自定义控制栏覆盖层 */}
                        <div 
                          className={`video-controls absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-300 z-10 ${
                            showControls ? "opacity-100" : "opacity-0"
                          }`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* 进度条 */}
                          <div className="px-4 pt-2 pb-1">
                            <input
                              type="range"
                              min="0"
                              max={duration || 100}
                              value={currentTime}
                              onChange={(e) => seekTo(Number(e.target.value))}
                              className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
                              style={{
                                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(currentTime / duration) * 100}%, #4b5563 ${(currentTime / duration) * 100}%, #4b5563 100%)`
                              }}
                            />
                          </div>
                          
                          {/* 控制按钮栏 */}
                          <div className="px-4 pb-4 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                              {/* 播放/暂停 */}
                              <button
                                onClick={async () => {
                                  const video = videoRef.current;
                                  if (video) {
                                    try {
                                      if (isPlaying) {
                                        video.pause();
                                      } else {
                                        await video.play();
                                      }
                                    } catch (error) {
                                      console.error("播放控制错误:", error);
                                    }
                                  }
                                }}
                                className="p-2 text-white hover:bg-white/20 rounded transition-colors"
                                title={isPlaying ? "暂停" : "播放"}
                              >
                                {isPlaying ? (
                                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                                  </svg>
                                ) : (
                                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z" />
                                  </svg>
                                )}
                              </button>
                              
                              {/* 快退10秒 */}
                              <button
                                onClick={() => skipTime(-10)}
                                className="p-2 text-white hover:bg-white/20 rounded transition-colors"
                                title="快退10秒"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.334 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 4v16" />
                                </svg>
                              </button>
                              
                              {/* 快进10秒 */}
                              <button
                                onClick={() => skipTime(10)}
                                className="p-2 text-white hover:bg-white/20 rounded transition-colors"
                                title="快进10秒"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 4v16" />
                                </svg>
                              </button>
                              
                              {/* 时间显示 */}
                              <span className="text-white text-sm font-mono min-w-[100px]">
                                {formatTime(currentTime)} / {formatTime(duration)}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {/* 播放速度 */}
                              <div className="relative group/speed">
                                <button
                                  className="px-3 py-1 text-white hover:bg-white/20 rounded transition-colors text-sm"
                                  title="播放速度"
                                >
                                  {playbackRate}x
                                </button>
                                <div className="absolute bottom-full mb-2 left-0 bg-black/90 rounded-lg p-1 opacity-0 group-hover/speed:opacity-100 transition-opacity pointer-events-none group-hover/speed:pointer-events-auto">
                                  {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((rate) => (
                                    <button
                                      key={rate}
                                      onClick={() => changePlaybackRate(rate)}
                                      className={`block w-full text-left px-3 py-1 text-sm text-white hover:bg-white/20 rounded ${
                                        playbackRate === rate ? "bg-blue-600" : ""
                                      }`}
                                    >
                                      {rate}x
                                    </button>
                                  ))}
                                </div>
                              </div>
                              
                              {/* 全屏 */}
                              <button
                                onClick={toggleFullscreen}
                                className="p-2 text-white hover:bg-white/20 rounded transition-colors"
                                title="全屏"
                              >
                                {isFullscreen ? (
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                ) : (
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : currentLesson.videoUrl ? (
                      // 如果没有 videoId，回退到使用 video 标签播放 HLS
                      <div className="w-full h-full relative">
                        <video
                          ref={videoRef}
                          className="w-full h-full object-contain"
                          playsInline
                        >
                          <source src={currentLesson.videoUrl} type="application/x-mpegURL" />
                          您的浏览器不支持视频播放。
                        </video>
                        
                        {/* 自定义控制栏 */}
                        <div 
                          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-300 ${
                            showControls ? "opacity-100" : "opacity-0"
                          }`}
                        >
                          {/* 进度条 */}
                          <div className="px-4 pt-2 pb-1">
                            <input
                              type="range"
                              min="0"
                              max={duration || 100}
                              value={currentTime}
                              onChange={(e) => seekTo(Number(e.target.value))}
                              className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
                              style={{
                                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(currentTime / duration) * 100}%, #4b5563 ${(currentTime / duration) * 100}%, #4b5563 100%)`
                              }}
                            />
                          </div>
                          
                          {/* 控制按钮栏 */}
                          <div className="px-4 pb-4 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                              {/* 播放/暂停 */}
                              <button
                                onClick={() => {
                                  const video = videoRef.current;
                                  if (video) {
                                    if (isPlaying) {
                                      video.pause();
                                    } else {
                                      video.play();
                                    }
                                  }
                                }}
                                className="p-2 text-white hover:bg-white/20 rounded transition-colors"
                              >
                                {isPlaying ? (
                                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                                  </svg>
                                ) : (
                                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z" />
                                  </svg>
                                )}
                              </button>
                              
                              {/* 快退10秒 */}
                              <button
                                onClick={() => skipTime(-10)}
                                className="p-2 text-white hover:bg-white/20 rounded transition-colors"
                                title="快退10秒"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.334 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 4v16" />
                                </svg>
                              </button>
                              
                              {/* 快进10秒 */}
                              <button
                                onClick={() => skipTime(10)}
                                className="p-2 text-white hover:bg-white/20 rounded transition-colors"
                                title="快进10秒"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 4v16" />
                                </svg>
                              </button>
                              
                              {/* 时间显示 */}
                              <span className="text-white text-sm font-mono min-w-[100px]">
                                {formatTime(currentTime)} / {formatTime(duration)}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {/* 播放速度 */}
                              <div className="relative group/speed">
                                <button
                                  className="px-3 py-1 text-white hover:bg-white/20 rounded transition-colors text-sm"
                                  title="播放速度"
                                >
                                  {playbackRate}x
                                </button>
                                <div className="absolute bottom-full mb-2 left-0 bg-black/90 rounded-lg p-1 opacity-0 group-hover/speed:opacity-100 transition-opacity pointer-events-none group-hover/speed:pointer-events-auto">
                                  {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((rate) => (
                                    <button
                                      key={rate}
                                      onClick={() => changePlaybackRate(rate)}
                                      className={`block w-full text-left px-3 py-1 text-sm text-white hover:bg-white/20 rounded ${
                                        playbackRate === rate ? "bg-blue-600" : ""
                                      }`}
                                    >
                                      {rate}x
                                    </button>
                                  ))}
                                </div>
                              </div>
                              
                              {/* 全屏 */}
                              <button
                                onClick={toggleFullscreen}
                                className="p-2 text-white hover:bg-white/20 rounded transition-colors"
                                title="全屏"
                              >
                                {isFullscreen ? (
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                ) : (
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // 占位符
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
                        <div className="text-center text-white z-10">
                          <button className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors mb-4 group">
                            <svg
                              className="w-10 h-10 ml-1 text-white group-hover:scale-110 transition-transform"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </button>
                          <p className="text-lg font-medium">{currentLesson.title}</p>
                          {currentLesson.duration && (
                            <p className="text-sm text-gray-300 mt-2">
                              时长: {currentLesson.duration}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
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

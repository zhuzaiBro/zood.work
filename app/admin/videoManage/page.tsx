'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { UserProfile } from '@/types/user';

interface Course {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  price: number;
  is_free: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

interface Chapter {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  sort_order: number;
  created_at: string;
}

interface Lesson {
  id: string;
  chapter_id: string;
  title: string;
  description: string | null;
  video_id: string | null;
  video_url: string | null;
  duration: number | null;
  is_free: boolean;
  is_locked: boolean;
  sort_order: number;
  created_at: string;
}

export default function VideoManagePage() {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

//   const [isCheckingAuth, setIsCheckingAuth] = useState(true);
//   const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // 课程相关状态
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDescription, setCourseDescription] = useState('');

  // 章节相关状态
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState<string>('');
  const [chapterTitle, setChapterTitle] = useState('');
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [showChapterModal, setShowChapterModal] = useState(false);

  // 视频上传相关状态
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonDescription, setLessonDescription] = useState('');
  const [isFreeLesson, setIsFreeLesson] = useState(false);
  const [sortOrder, setSortOrder] = useState(0);
  
  // 分片上传相关状态
  const [useChunkUpload, setUseChunkUpload] = useState(false);
  const [chunkProgress, setChunkProgress] = useState({ uploaded: 0, total: 0, percent: 0 });
  const [uploadChunks, setUploadChunks] = useState<Array<{ index: number; status: string; progress: number }>>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 检查用户权限
  useEffect(() => {
    // checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 加载课程列表
  useEffect(() => {
    loadCourses();
    checkUserPermissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 检查用户权限和数据库状态
  const checkUserPermissions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn('用户未登录');
        return;
      }

      // 检查是否是管理员
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('获取用户信息失败:', profileError);
        setError('无法获取用户权限信息，请检查 user_profiles 表是否存在');
        return;
      }

      const isAdmin = (profile as any)?.is_admin;
      console.log('用户权限检查:', { userId: user.id, isAdmin });

      if (!isAdmin) {
        setError('您没有管理员权限，无法创建课程。请联系管理员为您添加管理员权限。');
      }

      // 检查表是否存在
      const { error: tableError } = await supabase
        .from('courses')
        .select('id')
        .limit(1);

      if (tableError) {
        if (tableError.code === '42P01') {
          setError('错误: courses 表不存在。请在 Supabase SQL Editor 中执行 .sql/create_courses_tables.sql 脚本');
        } else {
          console.error('检查表时出错:', tableError);
        }
      }
    } catch (err: any) {
      console.error('权限检查失败:', err);
    }
  };

  // 加载章节列表
  useEffect(() => {
    if (selectedCourseId) {
      loadChapters();
    } else {
      setChapters([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCourseId]);

  const checkAuth = async () => {
    // setIsCheckingAuth(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login?redirect=/admin/videoManage');
      return;
    }

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single<UserProfile>();

    if (error || !profile?.is_admin) {
    //   setHasPermission(false);
    //   setIsCheckingAuth(false);
      return;
    }

    // setHasPermission(true);
    // setIsCheckingAuth(false);
  };

  const loadCourses = async () => {
    try {
      console.log('开始加载课程列表...');
      const response = await fetch('/api/courses');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '加载课程失败');
      }

      const { courses } = await response.json();
      setCourses(courses || []);
      console.log('课程列表加载成功，共', courses?.length || 0, '个课程');
    } catch (err: any) {
      console.error('加载课程异常:', err);
      setError('加载课程失败: ' + err.message);
    }
  };

  const loadChapters = async () => {
    if (!selectedCourseId) return;

    try {
      const response = await fetch(`/api/chapters?courseId=${selectedCourseId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '加载章节失败');
      }

      const { chapters } = await response.json();
      setChapters(chapters || []);
    } catch (err: any) {
      console.error('加载章节失败:', err);
      setError('加载章节失败: ' + err.message);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('video/')) {
        setError('请选择视频文件');
        return;
      }
      setVideoFile(file);
      setError('');
    }
  };

  const handleCreateCourse = async () => {
    if (!courseTitle.trim()) {
      setError('请输入课程标题');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('开始创建课程...');
      
    //   const { data: { user }, error: userError } = await supabase.auth.getUser();
    //   console.log('用户信息:', { user: user?.id, error: userError });
      
    //   if (userError || !user) {
    //     setError('用户未登录: ' + (userError?.message || '请先登录'));
    //     setIsLoading(false);
    //     return;
    //   }

    //   // 检查管理员权限
    //   const { data: profile, error: profileError } = await supabase
    //     .from('user_profiles')
    //     .select('is_admin')
    //     .eq('id', user.id)
    //     .single();

    //   if (profileError) {
    //     console.error('获取用户权限失败:', profileError);
    //     setError('无法获取用户权限信息: ' + profileError.message);
    //     setIsLoading(false);
    //     return;
    //   }

      // 调用 API 创建课程（使用管理员密钥）
      console.log('调用 API 创建课程...');
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: courseTitle,
          description: courseDescription,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('创建课程失败:', errorData);
        setError('创建课程失败: ' + (errorData.error || '未知错误'));
      } else {
        const { course } = await response.json();
        console.log('课程创建成功:', course);
        setSuccess('课程创建成功！');
        setCourseTitle('');
        setCourseDescription('');
        await loadCourses();
        if (course) {
          const courseData = course as Course;
          setSelectedCourseId(courseData.id);
        }
      }
    } catch (err: any) {
      console.error('创建课程异常:', err);
      setError('创建课程失败: ' + (err.message || '未知错误'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateChapter = async () => {
    if (!chapterTitle.trim()) {
      setError('请输入章节标题');
      return;
    }

    if (!selectedCourseId) {
      setError('请先选择或创建课程');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/chapters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: selectedCourseId,
          title: chapterTitle,
          sortOrder: chapters.length,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError('创建章节失败: ' + (errorData.error || '未知错误'));
      } else {
        const { chapter } = await response.json();
        setSuccess('章节创建成功！');
        setChapterTitle('');
        loadChapters();
        if (chapter) {
          const chapterData = chapter as Chapter;
          setSelectedChapterId(chapterData.id);
        }
      }
    } catch (err: any) {
      setError('创建章节失败: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditChapter = (chapter: Chapter) => {
    setEditingChapter(chapter);
    setChapterTitle(chapter.title);
    setShowChapterModal(true);
  };

  const handleUpdateChapter = async () => {
    if (!editingChapter || !chapterTitle.trim()) {
      setError('请输入章节标题');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/chapters', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingChapter.id,
          title: chapterTitle,
          sortOrder: editingChapter.sort_order,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError('更新章节失败: ' + (errorData.error || '未知错误'));
      } else {
        setSuccess('章节更新成功！');
        setChapterTitle('');
        setEditingChapter(null);
        setShowChapterModal(false);
        loadChapters();
      }
    } catch (err: any) {
      setError('更新章节失败: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteChapter = async (chapterId: string) => {
    if (!confirm('确定要删除这个章节吗？删除后该章节下的所有视频也会被删除。')) {
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/chapters?id=${chapterId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError('删除章节失败: ' + (errorData.error || '未知错误'));
      } else {
        setSuccess('章节删除成功！');
        if (selectedChapterId === chapterId) {
          setSelectedChapterId('');
        }
        loadChapters();
      }
    } catch (err: any) {
      setError('删除章节失败: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingChapter(null);
    setChapterTitle('');
    setShowChapterModal(false);
  };

  // Direct Creator Upload（大文件直接上传到 Cloudflare）
  const handleChunkUpload = async () => {
    if (!videoFile) {
      setError('请选择视频文件');
      return;
    }

    if (!lessonTitle.trim()) {
      setError('请输入课程标题');
      return;
    }

    if (!selectedChapterId) {
      setError('请先选择或创建章节');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');
    setUploadProgress(0);
    setChunkProgress({ uploaded: 0, total: videoFile.size, percent: 0 });
    abortControllerRef.current = new AbortController();

    try {
      console.log('开始分片上传，文件大小:', (videoFile.size / 1024 / 1024).toFixed(2), 'MB');
      
      // 1. 创建 Direct Creator Upload 会话
      console.log('创建上传会话...');
      const createResponse = await fetch('/api/upload/video/chunk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: videoFile.name,
          fileSize: videoFile.size,
          title: lessonTitle,
        }),
      });

      console.log('上传会话响应状态:', createResponse.status);

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        console.error('创建上传会话失败:', errorData);
        throw new Error(errorData.error || '创建上传会话失败');
      }

      const { uploadId, uploadURL } = await createResponse.json();
      console.log('上传会话创建成功:', { uploadId, uploadURL: uploadURL?.substring(0, 50) + '...' });
      setUploadProgress(5);

      // 2. 直接上传整个文件到 Cloudflare（使用 XMLHttpRequest 支持进度）
      console.log('开始上传文件到 Cloudflare...');
      const xhr = new XMLHttpRequest();
      
      return new Promise<void>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            setUploadProgress(Math.min(95, percent));
            setChunkProgress({
              uploaded: e.loaded,
              total: e.total,
              percent: Math.min(95, percent),
            });
            console.log('上传进度:', percent + '%', `(${(e.loaded / 1024 / 1024).toFixed(2)} MB / ${(e.total / 1024 / 1024).toFixed(2)} MB)`);
          }
        });

        xhr.addEventListener('load', async () => {
          console.log('文件上传完成，HTTP 状态:', xhr.status);
          if (xhr.status === 200 || xhr.status === 201) {
            try {
              setUploadProgress(96);
              console.log('获取视频信息...');

              // 3. 获取视频信息
              const videoInfoResponse = await fetch('/api/upload/video/chunk', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ videoId: uploadId }),
              });

              if (!videoInfoResponse.ok) {
                const errorData = await videoInfoResponse.json();
                console.error('获取视频信息失败:', errorData);
                throw new Error(errorData.error || '获取视频信息失败');
              }

              const { video } = await videoInfoResponse.json();
              console.log('视频信息获取成功:', video);
              setUploadProgress(98);

              // 4. 保存课程信息到 Supabase（通过 API）
              console.log('保存课程信息到 Supabase...');
              const lessonResponse = await fetch('/api/lessons', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chapterId: selectedChapterId,
                  title: lessonTitle,
                  description: lessonDescription,
                  videoId: video.id,
                  videoUrl: video.url,
                  duration: video.duration,
                  isFree: isFreeLesson,
                  isLocked: !isFreeLesson,
                  sortOrder: sortOrder || 0,
                }),
              });

              if (!lessonResponse.ok) {
                const errorData = await lessonResponse.json();
                console.error('保存课程信息失败:', errorData);
                throw new Error('保存课程信息失败: ' + (errorData.error || '未知错误'));
              }

              console.log('课程信息保存成功');
              setUploadProgress(100);
              setSuccess('视频上传成功！');
              
              // 重置表单
              setVideoFile(null);
              setLessonTitle('');
              setLessonDescription('');
              setIsFreeLesson(false);
              setSortOrder(0);
              setUseChunkUpload(false);
              setUploadChunks([]);
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
              
              setIsLoading(false);
              resolve();
            } catch (err: any) {
              console.error('处理视频信息失败:', err);
              setError(err.message || '处理视频信息失败');
              setIsLoading(false);
              reject(err);
            }
          } else {
            const responseText = xhr.responseText;
            console.error('上传失败，HTTP 状态:', xhr.status, '响应:', responseText);
            const error = new Error(`上传失败: HTTP ${xhr.status} - ${responseText || '未知错误'}`);
            setError(error.message);
            setIsLoading(false);
            reject(error);
          }
        });

        xhr.addEventListener('error', () => {
          console.error('上传网络错误');
          const error = new Error('上传失败，网络错误');
          setError(error.message);
          setIsLoading(false);
          reject(error);
        });

        xhr.addEventListener('abort', () => {
          console.log('上传已取消');
          const error = new Error('上传已取消');
          setError(error.message);
          setIsLoading(false);
          reject(error);
        });

        // 支持取消
        abortControllerRef.current?.signal.addEventListener('abort', () => {
          xhr.abort();
        });

        // 开始上传
        const formData = new FormData();
        formData.append('file', videoFile);
        console.log('发送上传请求到:', uploadURL);
        xhr.open('POST', uploadURL);
        xhr.send(formData);
      });
    } catch (err: any) {
      setError(err.message || '上传失败，请稍后重试');
      setIsLoading(false);
      setTimeout(() => {
        setUploadProgress(0);
        setChunkProgress({ uploaded: 0, total: 0, percent: 0 });
      }, 2000);
    }
  };

  // 普通上传视频（客户端直接上传到 Cloudflare Stream，不经过服务端中转）
  const handleNormalUpload = async () => {
    if (!videoFile) {
      setError('请选择视频文件');
      return;
    }

    if (!lessonTitle.trim()) {
      setError('请输入课程标题');
      return;
    }

    if (!selectedChapterId) {
      setError('请先选择或创建章节');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');
    setUploadProgress(0);
    abortControllerRef.current = new AbortController();

    try {
      console.log('开始普通上传，文件大小:', (videoFile.size / 1024 / 1024).toFixed(2), 'MB');
      
      // 1. 创建 Direct Creator Upload 会话（服务端只负责生成上传 URL）
      console.log('创建上传会话...');
      const createResponse = await fetch('/api/upload/video/chunk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: videoFile.name,
          fileSize: videoFile.size,
          title: lessonTitle,
        }),
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        console.error('创建上传会话失败:', errorData);
        throw new Error(errorData.error || '创建上传会话失败');
      }

      const { uploadId, uploadURL } = await createResponse.json();
      console.log('上传会话创建成功:', { uploadId, uploadURL: uploadURL?.substring(0, 50) + '...' });
      setUploadProgress(5);

      // 2. 客户端直接上传到 Cloudflare Stream（使用 XMLHttpRequest 支持进度）
      console.log('开始上传文件到 Cloudflare...');
      const xhr = new XMLHttpRequest();
      
      return new Promise<void>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            setUploadProgress(Math.min(95, percent));
            console.log('上传进度:', percent + '%', `(${(e.loaded / 1024 / 1024).toFixed(2)} MB / ${(e.total / 1024 / 1024).toFixed(2)} MB)`);
          }
        });

        xhr.addEventListener('load', async () => {
          console.log('文件上传完成，HTTP 状态:', xhr.status);
          if (xhr.status === 200 || xhr.status === 201) {
            try {
              setUploadProgress(96);
              console.log('获取视频信息...');

              // 3. 获取视频信息（服务端只负责查询）
              const videoInfoResponse = await fetch('/api/upload/video/chunk', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ videoId: uploadId }),
              });

              if (!videoInfoResponse.ok) {
                const errorData = await videoInfoResponse.json();
                console.error('获取视频信息失败:', errorData);
                throw new Error(errorData.error || '获取视频信息失败');
              }

              const { video } = await videoInfoResponse.json();
              console.log('视频信息获取成功:', video);
              setUploadProgress(98);

              // 4. 保存课程信息到 Supabase（通过 API）
              console.log('保存课程信息到 Supabase...');
              const lessonResponse = await fetch('/api/lessons', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chapterId: selectedChapterId,
                  title: lessonTitle,
                  description: lessonDescription,
                  videoId: video.id,
                  videoUrl: video.url,
                  duration: video.duration,
                  isFree: isFreeLesson,
                  isLocked: !isFreeLesson,
                  sortOrder: sortOrder || 0,
                }),
              });

              if (!lessonResponse.ok) {
                const errorData = await lessonResponse.json();
                console.error('保存课程信息失败:', errorData);
                throw new Error('保存课程信息失败: ' + (errorData.error || '未知错误'));
              }

              console.log('课程信息保存成功');
              setUploadProgress(100);
              setSuccess('视频上传成功！');
              
              // 重置表单
              setVideoFile(null);
              setLessonTitle('');
              setLessonDescription('');
              setIsFreeLesson(false);
              setSortOrder(0);
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
              
              setIsLoading(false);
              resolve();
            } catch (err: any) {
              console.error('处理视频信息失败:', err);
              setError(err.message || '处理视频信息失败');
              setIsLoading(false);
              reject(err);
            }
          } else {
            const responseText = xhr.responseText;
            console.error('上传失败，HTTP 状态:', xhr.status, '响应:', responseText);
            const error = new Error(`上传失败: HTTP ${xhr.status} - ${responseText || '未知错误'}`);
            setError(error.message);
            setIsLoading(false);
            reject(error);
          }
        });

        xhr.addEventListener('error', () => {
          console.error('上传网络错误');
          const error = new Error('上传失败，网络错误');
          setError(error.message);
          setIsLoading(false);
          reject(error);
        });

        xhr.addEventListener('abort', () => {
          console.log('上传已取消');
          const error = new Error('上传已取消');
          setError(error.message);
          setIsLoading(false);
          reject(error);
        });

        // 支持取消
        abortControllerRef.current?.signal.addEventListener('abort', () => {
          xhr.abort();
        });

        // 开始上传（直接上传到 Cloudflare，不经过服务端）
        const formData = new FormData();
        formData.append('file', videoFile);
        console.log('发送上传请求到 Cloudflare:', uploadURL);
        xhr.open('POST', uploadURL);
        xhr.send(formData);
      });
    } catch (err: any) {
      console.error('上传失败:', err);
      setError(err.message || '上传失败，请稍后重试');
      setIsLoading(false);
      setTimeout(() => setUploadProgress(0), 2000);
    }
  };

  const handleUploadVideo = () => {
    if (useChunkUpload) {
      handleChunkUpload();
    } else {
      handleNormalUpload();
    }
  };

  const handleCancelUpload = () => {
    abortControllerRef.current?.abort();
    setIsLoading(false);
    setUploadProgress(0);
    setChunkProgress({ uploaded: 0, total: 0, percent: 0 });
    setUploadChunks([]);
  };

  

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* 页头 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            课程视频管理
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            创建课程、章节并上传视频到 Cloudflare Stream
          </p>
        </div>

        {/* 创建课程 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            创建课程
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                课程标题 *
              </label>
              <input
                type="text"
                value={courseTitle}
                onChange={(e) => setCourseTitle(e.target.value)}
                placeholder="请输入课程标题"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                课程描述
              </label>
              <textarea
                value={courseDescription}
                onChange={(e) => setCourseDescription(e.target.value)}
                placeholder="请输入课程描述"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                disabled={isLoading}
              />
            </div>
            <button
              onClick={handleCreateCourse}
              disabled={isLoading || !courseTitle.trim()}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
            >
              {isLoading ? '创建中...' : '创建课程'}
            </button>
          </div>
        </div>

        {/* 选择课程 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            选择课程
          </h2>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">请选择课程</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
        </div>

        {/* 创建章节 */}
        {selectedCourseId && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              创建章节
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  章节标题 *
                </label>
                <input
                  type="text"
                  value={chapterTitle}
                  onChange={(e) => setChapterTitle(e.target.value)}
                  placeholder="请输入章节标题"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  disabled={isLoading}
                />
              </div>
              <button
                onClick={handleCreateChapter}
                disabled={isLoading || !chapterTitle.trim()}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
              >
                {isLoading ? '创建中...' : '创建章节'}
              </button>
            </div>

            {/* 章节管理 */}
            {chapters.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    章节管理 ({chapters.length})
                  </h3>
                </div>
                <div className="space-y-2">
                  {chapters.map((chapter) => (
                    <div
                      key={chapter.id}
                      className={`p-3 border rounded-lg transition-colors ${
                        selectedChapterId === chapter.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div
                          className="flex-1 cursor-pointer"
                          onClick={() => setSelectedChapterId(chapter.id)}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {chapter.title}
                            </span>
                            <span className="text-xs text-gray-500">
                              排序: {chapter.sort_order}
                            </span>
                          </div>
                          {selectedChapterId === chapter.id && (
                            <span className="text-xs text-blue-600 dark:text-blue-400 mt-1 block">
                              已选择
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditChapter(chapter);
                            }}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                            title="编辑章节"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteChapter(chapter.id);
                            }}
                            className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                            title="删除章节"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 上传视频 */}
        {selectedChapterId && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              上传视频
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  课程标题 *
                </label>
                <input
                  type="text"
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                  placeholder="请输入课程标题"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  课程描述
                </label>
                <textarea
                  value={lessonDescription}
                  onChange={(e) => setLessonDescription(e.target.value)}
                  placeholder="请输入课程描述"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  选择视频文件 *
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-200"
                  disabled={isLoading}
                />
                {videoFile && (
                  <div className="mt-2 space-y-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      已选择: {videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                    {/* 大文件提示使用分片上传 */}
                    {videoFile.size > 100 * 1024 * 1024 && (
                      <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="useChunkUpload"
                            checked={useChunkUpload}
                            onChange={(e) => setUseChunkUpload(e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            disabled={isLoading}
                          />
                          <label htmlFor="useChunkUpload" className="text-sm text-yellow-800 dark:text-yellow-200 cursor-pointer">
                            文件较大，建议使用分片上传（更稳定，支持断点续传）
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    排序号
                  </label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    disabled={isLoading}
                  />
                </div>
                <div className="flex items-center pt-8">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isFreeLesson}
                      onChange={(e) => setIsFreeLesson(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      disabled={isLoading}
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">免费课程</span>
                  </label>
                </div>
              </div>
              <div className="space-y-3">
                <button
                  onClick={handleUploadVideo}
                  disabled={isLoading || !videoFile || !lessonTitle.trim()}
                  className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
                >
                  {isLoading ? `上传中... ${uploadProgress > 0 ? `${uploadProgress}%` : ''}` : useChunkUpload ? '分片上传视频' : '上传视频'}
                </button>
                {isLoading && (
                  <button
                    onClick={handleCancelUpload}
                    className="w-full px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                  >
                    取消上传
                  </button>
                )}
                
                {/* 上传进度 */}
                {uploadProgress > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                      <span>总进度: {uploadProgress}%</span>
                      {useChunkUpload && chunkProgress.total > 0 && (
                        <span>
                          {((chunkProgress.uploaded / 1024 / 1024).toFixed(2))} MB / {((chunkProgress.total / 1024 / 1024).toFixed(2))} MB
                        </span>
                      )}
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    
                    {/* 上传详情 */}
                    {useChunkUpload && chunkProgress.total > 0 && (
                      <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                          上传进度（直接上传到 Cloudflare）
                        </p>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {((chunkProgress.uploaded / 1024 / 1024).toFixed(2))} MB / {((chunkProgress.total / 1024 / 1024).toFixed(2))} MB
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 提示信息 */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-green-800 dark:text-green-200">{success}</p>
          </div>
        )}

        {/* 使用说明 */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-3">
            📋 使用说明
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-2">
            <li>• 首先创建课程，然后创建章节，最后上传视频</li>
            <li>• 视频会自动上传到 Cloudflare Stream 并转换为 HLS 格式</li>
            <li>• 支持常见视频格式：MP4, MOV, AVI 等</li>
            <li>• 上传的视频会自动生成播放链接和缩略图</li>
            <li>• 标记为&ldquo;免费课程&rdquo;的视频可以在课程播放器中免费观看</li>
            <li>• 大于 100MB 的文件建议使用分片上传，更稳定且支持断点续传</li>
            <li>• 章节管理：可以编辑章节标题和删除章节（删除章节会同时删除该章节下的所有视频）</li>
            <li>• 确保已配置 CLOUDFLARE_ACCOUNT_ID 和 CLOUDFLARE_API_TOKEN 环境变量</li>
          </ul>
        </div>
      </div>

      {/* 编辑章节模态框 */}
      {showChapterModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  编辑章节
                </h3>
                <button
                  onClick={handleCancelEdit}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    章节标题 *
                  </label>
                  <input
                    type="text"
                    value={chapterTitle}
                    onChange={(e) => setChapterTitle(e.target.value)}
                    placeholder="请输入章节标题"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-3 justify-end">
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleUpdateChapter}
                  disabled={isLoading || !chapterTitle.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
                >
                  {isLoading ? '保存中...' : '保存'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

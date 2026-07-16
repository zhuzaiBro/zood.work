'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { UserProfile } from '@/types/user';
import type { Database } from '@/types/database.types';
import LessonUploadModal from '@/components/admin/LessonUploadModal';
import CourseSettingsModal, {
  type CourseSettingsValues,
} from '@/components/admin/CourseSettingsModal';
import CourseAccessModal from '@/components/admin/CourseAccessModal';
import LessonChapterTable from '@/components/admin/LessonChapterTable';
import { AdminListSkeleton } from '@/components/ui/PageSkeleton';
import {
  App,
  Breadcrumb,
  Button,
  Card,
  Collapse,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Result,
  Space,
  Tag,
  Typography,
} from 'antd';
import {
  ArrowLeftOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  SettingOutlined,
  UploadOutlined,
  UserAddOutlined,
} from '@ant-design/icons';

interface LessonItem {
  id: string;
  title: string;
  description?: string | null;
  coursewareName?: string | null;
  coursewareUrl?: string | null;
  contentHtml?: string | null;
  contentMarkdown?: string | null;
  duration?: string;
  durationSeconds?: number | null;
  isFree: boolean;
  isLocked: boolean;
  videoUrl?: string | null;
  videoId?: string | null;
  sortOrder: number;
}

interface ChapterItem {
  id: string;
  title: string;
  description?: string | null;
  sortOrder: number;
  lessons: LessonItem[];
}

interface CourseDetail {
  id: string;
  title: string;
  description?: string | null;
  coverImageUrl?: string | null;
  status: string;
  isFree: boolean;
  price: number;
}

type CourseRow = Pick<
  Database['public']['Tables']['courses']['Row'],
  'id' | 'title' | 'description' | 'cover_image_url' | 'status' | 'is_free' | 'price'
>;
type ChapterRow = Pick<
  Database['public']['Tables']['chapters']['Row'],
  'id' | 'title' | 'description' | 'sort_order'
>;
type LessonRow = Pick<
  Database['public']['Tables']['lessons']['Row'],
  'id' | 'chapter_id' | 'title' | 'description' | 'courseware_name' | 'courseware_url' | 'content_html' | 'content_markdown' | 'duration' | 'is_free' | 'is_locked' | 'video_url' | 'video_id' | 'sort_order'
>;

const statusMap: Record<string, { color: string; label: string }> = {
  draft: { color: 'default', label: '草稿' },
  published: { color: 'green', label: '已发布' },
  archived: { color: 'orange', label: '已归档' },
};

const { Title, Text, Paragraph } = Typography;

export default function CourseDetailPage() {
  const params = useParams<{ courseId: string }>();
  const courseId = params.courseId;
  const router = useRouter();
  const supabase = createClient();
  const { message, modal } = App.useApp();

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(false);
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [chapters, setChapters] = useState<ChapterItem[]>([]);
  const [activeKeys, setActiveKeys] = useState<string[]>([]);

  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [accessModalOpen, setAccessModalOpen] = useState(false);

  const [chapterModalOpen, setChapterModalOpen] = useState(false);
  const [chapterModalMode, setChapterModalMode] = useState<'create' | 'edit'>('create');
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [chapterSaving, setChapterSaving] = useState(false);
  const [chapterForm] = Form.useForm<{ title: string; sortOrder?: number }>();

  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [lessonModalMode, setLessonModalMode] = useState<'create' | 'edit'>('create');
  const [editingLesson, setEditingLesson] = useState<LessonItem | null>(null);
  const [uploadChapterId, setUploadChapterId] = useState<string | null>(null);
  const [uploadChapterTitle, setUploadChapterTitle] = useState('');
  const [uploadDefaultSort, setUploadDefaultSort] = useState(0);

  const loadCourseDetail = useCallback(async () => {
    if (!courseId) return;
    setLoading(true);
    try {
      const [courseResult, chaptersResult] = await Promise.all([
        supabase
          .from('courses')
          .select('id, title, description, cover_image_url, status, is_free, price')
          .eq('id', courseId)
          .single(),
        supabase
          .from('chapters')
          .select('id, title, description, sort_order')
          .eq('course_id', courseId)
          .order('sort_order', { ascending: true }),
      ]);

      if (courseResult.error) throw courseResult.error;
      if (chaptersResult.error) throw chaptersResult.error;

      const chapterRows = (chaptersResult.data ?? []) as ChapterRow[];
      const chapterIds = chapterRows.map((chapter) => chapter.id);
      const lessonsResult = chapterIds.length > 0
        ? await supabase
          .from('lessons')
          .select('id, chapter_id, title, description, courseware_name, courseware_url, content_html, content_markdown, duration, is_free, is_locked, video_url, video_id, sort_order')
          .in('chapter_id', chapterIds)
          .order('sort_order', { ascending: true })
        : { data: [], error: null };

      if (lessonsResult.error) throw lessonsResult.error;

      const courseRow = courseResult.data as CourseRow;
      const lessonRows = (lessonsResult.data ?? []) as LessonRow[];
      const nextChapters = chapterRows.map((chapter) => ({
        id: chapter.id,
        title: chapter.title,
        description: chapter.description,
        sortOrder: chapter.sort_order,
        lessons: lessonRows
          .filter((lesson) => lesson.chapter_id === chapter.id)
          .map((lesson) => ({
            id: lesson.id,
            title: lesson.title,
            description: lesson.description,
            coursewareName: lesson.courseware_name,
            coursewareUrl: lesson.courseware_url,
            contentHtml: lesson.content_html,
            contentMarkdown: lesson.content_markdown,
            durationSeconds: lesson.duration,
            isFree: lesson.is_free,
            isLocked: lesson.is_locked,
            videoUrl: lesson.video_url,
            videoId: lesson.video_id,
            sortOrder: lesson.sort_order,
          })),
      }));

      setCourse({
        id: courseRow.id,
        title: courseRow.title,
        description: courseRow.description,
        coverImageUrl: courseRow.cover_image_url,
        status: courseRow.status,
        isFree: courseRow.is_free,
        price: Number(courseRow.price) || 0,
      });
      setChapters(nextChapters);
      if (nextChapters.length > 0) {
        setActiveKeys([nextChapters[0].id]);
      }
    } catch (error) {
      message.error(error instanceof Error ? error.message : '加载课程详情失败');
    } finally {
      setLoading(false);
    }
  }, [courseId, message, supabase]);

  useEffect(() => {
    const checkAuth = async () => {
      setIsCheckingAuth(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push(`/login?redirect=/admin/videoManage/${courseId}`);
        return;
      }

      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single<UserProfile>();

      if (error || !profile?.is_admin) {
        setHasPermission(false);
        setIsCheckingAuth(false);
        return;
      }

      setHasPermission(true);
      setIsCheckingAuth(false);
      loadCourseDetail();
    };

    checkAuth();
  }, [courseId, router, loadCourseDetail, supabase]);

  const handleSaveSettings = async (values: CourseSettingsValues) => {
    if (!courseId) return;
    setSettingsSaving(true);

    try {
      const { data: updated, error } = await supabase
        .from('courses')
        .update({
          title: values.title,
          description: values.description,
          cover_image_url: values.coverImageUrl || null,
          status: values.status,
          is_free: values.isFree,
          price: values.isFree ? 0 : values.price,
        } as never)
        .eq('id', courseId)
        .select('id, title, description, cover_image_url, status, is_free, price')
        .single();

      if (error) throw error;
      const updatedCourse = updated as CourseRow;
      setCourse({
        id: updatedCourse.id,
        title: updatedCourse.title,
        description: updatedCourse.description,
        coverImageUrl: updatedCourse.cover_image_url,
        status: updatedCourse.status,
        isFree: updatedCourse.is_free,
        price: Number(updatedCourse.price) || 0,
      });
      message.success('课程设置已保存');
      setSettingsModalOpen(false);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '保存课程设置失败');
    } finally {
      setSettingsSaving(false);
    }
  };

  const openCreateChapter = () => {
    setChapterModalMode('create');
    setEditingChapterId(null);
    chapterForm.setFieldsValue({
      title: '',
      sortOrder: chapters.length,
    });
    setChapterModalOpen(true);
  };

  const openEditChapter = (chapter: ChapterItem) => {
    setChapterModalMode('edit');
    setEditingChapterId(chapter.id);
    chapterForm.setFieldsValue({
      title: chapter.title,
      sortOrder: chapter.sortOrder,
    });
    setChapterModalOpen(true);
  };

  const handleSaveChapter = async () => {
    const values = await chapterForm.validateFields();
    setChapterSaving(true);

    try {
      if (chapterModalMode === 'create') {
        const { error } = await supabase
          .from('chapters')
          .insert({
            course_id: courseId,
            title: values.title,
            sort_order: values.sortOrder ?? chapters.length,
          } as never);
        if (error) throw error;
        message.success('章节已创建');
      } else if (editingChapterId) {
        const { error } = await supabase
          .from('chapters')
          .update({
            title: values.title,
            sort_order: values.sortOrder ?? 0,
          } as never)
          .eq('id', editingChapterId);
        if (error) throw error;
        message.success('章节已更新');
      }

      setChapterModalOpen(false);
      loadCourseDetail();
    } catch (error) {
      message.error(error instanceof Error ? error.message : '保存章节失败');
    } finally {
      setChapterSaving(false);
    }
  };

  const confirmDeleteChapter = (chapter: ChapterItem) => {
    modal.confirm({
      title: '删除章节',
      content: `确定删除「${chapter.title}」吗？该章节下 ${chapter.lessons.length} 个课时也会一并删除。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        const { error } = await supabase
          .from('chapters')
          .delete()
          .eq('id', chapter.id);
        if (error) throw error;
        message.success('章节已删除');
        loadCourseDetail();
      },
    });
  };

  const openUploadLesson = (chapter: ChapterItem) => {
    setLessonModalMode('create');
    setEditingLesson(null);
    setUploadChapterId(chapter.id);
    setUploadChapterTitle(chapter.title);
    setUploadDefaultSort(chapter.lessons.length);
    setLessonModalOpen(true);
  };

  const openEditLesson = (chapter: ChapterItem, lesson: LessonItem) => {
    setLessonModalMode('edit');
    setEditingLesson(lesson);
    setUploadChapterId(chapter.id);
    setUploadChapterTitle(chapter.title);
    setUploadDefaultSort(lesson.sortOrder);
    setLessonModalOpen(true);
  };

  const handleLessonsChange = (chapterId: string, lessons: LessonItem[]) => {
    setChapters((prev) =>
      prev.map((chapter) =>
        chapter.id === chapterId ? { ...chapter, lessons } : chapter,
      ),
    );
  };

  if (isCheckingAuth) {
    return <AdminListSkeleton />;
  }

  if (!hasPermission) {
    return (
      <Result
        status="403"
        title="无权访问"
        subTitle="此页面仅限管理员访问。"
        extra={
          <Button type="primary" onClick={() => router.push('/')}>
            返回首页
          </Button>
        }
      />
    );
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Breadcrumb
        items={[
          { title: <Link href="/admin/videoManage">视频课程</Link> },
          { title: course?.title || '课程详情' },
        ]}
      />

      <Card loading={loading && !course} styles={{ body: { padding: '12px 16px' } }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
          <Space align="center" size={12}>
            <Link href="/admin/videoManage">
              <Button type="text" icon={<ArrowLeftOutlined />} />
            </Link>
            <div
              role="button"
              tabIndex={0}
              onClick={() => setSettingsModalOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setSettingsModalOpen(true);
              }}
              style={{
                width: 72,
                height: 54,
                borderRadius: 6,
                overflow: 'hidden',
                border: '1px solid #f0f0f0',
                flexShrink: 0,
                cursor: 'pointer',
                background: '#fafafa',
              }}
            >
              {course?.coverImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={course.coverImageUrl}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    color: '#bbb',
                  }}
                >
                  封面
                </div>
              )}
            </div>
            <div style={{ minWidth: 0 }}>
              <Space align="center" wrap size={8}>
                <Title level={4} style={{ margin: 0 }}>
                  {course?.title || '课程详情'}
                </Title>
                {course?.status && (
                  <Tag color={statusMap[course.status]?.color || 'default'}>
                    {statusMap[course.status]?.label || course.status}
                  </Tag>
                )}
                {course?.isFree ? (
                  <Tag color="blue">免费</Tag>
                ) : course ? (
                  <Tag color="gold">¥{course.price}</Tag>
                ) : null}
              </Space>
              {course?.description ? (
                <Paragraph
                  type="secondary"
                  ellipsis={{ rows: 1 }}
                  style={{ marginBottom: 0, marginTop: 2, maxWidth: 480 }}
                >
                  {course.description}
                </Paragraph>
              ) : null}
            </div>
          </Space>
          <Space wrap>
            <Button icon={<ReloadOutlined />} onClick={loadCourseDetail} disabled={loading}>
              {loading ? '刷新中' : '刷新'}
            </Button>
            <Button icon={<SettingOutlined />} onClick={() => setSettingsModalOpen(true)}>
              课程设置
            </Button>
            <Button icon={<UserAddOutlined />} onClick={() => setAccessModalOpen(true)}>
              开通课程
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreateChapter}>
              添加章节
            </Button>
          </Space>
        </div>
      </Card>

      <Card loading={loading && !course}>
        {chapters.length === 0 ? (
          <Empty description="暂无章节，先添加一个章节吧">
            <Button type="primary" onClick={openCreateChapter}>
              添加章节
            </Button>
          </Empty>
        ) : (
          <Collapse
            activeKey={activeKeys}
            onChange={(keys) => setActiveKeys(Array.isArray(keys) ? keys : [keys])}
            items={chapters.map((chapter) => ({
              key: chapter.id,
              label: (
                <Space>
                  <Text strong>{chapter.title}</Text>
                  <Tag>{chapter.lessons.length} 课时</Tag>
                  <Text type="secondary">排序 {chapter.sortOrder}</Text>
                </Space>
              ),
              extra: (
                <Space size="small" onClick={(e) => e.stopPropagation()}>
                  <Button
                    size="small"
                    icon={<UploadOutlined />}
                    onClick={() => openUploadLesson(chapter)}
                  >
                    上传课时
                  </Button>
                  <Button
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => openEditChapter(chapter)}
                  />
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => confirmDeleteChapter(chapter)}
                  />
                </Space>
              ),
              children: (
                <>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                    拖拽左侧 ⋮⋮ 调整顺序，或直接修改排序号后回车
                  </Text>
                  <LessonChapterTable
                    chapterId={chapter.id}
                    lessons={chapter.lessons}
                    onEdit={(lesson) => openEditLesson(chapter, lesson)}
                    onLessonsChange={handleLessonsChange}
                  />
                </>
              ),
            }))}
          />
        )}
      </Card>

      <Modal
        title={chapterModalMode === 'create' ? '添加章节' : '编辑章节'}
        open={chapterModalOpen}
        onCancel={() => setChapterModalOpen(false)}
        onOk={handleSaveChapter}
        okText={chapterSaving ? '保存中' : '保存'}
        cancelText="取消"
        okButtonProps={{ disabled: chapterSaving }}
        destroyOnClose
      >
        <Form form={chapterForm} layout="vertical" preserve={false}>
          <Form.Item
            name="title"
            label="章节标题"
            rules={[{ required: true, message: '请输入章节标题' }]}
          >
            <Input placeholder="请输入章节标题" />
          </Form.Item>
          <Form.Item name="sortOrder" label="排序号">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      <CourseSettingsModal
        open={settingsModalOpen}
        loading={settingsSaving}
        initialValues={
          course
            ? {
                title: course.title,
                description: course.description ?? '',
                coverImageUrl: course.coverImageUrl ?? '',
                status: course.status,
                isFree: course.isFree,
                price: course.price,
              }
            : undefined
        }
        onCancel={() => setSettingsModalOpen(false)}
        onSubmit={handleSaveSettings}
      />

      <CourseAccessModal
        open={accessModalOpen}
        courseId={courseId}
        onCancel={() => setAccessModalOpen(false)}
      />

      <LessonUploadModal
        open={lessonModalOpen}
        mode={lessonModalMode}
        lesson={editingLesson}
        chapterId={uploadChapterId}
        chapterTitle={uploadChapterTitle}
        defaultSortOrder={uploadDefaultSort}
        onCancel={() => {
          setLessonModalOpen(false);
          setEditingLesson(null);
        }}
        onSuccess={() => {
          setLessonModalOpen(false);
          setEditingLesson(null);
          loadCourseDetail();
        }}
      />
    </Space>
  );
}

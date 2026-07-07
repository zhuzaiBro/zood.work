'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { UserProfile } from '@/types/user';
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
      const response = await fetch(`/api/courses/${courseId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '加载课程详情失败');
      }
      const data = await response.json();
      setCourse(data.course);
      setChapters(data.chapters || []);
      if ((data.chapters || []).length > 0) {
        setActiveKeys([data.chapters[0].id]);
      }
    } catch (error) {
      message.error(error instanceof Error ? error.message : '加载课程详情失败');
    } finally {
      setLoading(false);
    }
  }, [courseId, message]);

  useEffect(() => {
    const checkAuth = async () => {
      setIsCheckingAuth(true);
      const supabase = createClient();
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
  }, [courseId, router, loadCourseDetail]);

  const handleSaveSettings = async (values: CourseSettingsValues) => {
    if (!courseId) return;
    setSettingsSaving(true);

    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: values.title,
          description: values.description,
          coverImageUrl: values.coverImageUrl || null,
          status: values.status,
          isFree: values.isFree,
          price: values.isFree ? 0 : values.price,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '保存课程设置失败');
      }

      const { course: updated } = await response.json();
      setCourse(updated);
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
        const response = await fetch('/api/chapters', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courseId,
            title: values.title,
            sortOrder: values.sortOrder ?? chapters.length,
          }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '创建章节失败');
        }
        message.success('章节已创建');
      } else if (editingChapterId) {
        const response = await fetch('/api/chapters', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingChapterId,
            title: values.title,
            sortOrder: values.sortOrder ?? 0,
          }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '更新章节失败');
        }
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
        const response = await fetch(`/api/chapters?id=${chapter.id}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '删除章节失败');
        }
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

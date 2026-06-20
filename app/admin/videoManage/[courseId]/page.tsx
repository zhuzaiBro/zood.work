'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { UserProfile } from '@/types/user';
import LessonUploadModal from '@/components/admin/LessonUploadModal';
import {
  App,
  Avatar,
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
  Select,
  Space,
  Spin,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  ArrowLeftOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  StopOutlined,
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
  status: string;
  isFree: boolean;
  price: number;
}

interface CourseEnrollment {
  id: number;
  courseId: string;
  userId: string;
  source: string;
  status: string;
  grantedAt: string;
  revokedAt?: string | null;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CourseAccessUser {
  id: string;
  email?: string | null;
  phone?: string | null;
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  provider?: string | null;
  isAdmin: boolean;
  hasProfile: boolean;
  createdAt?: string | null;
  lastSignInAt?: string | null;
  enrollment: CourseEnrollment | null;
}

const STATUS_OPTIONS = [
  { value: 'draft', label: '草稿', description: '仅管理员可见，前台不展示' },
  { value: 'published', label: '已发布', description: '在课程列表中公开可见' },
  { value: 'archived', label: '已归档', description: '下架隐藏，已购用户策略待定' },
] as const;

const statusMap: Record<string, { color: string; label: string }> = {
  draft: { color: 'default', label: '草稿' },
  published: { color: 'green', label: '已发布' },
  archived: { color: 'orange', label: '已归档' },
};

const formatDateTime = (value?: string | null) => {
  if (!value) return '-';

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
};

type CourseSettingsValues = {
  status: string;
  isFree: boolean;
  price: number;
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
  const [accessUsers, setAccessUsers] = useState<CourseAccessUser[]>([]);
  const [accessLoading, setAccessLoading] = useState(false);
  const [selectedAccessUserId, setSelectedAccessUserId] = useState<string>();
  const [grantingUserId, setGrantingUserId] = useState<string | null>(null);

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

  const [settingsForm] = Form.useForm<CourseSettingsValues>();
  const [settingsSaving, setSettingsSaving] = useState(false);
  const isFreeWatch = Form.useWatch('isFree', settingsForm);
  const statusWatch = Form.useWatch('status', settingsForm);

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
      settingsForm.setFieldsValue({
        status: data.course.status || 'draft',
        isFree: data.course.isFree ?? false,
        price: data.course.price ?? 0,
      });
      if ((data.chapters || []).length > 0) {
        setActiveKeys([data.chapters[0].id]);
      }
    } catch (error) {
      message.error(error instanceof Error ? error.message : '加载课程详情失败');
    } finally {
      setLoading(false);
    }
  }, [courseId, message, settingsForm]);

  const loadCourseAccess = useCallback(async () => {
    if (!courseId) return;
    setAccessLoading(true);

    try {
      const response = await fetch(`/api/admin/course-enrollments?courseId=${courseId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '加载用户开通列表失败');
      }

      setAccessUsers(data.users || []);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '加载用户开通列表失败');
    } finally {
      setAccessLoading(false);
    }
  }, [courseId, message]);

  const handleGrantAccess = async (targetUserId?: string) => {
    const userId = targetUserId || selectedAccessUserId;
    if (!courseId || !userId) {
      message.warning('请先选择要开通的用户');
      return;
    }

    setGrantingUserId(userId);
    try {
      const response = await fetch('/api/admin/course-enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, userId }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '开通失败');
      }

      message.success('课程已开通');
      setSelectedAccessUserId(undefined);
      loadCourseAccess();
    } catch (error) {
      message.error(error instanceof Error ? error.message : '开通失败');
    } finally {
      setGrantingUserId(null);
    }
  };

  const handleRevokeAccess = async (record: CourseAccessUser) => {
    modal.confirm({
      title: '撤销课程开通',
      content: `确定撤销「${record.displayName || record.username}」的课程访问权限吗？`,
      okText: '撤销',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        setGrantingUserId(record.id);

        try {
          const response = await fetch('/api/admin/course-enrollments', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              courseId,
              userId: record.id,
              status: 'revoked',
            }),
          });
          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || '撤销失败');
          }

          message.success('已撤销课程开通');
          loadCourseAccess();
        } catch (error) {
          message.error(error instanceof Error ? error.message : '撤销失败');
        } finally {
          setGrantingUserId(null);
        }
      },
    });
  };

  const handleSaveSettings = async () => {
    if (!courseId) return;
    const values = await settingsForm.validateFields();
    setSettingsSaving(true);

    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
      settingsForm.setFieldsValue({
        status: updated.status,
        isFree: updated.isFree,
        price: updated.price,
      });
      message.success('课程设置已保存');
    } catch (error) {
      message.error(error instanceof Error ? error.message : '保存课程设置失败');
    } finally {
      setSettingsSaving(false);
    }
  };

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
      loadCourseAccess();
    };

    checkAuth();
  }, [courseId, router, loadCourseDetail, loadCourseAccess]);

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

  const grantableUsers = accessUsers.filter(
    (item) => item.hasProfile && item.enrollment?.status !== 'active',
  );

  const activeAccessCount = accessUsers.filter(
    (item) => item.enrollment?.status === 'active',
  ).length;

  const accessUserColumns: ColumnsType<CourseAccessUser> = [
    {
      title: '用户',
      key: 'user',
      render: (_, record) => {
        const displayName = record.displayName || record.username || record.email || record.id;
        const initial = displayName.slice(0, 1).toUpperCase();

        return (
          <Space>
            <Avatar src={record.avatarUrl || undefined}>{initial}</Avatar>
            <div>
              <Space size={6}>
                <Text strong>{displayName}</Text>
                {record.isAdmin && <Tag color="purple">管理员</Tag>}
                {!record.hasProfile && <Tag color="warning">未同步资料</Tag>}
              </Space>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {record.email || record.phone || record.id}
                </Text>
              </div>
            </div>
          </Space>
        );
      },
    },
    {
      title: '登录来源',
      dataIndex: 'provider',
      key: 'provider',
      width: 110,
      render: (provider?: string | null) => provider || '-',
    },
    {
      title: '状态',
      key: 'status',
      width: 110,
      render: (_, record) => {
        if (record.enrollment?.status === 'active') {
          return <Tag color="green">已开通</Tag>;
        }

        if (record.enrollment?.status === 'revoked') {
          return <Tag color="orange">已撤销</Tag>;
        }

        return <Tag>未开通</Tag>;
      },
    },
    {
      title: '开通时间',
      key: 'grantedAt',
      width: 180,
      render: (_, record) => formatDateTime(record.enrollment?.grantedAt),
    },
    {
      title: '最近登录',
      dataIndex: 'lastSignInAt',
      key: 'lastSignInAt',
      width: 180,
      render: (value?: string | null) => formatDateTime(value),
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_, record) => {
        const isActive = record.enrollment?.status === 'active';
        const grantButton = (
          <Button
            size="small"
            type={isActive ? 'default' : 'primary'}
            icon={isActive ? <StopOutlined /> : <UserAddOutlined />}
            danger={isActive}
            disabled={!record.hasProfile}
            loading={grantingUserId === record.id}
            onClick={() => {
              if (isActive) {
                handleRevokeAccess(record);
              } else {
                handleGrantAccess(record.id);
              }
            }}
          >
            {isActive ? '撤销' : '开通'}
          </Button>
        );

        if (record.hasProfile) {
          return grantButton;
        }

        return (
          <Tooltip title="该用户还没有 user_profiles 资料，请让用户先登录一次">
            {grantButton}
          </Tooltip>
        );
      },
    },
  ];

  const lessonColumns: ColumnsType<LessonItem> = [
    {
      title: '课时标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: '时长',
      dataIndex: 'duration',
      key: 'duration',
      width: 90,
      render: (duration?: string) => duration || '-',
    },
    {
      title: '免费',
      key: 'isFree',
      width: 80,
      render: (_, record) => (record.isFree ? <Tag color="blue">免费</Tag> : '-'),
    },
    {
      title: 'Video ID',
      dataIndex: 'videoId',
      key: 'videoId',
      width: 120,
      ellipsis: true,
      render: (videoId?: string | null) => videoId || '-',
    },
    {
      title: '资料',
      key: 'resources',
      width: 160,
      render: (_, record) => (
        <Space size={4} wrap>
          {record.coursewareUrl ? <Tag color="cyan">课件</Tag> : null}
          {record.contentMarkdown ? <Tag color="geekblue">讲义</Tag> : null}
          {!record.coursewareUrl && !record.contentMarkdown ? '-' : null}
        </Space>
      ),
    },
    {
      title: '排序',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      width: 70,
    },
    {
      title: '操作',
      key: 'actions',
      width: 90,
      render: (_, record) => {
        const chapter = chapters.find((item) => item.lessons.some((lesson) => lesson.id === record.id));
        if (!chapter) return null;

        return (
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEditLesson(chapter, record)}
          >
            编辑
          </Button>
        );
      },
    },
  ];

  if (isCheckingAuth) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 120 }}>
        <Spin size="large" tip="验证权限中..." />
      </div>
    );
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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
        <div>
          <Space align="center" style={{ marginBottom: 8 }}>
            <Link href="/admin/videoManage">
              <Button type="text" icon={<ArrowLeftOutlined />} />
            </Link>
            <Title level={3} style={{ margin: 0 }}>
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
          {course?.description && (
            <Paragraph type="secondary" style={{ marginBottom: 0 }}>
              {course.description}
            </Paragraph>
          )}
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadCourseDetail} loading={loading}>
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateChapter}>
            添加章节
          </Button>
        </Space>
      </div>

      <Card title="发布与定价" loading={loading && !course}>
        <Form
          form={settingsForm}
          layout="vertical"
          onFinish={handleSaveSettings}
          style={{ maxWidth: 480 }}
        >
          <Form.Item
            name="status"
            label="可见度"
            rules={[{ required: true, message: '请选择可见度' }]}
            extra={
              STATUS_OPTIONS.find((item) => item.value === statusWatch)?.description
            }
            >
            <Select
              options={STATUS_OPTIONS.map((item) => ({
                value: item.value,
                label: item.label,
              }))}
            />
          </Form.Item>
          <Form.Item name="isFree" label="免费课程" valuePropName="checked">
            <Switch
              checkedChildren="免费"
              unCheckedChildren="付费"
              onChange={(checked) => {
                if (checked) {
                  settingsForm.setFieldValue('price', 0);
                }
              }}
            />
          </Form.Item>
          <Form.Item
            name="price"
            label="价格（元）"
            rules={[
              {
                validator: async (_, value) => {
                  if (settingsForm.getFieldValue('isFree')) return;
                  if (value === undefined || value === null) {
                    throw new Error('请输入价格');
                  }
                  if (Number(value) < 0) {
                    throw new Error('价格不能为负数');
                  }
                },
              },
            ]}
          >
            <InputNumber
              min={0}
              precision={2}
              addonBefore="¥"
              style={{ width: '100%' }}
              disabled={isFreeWatch}
              placeholder={isFreeWatch ? '免费课程无需定价' : '请输入价格'}
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" loading={settingsSaving}>
              保存设置
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card
        title={
          <Space>
            <span>用户开通</span>
            <Tag color="green">{activeAccessCount} 人已开通</Tag>
          </Space>
        }
        extra={
          <Button icon={<ReloadOutlined />} onClick={loadCourseAccess} loading={accessLoading}>
            刷新用户
          </Button>
        }
      >
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Space.Compact style={{ width: '100%', maxWidth: 680 }}>
            <Select
              showSearch
              allowClear
              value={selectedAccessUserId}
              placeholder="搜索用户昵称、邮箱、手机号后开通课程"
              optionFilterProp="label"
              loading={accessLoading}
              onChange={setSelectedAccessUserId}
              style={{ flex: 1 }}
              options={grantableUsers.map((item) => {
                const displayName = item.displayName || item.username || item.email || item.id;
                const contact = item.email || item.phone || item.id;

                return {
                  value: item.id,
                  label: `${displayName} ${contact}`,
                  disabled: !item.hasProfile,
                };
              })}
              notFoundContent={accessLoading ? <Spin size="small" /> : '暂无可开通用户'}
            />
            <Button
              type="primary"
              icon={<UserAddOutlined />}
              loading={Boolean(selectedAccessUserId && grantingUserId === selectedAccessUserId)}
              onClick={() => handleGrantAccess()}
            >
              开通课程
            </Button>
          </Space.Compact>

          <Table
            rowKey="id"
            size="middle"
            loading={accessLoading}
            columns={accessUserColumns}
            dataSource={accessUsers}
            pagination={{ pageSize: 8, showSizeChanger: false }}
            locale={{ emptyText: '暂无用户数据' }}
          />
        </Space>
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
                <Table
                  rowKey="id"
                  size="small"
                  columns={lessonColumns}
                  dataSource={chapter.lessons}
                  pagination={false}
                  locale={{ emptyText: '该章节暂无课时，点击「上传课时」添加' }}
                />
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
        okText="保存"
        cancelText="取消"
        confirmLoading={chapterSaving}
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

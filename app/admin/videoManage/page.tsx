'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { UserProfile } from '@/types/user';
import CourseFormModal, { CourseFormValues } from '@/components/admin/CourseFormModal';
import CourseListTable, { type CourseRow } from '@/components/admin/CourseListTable';
import { AdminListSkeleton } from '@/components/ui/PageSkeleton';
import {
  App,
  Button,
  Card,
  Empty,
  Result,
  Space,
  Typography,
} from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export default function VideoManagePage() {
  const router = useRouter();
  const supabase = createClient();
  const { message } = App.useApp();

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuth = async () => {
    setIsCheckingAuth(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

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
      setHasPermission(false);
      setIsCheckingAuth(false);
      return;
    }

    setHasPermission(true);
    setIsCheckingAuth(false);
    loadCourses();
  };

  const loadCourses = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/courses');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '加载课程失败');
      }
      const { courses: data } = await response.json();
      setCourses(
        (data || []).map((course: CourseRow) => ({
          ...course,
          sort_order: course.sort_order ?? 0,
        })),
      );
    } catch (error) {
      message.error(error instanceof Error ? error.message : '加载课程失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async (values: CourseFormValues) => {
    setCreating(true);
    try {
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '创建课程失败');
      }

      const { course } = await response.json();
      message.success('课程创建成功');
      setCreateModalOpen(false);
      await loadCourses();
      if (course?.id) {
        router.push(`/admin/videoManage/${course.id}`);
      }
    } catch (error) {
      message.error(error instanceof Error ? error.message : '创建课程失败');
    } finally {
      setCreating(false);
    }
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Title level={3} style={{ marginBottom: 4 }}>
            视频课程管理
          </Title>
          <Text type="secondary">拖拽或修改排序号调整课程顺序，前台列表按此顺序展示</Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadCourses} disabled={loading}>
            {loading ? '刷新中' : '刷新'}
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
            创建课程
          </Button>
        </Space>
      </div>

      <Card>
        {loading && courses.length === 0 ? (
          <AdminListSkeleton rows={4} />
        ) : courses.length === 0 ? (
          <Empty description="暂无课程">
            <Button type="primary" onClick={() => setCreateModalOpen(true)}>
              创建课程
            </Button>
          </Empty>
        ) : (
          <>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>
              拖拽左侧 ⋮⋮ 调整顺序，或直接修改排序号后回车
            </Text>
            <CourseListTable
              courses={courses}
              loading={false}
              onCoursesChange={setCourses}
            />
          </>
        )}
      </Card>

      <CourseFormModal
        open={createModalOpen}
        loading={creating}
        onCancel={() => setCreateModalOpen(false)}
        onSubmit={handleCreateCourse}
      />
    </Space>
  );
}

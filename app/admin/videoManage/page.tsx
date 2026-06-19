'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { UserProfile } from '@/types/user';
import CourseFormModal, { CourseFormValues } from '@/components/admin/CourseFormModal';
import {
  App,
  Button,
  Card,
  Empty,
  Result,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';

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

const { Title, Text } = Typography;

const statusMap: Record<string, { color: string; label: string }> = {
  draft: { color: 'default', label: '草稿' },
  published: { color: 'green', label: '已发布' },
  archived: { color: 'orange', label: '已归档' },
};

export default function VideoManagePage() {
  const router = useRouter();
  const supabase = createClient();
  const { message } = App.useApp();

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
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
      setCourses(data || []);
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

  const columns: ColumnsType<Course> = [
    {
      title: '课程名称',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const item = statusMap[status] || { color: 'default', label: status };
        return <Tag color={item.color}>{item.label}</Tag>;
      },
    },
    {
      title: '免费',
      dataIndex: 'is_free',
      key: 'is_free',
      width: 80,
      render: (isFree: boolean) => (isFree ? <Tag color="blue">免费</Tag> : '-'),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      render: (value: string) => new Date(value).toLocaleDateString('zh-CN'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Link href={`/admin/videoManage/${record.id}`}>管理</Link>
      ),
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Title level={3} style={{ marginBottom: 4 }}>
            视频课程管理
          </Title>
          <Text type="secondary">管理课程列表，进入详情编辑章节与课时</Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadCourses} loading={loading}>
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
            创建课程
          </Button>
        </Space>
      </div>

      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={courses}
          loading={loading}
          locale={{ emptyText: <Empty description="暂无课程" /> }}
          pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 门课程` }}
        />
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

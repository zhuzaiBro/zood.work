'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  App,
  Avatar,
  Button,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ReloadOutlined, StopOutlined, UserAddOutlined } from '@ant-design/icons';
import Skeleton from '@/components/ui/Skeleton';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database.types';

type ProfileRow = Pick<
  Database['public']['Tables']['user_profiles']['Row'],
  'id' | 'username' | 'display_name' | 'avatar_url' | 'is_admin' | 'created_at'
>;
type EnrollmentRow = Pick<
  Database['public']['Tables']['course_enrollments']['Row'],
  'id' | 'course_id' | 'user_id' | 'source' | 'status' | 'granted_at' | 'revoked_at' | 'note' | 'created_at' | 'updated_at'
>;

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

export interface CourseAccessUser {
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

interface CourseAccessModalProps {
  open: boolean;
  courseId: string;
  onCancel: () => void;
  onAccessChange?: () => void;
}

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

const { Text } = Typography;

export default function CourseAccessModal({
  open,
  courseId,
  onCancel,
  onAccessChange,
}: CourseAccessModalProps) {
  const { message, modal } = App.useApp();
  const supabase = createClient();
  const [accessUsers, setAccessUsers] = useState<CourseAccessUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>();
  const [grantingUserId, setGrantingUserId] = useState<string | null>(null);

  const loadAccess = useCallback(async () => {
    if (!courseId) return;
    setLoading(true);
    try {
      const [profilesResult, enrollmentsResult] = await Promise.all([
        supabase
          .from('user_profiles')
          .select('id, username, display_name, avatar_url, is_admin, created_at')
          .order('created_at', { ascending: false }),
        supabase
          .from('course_enrollments')
          .select('id, course_id, user_id, source, status, granted_at, revoked_at, note, created_at, updated_at')
          .eq('course_id', courseId)
          .order('created_at', { ascending: false }),
      ]);

      if (profilesResult.error) throw profilesResult.error;
      if (enrollmentsResult.error) throw enrollmentsResult.error;

      const enrollmentRows = (enrollmentsResult.data ?? []) as EnrollmentRow[];
      const enrollmentsByUserId = new Map(
        enrollmentRows.map((enrollment) => [enrollment.user_id, enrollment]),
      );
      const profileRows = (profilesResult.data ?? []) as ProfileRow[];
      const users: CourseAccessUser[] = profileRows.map((profile) => {
        const enrollment = enrollmentsByUserId.get(profile.id);
        return {
          id: profile.id,
          email: null,
          phone: null,
          username: profile.username,
          displayName: profile.display_name,
          avatarUrl: profile.avatar_url,
          provider: null,
          isAdmin: Boolean(profile.is_admin),
          hasProfile: true,
          createdAt: profile.created_at,
          lastSignInAt: null,
          enrollment: enrollment
            ? {
                id: enrollment.id,
                courseId: enrollment.course_id,
                userId: enrollment.user_id,
                source: enrollment.source,
                status: enrollment.status,
                grantedAt: enrollment.granted_at,
                revokedAt: enrollment.revoked_at,
                note: enrollment.note,
                createdAt: enrollment.created_at,
                updatedAt: enrollment.updated_at,
              }
            : null,
        };
      });
      setAccessUsers(users);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '加载用户开通列表失败');
    } finally {
      setLoading(false);
    }
  }, [courseId, message, supabase]);

  useEffect(() => {
    if (open) {
      loadAccess();
      setSelectedUserId(undefined);
    }
  }, [open, loadAccess]);

  const grantableUsers = accessUsers.filter(
    (item) => item.hasProfile && item.enrollment?.status !== 'active',
  );

  const activeCount = accessUsers.filter((item) => item.enrollment?.status === 'active').length;

  const handleGrant = async (targetUserId?: string) => {
    const userId = targetUserId || selectedUserId;
    if (!userId) {
      message.warning('请先选择要开通的用户');
      return;
    }

    setGrantingUserId(userId);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('登录状态失效，请重新登录');

      const { error } = await supabase
        .from('course_enrollments')
        .upsert({
          course_id: courseId,
          user_id: userId,
          source: 'manual',
          status: 'active',
          granted_by: user.id,
          granted_at: new Date().toISOString(),
          revoked_by: null,
          revoked_at: null,
        } as never, { onConflict: 'course_id,user_id' });
      if (error) throw error;
      message.success('课程已开通');
      setSelectedUserId(undefined);
      await loadAccess();
      onAccessChange?.();
    } catch (error) {
      message.error(error instanceof Error ? error.message : '开通失败');
    } finally {
      setGrantingUserId(null);
    }
  };

  const handleRevoke = (record: CourseAccessUser) => {
    modal.confirm({
      title: '撤销课程开通',
      content: `确定撤销「${record.displayName || record.username}」的课程访问权限吗？`,
      okText: '撤销',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        setGrantingUserId(record.id);
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) throw new Error('登录状态失效，请重新登录');

          const { error } = await supabase
            .from('course_enrollments')
            .update({
              status: 'revoked',
              revoked_by: user.id,
              revoked_at: new Date().toISOString(),
            } as never)
            .eq('course_id', courseId)
            .eq('user_id', record.id);
          if (error) throw error;
          message.success('已撤销课程开通');
          await loadAccess();
          onAccessChange?.();
        } catch (error) {
          message.error(error instanceof Error ? error.message : '撤销失败');
        } finally {
          setGrantingUserId(null);
        }
      },
    });
  };

  const columns: ColumnsType<CourseAccessUser> = [
    {
      title: '用户',
      key: 'user',
      render: (_, record) => {
        const displayName = record.displayName || record.username || record.email || record.id;
        const initial = displayName.slice(0, 1).toUpperCase();

        return (
          <Space>
            <Avatar src={record.avatarUrl || undefined} size="small">
              {initial}
            </Avatar>
            <div>
              <Text strong style={{ fontSize: 13 }}>
                {displayName}
              </Text>
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
      title: '状态',
      key: 'status',
      width: 90,
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
      width: 150,
      render: (_, record) => formatDateTime(record.enrollment?.grantedAt),
    },
    {
      title: '操作',
      key: 'actions',
      width: 80,
      render: (_, record) => {
        const isActive = record.enrollment?.status === 'active';
        const button = (
          <Button
            size="small"
            type={isActive ? 'default' : 'link'}
            icon={isActive ? <StopOutlined /> : <UserAddOutlined />}
            danger={isActive}
            disabled={!record.hasProfile || grantingUserId === record.id}
            onClick={() => {
              if (isActive) {
                handleRevoke(record);
              } else {
                handleGrant(record.id);
              }
            }}
          >
            {isActive ? '撤销' : '开通'}
          </Button>
        );

        if (record.hasProfile) return button;
        return (
          <Tooltip title="该用户还没有 user_profiles 资料，请让用户先登录一次">
            {button}
          </Tooltip>
        );
      },
    },
  ];

  return (
    <Modal
      title={
        <Space>
          <span>开通课程</span>
          <Tag color="green">{activeCount} 人已开通</Tag>
        </Space>
      }
      open={open}
      onCancel={onCancel}
      footer={null}
      width={720}
      destroyOnClose
      styles={{ body: { paddingTop: 12 } }}
    >
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <Space.Compact style={{ width: '100%' }}>
          <Select
            showSearch
            allowClear
            value={selectedUserId}
            placeholder="搜索用户昵称、邮箱、手机号"
            optionFilterProp="label"
            disabled={loading}
            onChange={setSelectedUserId}
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
            notFoundContent={loading ? '加载中' : '暂无可开通用户'}
          />
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            disabled={Boolean(selectedUserId && grantingUserId === selectedUserId)}
            onClick={() => handleGrant()}
          >
            {selectedUserId && grantingUserId === selectedUserId ? '开通中' : '开通'}
          </Button>
          <Button icon={<ReloadOutlined />} onClick={loadAccess} disabled={loading} />
        </Space.Compact>

        {loading && accessUsers.length === 0 ? (
          <div className="space-y-2 rounded-lg border border-slate-100 p-3">
            {[0, 1, 2, 3].map((item) => (
              <Skeleton key={item} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <Table
            rowKey="id"
            size="small"
            loading={false}
            columns={columns}
            dataSource={accessUsers}
            pagination={{ pageSize: 6, showSizeChanger: false, size: 'small' }}
            locale={{ emptyText: '暂无用户数据' }}
            scroll={{ y: 280 }}
          />
        )}
      </Space>
    </Modal>
  );
}

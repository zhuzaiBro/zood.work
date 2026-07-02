'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  App,
  Avatar,
  Button,
  Modal,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ReloadOutlined, StopOutlined, UserAddOutlined } from '@ant-design/icons';

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
  const [accessUsers, setAccessUsers] = useState<CourseAccessUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>();
  const [grantingUserId, setGrantingUserId] = useState<string | null>(null);

  const loadAccess = useCallback(async () => {
    if (!courseId) return;
    setLoading(true);
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
      setLoading(false);
    }
  }, [courseId, message]);

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
            disabled={!record.hasProfile}
            loading={grantingUserId === record.id}
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
            loading={loading}
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
            notFoundContent={loading ? <Spin size="small" /> : '暂无可开通用户'}
          />
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            loading={Boolean(selectedUserId && grantingUserId === selectedUserId)}
            onClick={() => handleGrant()}
          >
            开通
          </Button>
          <Button icon={<ReloadOutlined />} onClick={loadAccess} loading={loading} />
        </Space.Compact>

        <Table
          rowKey="id"
          size="small"
          loading={loading}
          columns={columns}
          dataSource={accessUsers}
          pagination={{ pageSize: 6, showSizeChanger: false, size: 'small' }}
          locale={{ emptyText: '暂无用户数据' }}
          scroll={{ y: 280 }}
        />
      </Space>
    </Modal>
  );
}

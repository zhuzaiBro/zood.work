'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminListSkeleton } from '@/components/ui/PageSkeleton';
import { createClient } from '@/lib/supabase/client';
import {
  loadAdminUserStudyData,
  type AdminUsersResponse,
  type AdminUserStudyRow,
} from '@/lib/admin/userStudyClient';
import {
  App,
  Avatar,
  Button,
  Card,
  Empty,
  Input,
  Popconfirm,
  Result,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  ClockCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
  TeamOutlined,
  UserOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

function formatDuration(seconds: number) {
  if (!seconds) return '0 分钟';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours <= 0) {
    return `${Math.max(1, minutes)} 分钟`;
  }

  if (minutes <= 0) {
    return `${hours} 小时`;
  }

  return `${hours} 小时 ${minutes} 分钟`;
}

function formatDateTime(value: string | null) {
  if (!value) return '-';

  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export default function AdminUsersPage() {
  const router = useRouter();
  const supabase = createClient();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [repairingProfiles, setRepairingProfiles] = useState(false);
  const [hasPermission, setHasPermission] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [data, setData] = useState<AdminUsersResponse | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login?redirect=/admin/users');
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('is_admin')
        .eq('id', user.id)
        .maybeSingle();
      const adminProfile = profile as { is_admin?: boolean | null } | null;
      if (profileError || !adminProfile?.is_admin) {
        setHasPermission(false);
        return;
      }

      const result = await loadAdminUserStudyData(supabase);
      setHasPermission(true);
      setData(result);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '加载用户学习统计失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const repairMissingProfiles = async () => {
    setRepairingProfiles(true);

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '补齐用户资料失败');
      }

      message.success(result.message || '用户资料补齐完成');
      await loadUsers();
    } catch (error) {
      message.error(error instanceof Error ? error.message : '补齐用户资料失败');
    } finally {
      setRepairingProfiles(false);
    }
  };

  const filteredUsers = useMemo(() => {
    const value = keyword.trim().toLowerCase();
    if (!value) return data?.users ?? [];

    return (data?.users ?? []).filter((item) => {
      return [
        item.id,
        item.username,
        item.email ?? '',
        item.phone ?? '',
        item.displayName ?? '',
      ].some((field) => field.toLowerCase().includes(value));
    });
  }, [data?.users, keyword]);

  const updateMembership = async (userId: string, vipLevel: number) => {
    setUpdatingUserId(userId);

    try {
      const response = await fetch('/api/admin/users/membership', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, vipLevel }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '更新会员状态失败');
      }

      message.success(result.message || '会员状态已更新');
      await loadUsers();
    } catch (error) {
      message.error(error instanceof Error ? error.message : '更新会员状态失败');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const columns: ColumnsType<AdminUserStudyRow> = [
    {
      title: '用户',
      dataIndex: 'username',
      key: 'username',
      render: (_, record) => (
        <Space>
          <Avatar src={record.avatarUrl} icon={<UserOutlined />} />
          <div>
            <Space size={6}>
              <Text strong>{record.displayName || record.username}</Text>
              {record.isAdmin ? <Tag color="blue">管理员</Tag> : null}
              {record.isAnonymous ? <Tag>匿名</Tag> : null}
              {!record.hasProfile ? <Tag color="volcano">缺少资料</Tag> : null}
            </Space>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {record.email || record.phone || record.username}
              </Text>
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: '账号资料',
      key: 'auth',
      width: 210,
      render: (_, record) => {
        return (
          <Space direction="vertical" size={2}>
            <Space size={4} wrap>
              <Tag color="cyan">Supabase DB</Tag>
              {record.isAdmin ? <Tag color="blue">管理员</Tag> : null}
            </Space>
            <Text type="secondary" style={{ fontSize: 12 }}>
              资料创建 {formatDateTime(record.createdAt)}
            </Text>
          </Space>
        );
      },
    },
    {
      title: '会员',
      dataIndex: 'vipLevel',
      key: 'vipLevel',
      width: 120,
      render: (vipLevel: number | null) =>
        (vipLevel ?? 0) > 0 ? (
          <Tag color="gold">VIP {vipLevel}</Tag>
        ) : (
          <Tag>普通用户</Tag>
        ),
    },
    {
      title: `今天学习${data?.ranges.today.label ? ` (${data.ranges.today.label})` : ''}`,
      dataIndex: 'todayStudySeconds',
      key: 'todayStudySeconds',
      sorter: (a, b) => a.todayStudySeconds - b.todayStudySeconds,
      render: (seconds: number) => <Text strong>{formatDuration(seconds)}</Text>,
    },
    {
      title: `昨天学习${data?.ranges.yesterday.label ? ` (${data.ranges.yesterday.label})` : ''}`,
      dataIndex: 'yesterdayStudySeconds',
      key: 'yesterdayStudySeconds',
      sorter: (a, b) => a.yesterdayStudySeconds - b.yesterdayStudySeconds,
      render: (seconds: number) => formatDuration(seconds),
    },
    {
      title: '两日合计',
      dataIndex: 'totalStudySeconds',
      key: 'totalStudySeconds',
      sorter: (a, b) => a.totalStudySeconds - b.totalStudySeconds,
      render: (seconds: number) => (
        seconds > 0 ? <Tag color="geekblue">{formatDuration(seconds)}</Tag> : '-'
      ),
    },
    {
      title: '访问视频',
      dataIndex: 'uniqueVideoCount',
      key: 'uniqueVideoCount',
      width: 110,
      sorter: (a, b) => a.uniqueVideoCount - b.uniqueVideoCount,
      render: (count: number) => `${count} 个`,
    },
    {
      title: '最近学习',
      dataIndex: 'recentStudyAt',
      key: 'recentStudyAt',
      width: 140,
      render: (value: string | null) => formatDateTime(value),
    },
    {
      title: '会员操作',
      key: 'membershipAction',
      width: 180,
      fixed: 'right',
      render: (_, record) => {
        if (!record.hasProfile) {
          return <Text type="secondary">先补齐资料</Text>;
        }

        const vip = record.vipLevel ?? 0;

        if (vip > 0) {
          return (
            <Space direction="vertical" size={4}>
              <Select
                size="small"
                value={vip}
                disabled={updatingUserId === record.id}
                onChange={(value) => updateMembership(record.id, value)}
                options={[1, 2, 3, 4, 5].map((level) => ({
                  value: level,
                  label: `VIP ${level}`,
                }))}
                style={{ width: 96 }}
              />
              <Popconfirm
                title="确认取消该用户会员？"
                onConfirm={() => updateMembership(record.id, 0)}
              >
                <Button size="small" danger disabled={updatingUserId === record.id}>
                  {updatingUserId === record.id ? '处理中' : '取消会员'}
                </Button>
              </Popconfirm>
            </Space>
          );
        }

        return (
          <Popconfirm
            title="确认为该用户开通永久会员？"
            onConfirm={() => updateMembership(record.id, 1)}
          >
            <Button type="primary" size="small" disabled={updatingUserId === record.id}>
              {updatingUserId === record.id ? '开通中' : '开通会员'}
            </Button>
          </Popconfirm>
        );
      },
    },
  ];

  if (loading && !data) {
    return <AdminListSkeleton />;
  }

  if (!hasPermission) {
    return (
      <Result
        status="403"
        title="无权访问"
        subTitle="此页面仅限管理员查看。"
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
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <Title level={3} style={{ marginBottom: 4 }}>
            用户管理
          </Title>
          <Text type="secondary">
            优先读取 Supabase 业务数据库，并合并最近两天的视频访问日志统计学习时长。
          </Text>
        </div>
        <Space>
          <Button
            onClick={repairMissingProfiles}
            disabled={repairingProfiles}
          >
            {repairingProfiles ? '同步中' : '同步 Auth 用户'}
          </Button>
          <Button icon={<ReloadOutlined />} onClick={loadUsers} disabled={loading}>
            {loading ? '刷新中' : '刷新'}
          </Button>
        </Space>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 16,
        }}
      >
        <Card>
          <Statistic
            title="数据库用户"
            value={data?.summary.userCount ?? 0}
            prefix={<TeamOutlined />}
          />
        </Card>
        <Card>
          <Statistic
            title="缺失资料"
            value={data?.summary.missingProfileCount ?? 0}
            suffix="人"
            prefix={<UserOutlined />}
          />
        </Card>
        <Card>
          <Statistic
            title="今日活跃学习"
            value={data?.summary.activeTodayCount ?? 0}
            suffix="人"
            prefix={<VideoCameraOutlined />}
          />
        </Card>
        <Card>
          <Statistic
            title="今日学习总时长"
            value={formatDuration(data?.summary.todayStudySeconds ?? 0)}
            prefix={<ClockCircleOutlined />}
          />
        </Card>
        <Card>
          <Statistic
            title="昨日学习总时长"
            value={formatDuration(data?.summary.yesterdayStudySeconds ?? 0)}
            prefix={<ClockCircleOutlined />}
          />
        </Card>
      </div>

      <Card
        title="学习用户"
        extra={
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="搜索昵称 / 用户名 / ID"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            style={{ width: 280 }}
          />
        }
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredUsers}
          loading={false}
          scroll={{ x: 1400 }}
          locale={{ emptyText: <Empty description="暂无用户学习数据" /> }}
          pagination={{
            pageSize: 12,
            showTotal: (total) => `共 ${total} 位用户`,
          }}
        />
      </Card>
    </Space>
  );
}

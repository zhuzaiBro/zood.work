'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  App,
  Avatar,
  Button,
  Card,
  Empty,
  Input,
  Result,
  Space,
  Spin,
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

interface AdminUserStudyRow {
  id: string;
  email: string | null;
  phone: string | null;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  provider: string | null;
  providers: string[];
  role: string | null;
  emailConfirmedAt: string | null;
  phoneConfirmedAt: string | null;
  lastSignInAt: string | null;
  isSsoUser: boolean;
  isAnonymous: boolean;
  hasProfile: boolean;
  vipLevel: number | null;
  isAdmin: boolean;
  createdAt: string | null;
  todayStudySeconds: number;
  yesterdayStudySeconds: number;
  totalStudySeconds: number;
  uniqueVideoCount: number;
  recentStudyAt: string | null;
}

interface AdminUsersResponse {
  users: AdminUserStudyRow[];
  summary: {
    userCount: number;
    missingProfileCount: number;
    activeTodayCount: number;
    activeYesterdayCount: number;
    todayStudySeconds: number;
    yesterdayStudySeconds: number;
  };
  ranges: {
    today: { label: string; start: string; end: string };
    yesterday: { label: string; start: string; end: string };
  };
}

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
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [repairingProfiles, setRepairingProfiles] = useState(false);
  const [hasPermission, setHasPermission] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [data, setData] = useState<AdminUsersResponse | null>(null);

  const loadUsers = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/admin/users', {
        cache: 'no-store',
      });

      if (response.status === 401) {
        router.push('/login?redirect=/admin/users');
        return;
      }

      if (response.status === 403) {
        setHasPermission(false);
        return;
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '加载用户学习统计失败');
      }

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
      title: 'Auth 信息',
      key: 'auth',
      width: 210,
      render: (_, record) => {
        const providers = (record.providers.length > 0
          ? record.providers
          : [record.provider]
        ).filter((provider): provider is string => Boolean(provider));

        return (
          <Space direction="vertical" size={2}>
            <Space size={4} wrap>
              {providers.map((provider) => (
                <Tag key={provider} color="cyan">
                  {provider}
                </Tag>
              ))}
              {record.emailConfirmedAt || record.phoneConfirmedAt ? (
                <Tag color="green">已验证</Tag>
              ) : (
                <Tag color="orange">未验证</Tag>
              )}
            </Space>
            <Text type="secondary" style={{ fontSize: 12 }}>
              最后登录 {formatDateTime(record.lastSignInAt)}
            </Text>
          </Space>
        );
      },
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
  ];

  if (loading && !data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 120 }}>
        <Spin size="large" tip="加载用户学习统计..." />
      </div>
    );
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
            用户来源于 Supabase Authentication，并合并 profile 与视频访问日志统计学习时长。
          </Text>
        </div>
        <Space>
          <Button
            onClick={repairMissingProfiles}
            loading={repairingProfiles}
            disabled={(data?.summary.missingProfileCount ?? 0) === 0}
          >
            补齐缺失资料
          </Button>
          <Button icon={<ReloadOutlined />} onClick={loadUsers} loading={loading}>
            刷新
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
            title="Auth 总用户"
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
            placeholder="搜索昵称 / 邮箱 / 手机 / ID"
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
          loading={loading}
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

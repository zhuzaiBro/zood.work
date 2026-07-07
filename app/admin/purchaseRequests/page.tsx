'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminListSkeleton } from '@/components/ui/PageSkeleton';
import {
  App,
  Button,
  Card,
  Empty,
  Input,
  Popconfirm,
  Result,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';

interface PurchaseRequest {
  id: number;
  course_id: string;
  course_title: string | null;
  course_price: number | null;
  user_id: string | null;
  phone: string;
  wechat: string;
  note: string | null;
  status: string;
  admin_note: string | null;
  contacted_at: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

interface MembershipConsultationRequest {
  id: number;
  user_id: string | null;
  phone: string;
  wechat: string;
  note: string | null;
  source: string | null;
  plan_price: number | null;
  status: string;
  admin_note: string | null;
  contacted_at: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

const { Title, Text } = Typography;

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: '待联系', color: 'orange' },
  contacted: { label: '已联系', color: 'blue' },
  paid: { label: '已支付', color: 'green' },
  closed: { label: '已关闭', color: 'default' },
};

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

export default function PurchaseRequestsPage() {
  const router = useRouter();
  const { message } = App.useApp();
  const [activeTab, setActiveTab] = useState('course');
  const [loading, setLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [membershipRequests, setMembershipRequests] = useState<MembershipConsultationRequest[]>([]);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [grantingConsultationId, setGrantingConsultationId] = useState<number | null>(null);

  const loadCourseRequests = async () => {
    const response = await fetch('/api/admin/course-purchase-requests', {
      cache: 'no-store',
    });

    if (response.status === 401) {
      router.push('/login?redirect=/admin/purchaseRequests');
      return false;
    }

    if (response.status === 403) {
      setHasPermission(false);
      return false;
    }

    const body = await response.json();
    if (!response.ok) {
      throw new Error(body.error || '加载课程购买咨询失败');
    }

    setRequests(body.requests ?? []);
    return true;
  };

  const loadMembershipRequests = async () => {
    const response = await fetch('/api/admin/membership-consultation-requests', {
      cache: 'no-store',
    });

    if (response.status === 401) {
      router.push('/login?redirect=/admin/purchaseRequests');
      return false;
    }

    if (response.status === 403) {
      setHasPermission(false);
      return false;
    }

    const body = await response.json();
    if (!response.ok) {
      throw new Error(body.error || '加载会员咨询失败');
    }

    setMembershipRequests(body.requests ?? []);
    return true;
  };

  const loadRequests = async () => {
    setLoading(true);

    try {
      const [courseOk, membershipOk] = await Promise.all([
        loadCourseRequests(),
        loadMembershipRequests(),
      ]);

      if (courseOk && membershipOk) {
        setHasPermission(true);
      }
    } catch (error) {
      message.error(error instanceof Error ? error.message : '加载咨询记录失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredCourseRequests = useMemo(() => {
    const value = keyword.trim().toLowerCase();
    if (!value) return requests;

    return requests.filter((item) => {
      return [
        item.course_title ?? '',
        item.phone,
        item.wechat,
        item.note ?? '',
        item.user_id ?? '',
      ].some((field) => field.toLowerCase().includes(value));
    });
  }, [keyword, requests]);

  const filteredMembershipRequests = useMemo(() => {
    const value = keyword.trim().toLowerCase();
    if (!value) return membershipRequests;

    return membershipRequests.filter((item) => {
      return [
        item.phone,
        item.wechat,
        item.note ?? '',
        item.source ?? '',
        item.user_id ?? '',
      ].some((field) => field.toLowerCase().includes(value));
    });
  }, [keyword, membershipRequests]);

  const updateCourseStatus = async (record: PurchaseRequest, status: string) => {
    setUpdatingId(record.id);

    try {
      const response = await fetch('/api/admin/course-purchase-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: record.id,
          status,
          adminNote: record.admin_note,
        }),
      });
      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(body.error || '更新状态失败');
      }

      message.success('状态已更新');
      await loadCourseRequests();
    } catch (error) {
      message.error(error instanceof Error ? error.message : '更新状态失败');
    } finally {
      setUpdatingId(null);
    }
  };

  const updateMembershipStatus = async (
    record: MembershipConsultationRequest,
    status: string,
  ) => {
    setUpdatingId(record.id);

    try {
      const response = await fetch('/api/admin/membership-consultation-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: record.id,
          status,
          adminNote: record.admin_note,
        }),
      });
      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(body.error || '更新状态失败');
      }

      message.success('状态已更新');
      await loadMembershipRequests();
    } catch (error) {
      message.error(error instanceof Error ? error.message : '更新状态失败');
    } finally {
      setUpdatingId(null);
    }
  };

  const grantMembershipFromConsultation = async (record: MembershipConsultationRequest) => {
    if (!record.user_id) {
      message.warning('该咨询未关联登录用户，请先在用户管理中按手机号搜索后手动开通');
      return;
    }

    setGrantingConsultationId(record.id);

    try {
      const response = await fetch('/api/admin/users/membership', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: record.user_id,
          vipLevel: 1,
          consultationRequestId: record.id,
        }),
      });
      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(body.error || '开通会员失败');
      }

      message.success(body.message || '会员已开通');
      await loadMembershipRequests();
    } catch (error) {
      message.error(error instanceof Error ? error.message : '开通会员失败');
    } finally {
      setGrantingConsultationId(null);
    }
  };

  const courseColumns: ColumnsType<PurchaseRequest> = [
    {
      title: '课程',
      dataIndex: 'course_title',
      key: 'course_title',
      render: (_, record) => (
        <div>
          <Text strong>{record.course_title || record.course_id}</Text>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              ¥{Number(record.course_price ?? 0).toFixed(2)}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: '联系方式',
      key: 'contact',
      width: 220,
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Text>手机：{record.phone}</Text>
          <Text>微信：{record.wechat}</Text>
        </Space>
      ),
    },
    {
      title: '备注',
      dataIndex: 'note',
      key: 'note',
      ellipsis: true,
      render: (value: string | null) => value || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (status: string, record) => {
        const config = statusConfig[status] ?? statusConfig.pending;

        return (
          <Space direction="vertical" size={4}>
            <Tag color={config.color}>{config.label}</Tag>
            <Select
              size="small"
              value={status}
              disabled={updatingId === record.id}
              onChange={(value) => updateCourseStatus(record, value)}
              options={[
                { value: 'pending', label: '待联系' },
                { value: 'contacted', label: '已联系' },
                { value: 'paid', label: '已支付' },
                { value: 'closed', label: '已关闭' },
              ]}
              style={{ width: 96 }}
            />
          </Space>
        );
      },
    },
    {
      title: '提交时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 140,
      render: (value: string) => formatDateTime(value),
    },
  ];

  const membershipColumns: ColumnsType<MembershipConsultationRequest> = [
    {
      title: '会员方案',
      key: 'plan',
      render: (_, record) => (
        <div>
          <Text strong>永久会员</Text>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              ¥{Number(record.plan_price ?? 129).toFixed(2)}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: '联系方式',
      key: 'contact',
      width: 220,
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Text>手机：{record.phone}</Text>
          <Text>微信：{record.wechat}</Text>
        </Space>
      ),
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      width: 140,
      render: (value: string | null) => value || '-',
    },
    {
      title: '关联用户',
      dataIndex: 'user_id',
      key: 'user_id',
      width: 120,
      ellipsis: true,
      render: (value: string | null) =>
        value ? (
          <Text copyable={{ text: value }} style={{ fontSize: 12 }}>
            {value.slice(0, 8)}…
          </Text>
        ) : (
          <Text type="secondary">未登录提交</Text>
        ),
    },
    {
      title: '备注',
      dataIndex: 'note',
      key: 'note',
      ellipsis: true,
      render: (value: string | null) => value || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (status: string, record) => {
        const config = statusConfig[status] ?? statusConfig.pending;

        return (
          <Space direction="vertical" size={4}>
            <Tag color={config.color}>{config.label}</Tag>
            <Select
              size="small"
              value={status}
              disabled={updatingId === record.id}
              onChange={(value) => updateMembershipStatus(record, value)}
              options={[
                { value: 'pending', label: '待联系' },
                { value: 'contacted', label: '已联系' },
                { value: 'paid', label: '已支付' },
                { value: 'closed', label: '已关闭' },
              ]}
              style={{ width: 96 }}
            />
          </Space>
        );
      },
    },
    {
      title: '提交时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 140,
      render: (value: string) => formatDateTime(value),
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => {
        if (record.status === 'paid') {
          return <Tag color="green">已开通</Tag>;
        }

        return (
          <Popconfirm
            title="确认开通该用户永久会员？"
            description={record.user_id ? undefined : '该记录未关联用户，无法自动开通'}
            disabled={!record.user_id}
            onConfirm={() => grantMembershipFromConsultation(record)}
          >
            <Button
              type="primary"
              size="small"
              disabled={!record.user_id || grantingConsultationId === record.id}
            >
              {grantingConsultationId === record.id ? '开通中' : '开通会员'}
            </Button>
          </Popconfirm>
        );
      },
    },
  ];

  if (loading && requests.length === 0 && membershipRequests.length === 0) {
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
            咨询管理
          </Title>
          <Text type="secondary">查看用户提交的课程购买与会员开通咨询，主动联系后可更新处理状态。</Text>
        </div>
        <Button icon={<ReloadOutlined />} onClick={loadRequests} disabled={loading}>
          {loading ? '刷新中' : '刷新'}
        </Button>
      </div>

      <Card
        extra={
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="搜索手机 / 微信 / 备注"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            style={{ width: 280 }}
          />
        }
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'course',
              label: `课程购买 (${filteredCourseRequests.length})`,
              children: (
                <Table
                  rowKey="id"
                  columns={courseColumns}
                  dataSource={filteredCourseRequests}
                  loading={false}
                  locale={{ emptyText: <Empty description="暂无课程购买咨询" /> }}
                  pagination={{
                    pageSize: 12,
                    showTotal: (total) => `共 ${total} 条课程购买咨询`,
                  }}
                />
              ),
            },
            {
              key: 'membership',
              label: `会员开通 (${filteredMembershipRequests.length})`,
              children: (
                <Table
                  rowKey="id"
                  columns={membershipColumns}
                  dataSource={filteredMembershipRequests}
                  loading={false}
                  scroll={{ x: 1200 }}
                  locale={{ emptyText: <Empty description="暂无会员开通咨询" /> }}
                  pagination={{
                    pageSize: 12,
                    showTotal: (total) => `共 ${total} 条会员开通咨询`,
                  }}
                />
              ),
            },
          ]}
        />
      </Card>
    </Space>
  );
}

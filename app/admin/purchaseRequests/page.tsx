'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  App,
  Button,
  Card,
  Empty,
  Input,
  Result,
  Select,
  Space,
  Spin,
  Table,
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
  const [loading, setLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const loadRequests = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/admin/course-purchase-requests', {
        cache: 'no-store',
      });

      if (response.status === 401) {
        router.push('/login?redirect=/admin/purchaseRequests');
        return;
      }

      if (response.status === 403) {
        setHasPermission(false);
        return;
      }

      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error || '加载购买咨询失败');
      }

      setHasPermission(true);
      setRequests(body.requests ?? []);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '加载购买咨询失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredRequests = useMemo(() => {
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

  const updateStatus = async (record: PurchaseRequest, status: string) => {
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
      await loadRequests();
    } catch (error) {
      message.error(error instanceof Error ? error.message : '更新状态失败');
    } finally {
      setUpdatingId(null);
    }
  };

  const columns: ColumnsType<PurchaseRequest> = [
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
              onChange={(value) => updateStatus(record, value)}
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

  if (loading && requests.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 120 }}>
        <Spin size="large" tip="加载购买咨询..." />
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
            购买咨询
          </Title>
          <Text type="secondary">查看用户提交的付费课程购买意向，主动联系后可更新处理状态。</Text>
        </div>
        <Button icon={<ReloadOutlined />} onClick={loadRequests} loading={loading}>
          刷新
        </Button>
      </div>

      <Card
        title="购买意向列表"
        extra={
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="搜索课程 / 手机 / 微信"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            style={{ width: 280 }}
          />
        }
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredRequests}
          loading={loading}
          locale={{ emptyText: <Empty description="暂无购买咨询" /> }}
          pagination={{
            pageSize: 12,
            showTotal: (total) => `共 ${total} 条购买咨询`,
          }}
        />
      </Card>
    </Space>
  );
}

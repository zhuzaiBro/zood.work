'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database.types';
import { UserProfile } from '@/types/user';
import { AdminListSkeleton } from '@/components/ui/PageSkeleton';
import Skeleton from '@/components/ui/Skeleton';
import {
  App,
  Avatar,
  Button,
  Card,
  Descriptions,
  Empty,
  Input,
  Modal,
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
  EyeOutlined,
  FileSearchOutlined,
  PaperClipOutlined,
  ReloadOutlined,
  SearchOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { INTERVIEW_SUBMISSION_ATTACHMENTS_BUCKET } from '@/lib/uploadInterviewSubmissionAttachment';

type Submission = Database['public']['Tables']['interview_question_submissions']['Row'];

interface SubmissionRow extends Submission {
  user_profiles?: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  interview_collections?: {
    id: string;
    title: string;
  } | null;
}

const { Title, Text, Paragraph } = Typography;

function formatDateTime(value: string | null) {
  if (!value) return '-';

  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatFileSize(bytes: number | null) {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getStatusMeta(status: string) {
  switch (status) {
    case 'accepted':
      return { color: 'green', label: '已采纳' };
    case 'rejected':
      return { color: 'red', label: '未采纳' };
    default:
      return { color: 'gold', label: '待审核' };
  }
}

export default function AdminSubmissionsPage() {
  const router = useRouter();
  const supabase = createClient();
  const { message } = App.useApp();

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionRow | null>(null);
  const [openingAttachmentId, setOpeningAttachmentId] = useState<string | null>(null);

  const checkAuth = async () => {
    setIsCheckingAuth(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login?redirect=/admin/submissions');
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single<UserProfile>();

    if (profileError || !profile?.is_admin) {
      setHasPermission(false);
      setIsCheckingAuth(false);
      return;
    }

    setHasPermission(true);
    setIsCheckingAuth(false);
    await loadSubmissions();
  };

  const loadSubmissions = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('interview_question_submissions')
      .select(`
        *,
        user_profiles (
          id,
          username,
          display_name,
          avatar_url
        ),
        interview_collections (
          id,
          title
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      message.error(error.message || '加载投稿列表失败');
      setLoading(false);
      return;
    }

    setSubmissions((data ?? []) as SubmissionRow[]);
    setLoading(false);
  };

  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredSubmissions = useMemo(() => {
    const search = keyword.trim().toLowerCase();

    return submissions.filter((item) => {
      const matchesStatus = statusFilter === 'all' ? true : item.status === statusFilter;

      if (!matchesStatus) return false;

      if (!search) return true;

      return [
        item.title,
        item.content,
        item.source ?? '',
        item.contact ?? '',
        item.user_profiles?.username ?? '',
        item.user_profiles?.display_name ?? '',
        ...(item.tags ?? []),
      ].some((field) => field.toLowerCase().includes(search));
    });
  }, [keyword, statusFilter, submissions]);

  const summary = useMemo(() => {
    return {
      total: submissions.length,
      pending: submissions.filter((item) => item.status === 'pending').length,
      accepted: submissions.filter((item) => item.status === 'accepted').length,
      rejected: submissions.filter((item) => item.status === 'rejected').length,
      withAttachment: submissions.filter((item) => Boolean(item.attachment_path)).length,
    };
  }, [submissions]);

  const openAttachment = async (record: SubmissionRow) => {
    if (!record.attachment_path) return;

    setOpeningAttachmentId(record.id);

    try {
      const { data, error } = await supabase.storage
        .from(INTERVIEW_SUBMISSION_ATTACHMENTS_BUCKET)
        .createSignedUrl(record.attachment_path, 60 * 10);

      if (error || !data?.signedUrl) {
        throw new Error(error?.message || '生成附件访问链接失败');
      }

      window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      message.error(error instanceof Error ? error.message : '打开附件失败');
    } finally {
      setOpeningAttachmentId(null);
    }
  };

  const columns: ColumnsType<SubmissionRow> = [
    {
      title: '投稿人',
      dataIndex: 'user_profiles',
      key: 'user',
      width: 220,
      render: (_, record) => (
        <Space>
          <Avatar src={record.user_profiles?.avatar_url ?? undefined} icon={<UserOutlined />} />
          <div>
            <Text strong>{record.user_profiles?.display_name || record.user_profiles?.username || '未知用户'}</Text>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {record.contact || record.user_profiles?.username || record.user_id}
              </Text>
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: '投稿内容',
      dataIndex: 'title',
      key: 'title',
      render: (_, record) => (
        <div>
          <Space size={8} wrap>
            <Text strong>{record.title}</Text>
            {record.difficulty ? <Tag>{record.difficulty}</Tag> : null}
          </Space>
          <Paragraph
            type="secondary"
            ellipsis={{ rows: 2, tooltip: record.content }}
            style={{ marginBottom: 0, marginTop: 6, maxWidth: 460 }}
          >
            {record.content}
          </Paragraph>
        </div>
      ),
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 220,
      render: (tags: string[]) => (
        <Space size={[4, 6]} wrap>
          {(tags ?? []).length > 0 ? (
            tags.map((tag) => <Tag key={tag}>{tag}</Tag>)
          ) : (
            <Text type="secondary">-</Text>
          )}
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      filters: [
        { text: '待审核', value: 'pending' },
        { text: '已采纳', value: 'accepted' },
        { text: '未采纳', value: 'rejected' },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status: string) => {
        const meta = getStatusMeta(status);
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: '附件 / 来源',
      key: 'attachment',
      width: 220,
      render: (_, record) => (
        <Space direction="vertical" size={4}>
          {record.attachment_name ? (
            <Button
              type="link"
              size="small"
              icon={<PaperClipOutlined />}
              style={{ paddingInline: 0 }}
              disabled={openingAttachmentId === record.id}
              onClick={() => openAttachment(record)}
            >
              {openingAttachmentId === record.id ? '打开中' : record.attachment_name}
            </Button>
          ) : (
            <Text type="secondary">无附件</Text>
          )}
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.source || record.interview_collections?.title || '未归类'}
          </Text>
        </Space>
      ),
    },
    {
      title: '提交时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      sorter: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      defaultSortOrder: 'descend',
      render: (value: string) => formatDateTime(value),
    },
    {
      title: '操作',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Button icon={<EyeOutlined />} onClick={() => setSelectedSubmission(record)}>
          查看
        </Button>
      ),
    },
  ];

  if (isCheckingAuth) {
    return <AdminListSkeleton />;
  }

  if (!hasPermission) {
    return (
      <Result
        status="403"
        title="无权限访问"
        subTitle="只有管理员可以查看用户投稿。"
      />
    );
  }

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <div>
        <Title level={3} style={{ marginBottom: 4 }}>
          用户投稿
        </Title>
        <Text type="secondary">查看普通用户提交的面试题投稿、标签和附件。</Text>
      </div>

      <Space size={16} wrap>
        <Card size="small">
          <Statistic title="总投稿数" value={summary.total} prefix={<FileSearchOutlined />} />
        </Card>
        <Card size="small">
          <Statistic title="待审核" value={summary.pending} />
        </Card>
        <Card size="small">
          <Statistic title="已采纳" value={summary.accepted} />
        </Card>
        <Card size="small">
          <Statistic title="带附件" value={summary.withAttachment} />
        </Card>
      </Space>

      <Card>
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
            <Space wrap>
              <Input
                allowClear
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="搜索标题、内容、标签、来源、联系人"
                prefix={<SearchOutlined />}
                style={{ width: 320 }}
              />
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ width: 160 }}
                options={[
                  { value: 'all', label: '全部状态' },
                  { value: 'pending', label: '待审核' },
                  { value: 'accepted', label: '已采纳' },
                  { value: 'rejected', label: '未采纳' },
                ]}
              />
            </Space>
            <Button icon={<ReloadOutlined />} onClick={loadSubmissions} disabled={loading}>
              {loading ? '刷新中' : '刷新'}
            </Button>
          </Space>

          {loading && submissions.length === 0 ? (
            <div className="space-y-3">
              {[0, 1, 2, 3, 4].map((item) => (
                <Skeleton key={item} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <Table
              rowKey="id"
              loading={false}
              columns={columns}
              dataSource={filteredSubmissions}
              locale={{
                emptyText: <Empty description="还没有用户投稿" />,
              }}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 条投稿`,
              }}
              scroll={{ x: 1320 }}
            />
          )}
        </Space>
      </Card>

      <Modal
        open={Boolean(selectedSubmission)}
        title="投稿详情"
        footer={[
          <Button key="close" onClick={() => setSelectedSubmission(null)}>
            关闭
          </Button>,
          selectedSubmission?.attachment_path ? (
            <Button
              key="attachment"
              type="primary"
              icon={<PaperClipOutlined />}
              disabled={openingAttachmentId === selectedSubmission.id}
              onClick={() => openAttachment(selectedSubmission)}
            >
              {openingAttachmentId === selectedSubmission.id ? '打开中' : '打开附件'}
            </Button>
          ) : null,
        ]}
        onCancel={() => setSelectedSubmission(null)}
        width={860}
      >
        {selectedSubmission ? (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="投稿人">
                {selectedSubmission.user_profiles?.display_name || selectedSubmission.user_profiles?.username || selectedSubmission.user_id}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={getStatusMeta(selectedSubmission.status).color}>
                  {getStatusMeta(selectedSubmission.status).label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="题集">
                {selectedSubmission.interview_collections?.title || '未归类'}
              </Descriptions.Item>
              <Descriptions.Item label="来源">
                {selectedSubmission.source || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="联系方式">
                {selectedSubmission.contact || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="提交时间">
                {formatDateTime(selectedSubmission.created_at)}
              </Descriptions.Item>
              <Descriptions.Item label="附件" span={2}>
                {selectedSubmission.attachment_name ? (
                  <Space direction="vertical" size={2}>
                    <Text>{selectedSubmission.attachment_name}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {selectedSubmission.attachment_mime_type || '未知类型'} · {formatFileSize(selectedSubmission.attachment_size_bytes)}
                    </Text>
                  </Space>
                ) : (
                  '-'
                )}
              </Descriptions.Item>
              <Descriptions.Item label="标签" span={2}>
                <Space size={[4, 6]} wrap>
                  {(selectedSubmission.tags ?? []).map((tag) => (
                    <Tag key={tag}>{tag}</Tag>
                  ))}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="管理员备注" span={2}>
                {selectedSubmission.admin_note || '-'}
              </Descriptions.Item>
            </Descriptions>

            <div>
              <Text strong>标题</Text>
              <Paragraph style={{ marginTop: 8, marginBottom: 0 }}>{selectedSubmission.title}</Paragraph>
            </div>

            <div>
              <Text strong>内容</Text>
              <Paragraph
                style={{
                  marginTop: 8,
                  marginBottom: 0,
                  whiteSpace: 'pre-wrap',
                  background: '#fafafa',
                  padding: 16,
                  borderRadius: 12,
                }}
              >
                {selectedSubmission.content}
              </Paragraph>
            </div>
          </Space>
        ) : null}
      </Modal>
    </Space>
  );
}

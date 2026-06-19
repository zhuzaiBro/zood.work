'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database.types';
import { UserProfile } from '@/types/user';
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  Divider,
  Empty,
  Input,
  List,
  Modal,
  Progress,
  Row,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
  Upload,
  Result,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { UploadFile } from 'antd/es/upload';
import {
  CloudUploadOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  ImportOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import QuestionFormModal, { QuestionFormValues } from '@/components/admin/QuestionFormModal';

type Collection = Database['public']['Tables']['interview_collections']['Row'];
type Question = Database['public']['Tables']['interview_question']['Row'];

interface ParsedQuestion {
  title: string;
  content: string;
  is_vip: boolean;
  difficulty: string | null;
  vip_level_required: number | null;
  sort: number | null;
}

const { Title, Text, Paragraph } = Typography;

export default function QuestionsManagePage() {
  const router = useRouter();
  const supabase = createClient();
  const { message, modal } = App.useApp();

  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [filterCollectionId, setFilterCollectionId] = useState<string>('');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [questionModalMode, setQuestionModalMode] = useState<'create' | 'edit'>('create');
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [questionFormInitial, setQuestionFormInitial] = useState<Partial<QuestionFormValues>>({});
  const [isSavingQuestion, setIsSavingQuestion] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const questionsPerPage = 20;

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
      router.push('/login?redirect=/admin/questions');
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
    loadCollections();
    loadQuestions();
  };

  const loadCollections = async () => {
    const { data, error: loadError } = await supabase
      .from('interview_collections')
      .select('*')
      .order('sort', { ascending: true });

    if (loadError) {
      console.error('加载题集失败:', loadError);
      return;
    }

    setCollections(data || []);
  };

  const loadQuestions = async () => {
    setIsLoadingQuestions(true);

    let query = supabase
      .from('interview_question')
      .select('*')
      .order('created_at', { ascending: false });

    if (filterCollectionId) {
      query = query.eq('collection_id', filterCollectionId);
    }

    if (searchKeyword.trim()) {
      query = query.ilike('title', `%${searchKeyword}%`);
    }

    const { data, error: loadError } = await query;

    if (loadError) {
      console.error('加载题目失败:', loadError);
      message.error('加载题目失败');
    } else {
      setQuestions(data || []);
    }

    setIsLoadingQuestions(false);
  };

  const handleDeleteQuestion = async (questionId: string) => {
    const { error: deleteError } = await supabase
      .from('interview_question')
      .delete()
      .eq('id', questionId);

    if (deleteError) {
      message.error('删除失败: ' + deleteError.message);
    } else {
      message.success('题目已删除');
      loadQuestions();
    }
  };

  const confirmDelete = (questionId: string) => {
    modal.confirm({
      title: '确认删除',
      content: '确定要删除这道题目吗？此操作无法撤销。',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => handleDeleteQuestion(questionId),
    });
  };

  const openCreateQuestionModal = () => {
    setQuestionModalMode('create');
    setEditingQuestionId(null);
    setQuestionFormInitial({
      collection_id: filterCollectionId || undefined,
      title: '',
      content: '',
      difficulty: null,
      sort: null,
      is_vip: false,
      vip_level_required: null,
    });
    setQuestionModalOpen(true);
  };

  const handleEditQuestion = (question: Question) => {
    setQuestionModalMode('edit');
    setEditingQuestionId(question.id);
    setQuestionFormInitial({
      collection_id: question.collection_id ?? undefined,
      title: question.title,
      content: question.content ?? '',
      difficulty: question.difficulty,
      sort: question.sort,
      is_vip: question.is_vip ?? false,
      vip_level_required: question.vip_level_required,
    });
    setQuestionModalOpen(true);
  };

  const closeQuestionModal = () => {
    if (isSavingQuestion) return;
    setQuestionModalOpen(false);
    setEditingQuestionId(null);
    setQuestionFormInitial({});
  };

  const normalizeSort = (value: QuestionFormValues['sort']) => {
    if (value === null || value === undefined) return null;
    return value;
  };

  const handleSaveQuestion = async (values: QuestionFormValues) => {
    setIsSavingQuestion(true);

    const payload = {
      collection_id: values.collection_id,
      title: values.title.trim(),
      content: values.content.trim(),
      difficulty: values.difficulty,
      is_vip: values.is_vip,
      vip_level_required: values.is_vip ? values.vip_level_required : null,
      sort: normalizeSort(values.sort),
    };

    if (questionModalMode === 'create') {
      const { error: insertError } = await supabase
        .from('interview_question')
        // @ts-expect-error - Supabase type inference issue with insert method
        .insert(payload);

      if (insertError) {
        message.error('创建失败: ' + insertError.message);
      } else {
        message.success('题目已创建');
        setQuestionModalOpen(false);
        loadQuestions();
      }
    } else if (editingQuestionId) {
      const { error: saveError } = await supabase
        .from('interview_question')
        // @ts-expect-error - Supabase type inference issue with update method
        .update(payload)
        .eq('id', editingQuestionId);

      if (saveError) {
        message.error('保存失败: ' + saveError.message);
      } else {
        message.success('题目已更新');
        setQuestionModalOpen(false);
        loadQuestions();
      }
    }

    setIsSavingQuestion(false);
  };

  useEffect(() => {
    if (hasPermission) {
      loadQuestions();
      setCurrentPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterCollectionId, searchKeyword]);

  const getCollectionName = (collectionId: string | null) => {
    if (!collectionId) return '未分类';
    const collection = collections.find((c) => c.id === collectionId);
    return collection?.title || '未知题集';
  };

  const handleFileChange = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      message.error('请上传 CSV 文件');
      return false;
    }
    setCsvFile(file);
    setParsedData([]);
    setError('');
    setSuccess('');
    return false;
  };

  const parseCSV = (text: string): ParsedQuestion[] => {
    const lines = text.split('\n');
    if (lines.length < 2) {
      throw new Error('CSV 文件为空');
    }

    const header = lines[0].split(',').map((h) => h.trim());
    const requiredHeaders = ['title', 'content', 'is_vip', 'difficulty'];
    const missingHeaders = requiredHeaders.filter((h) => !header.includes(h));

    if (missingHeaders.length > 0) {
      throw new Error(`缺少必需的列: ${missingHeaders.join(', ')}`);
    }

    const parsed: ParsedQuestion[] = [];
    let currentLine = '';
    let inQuotes = false;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      currentLine += (currentLine ? '\n' : '') + line;
      const quoteCount = (currentLine.match(/"/g) || []).length;
      inQuotes = quoteCount % 2 !== 0;

      if (inQuotes) continue;

      if (currentLine.trim()) {
        try {
          const values = parseCSVLine(currentLine);
          const row: Record<string, string> = {};
          header.forEach((key, index) => {
            row[key] = values[index] || '';
          });

          if (row.title && row.content) {
            parsed.push({
              title: row.title.trim(),
              content: row.content.trim(),
              is_vip: row.is_vip === 'true',
              difficulty: row.difficulty?.trim() || null,
              vip_level_required: row.vip_level_required
                ? parseInt(row.vip_level_required)
                : null,
              sort: row.sort ? parseInt(row.sort) : null,
            });
          }
        } catch (err) {
          console.error(`解析第 ${i + 1} 行失败:`, err);
        }
      }

      currentLine = '';
    }

    return parsed;
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current);
    return result;
  };

  const handleParseCSV = async () => {
    if (!csvFile) {
      message.warning('请选择 CSV 文件');
      return;
    }

    if (!selectedCollectionId) {
      message.warning('请选择题集');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const text = await csvFile.text();
      const parsed = parseCSV(text);

      if (parsed.length === 0) {
        throw new Error('未找到有效的题目数据');
      }

      setParsedData(parsed);
      setSuccess(`成功解析 ${parsed.length} 条题目，请检查预览后点击「开始导入」`);
      message.success(`已解析 ${parsed.length} 条题目`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '解析失败';
      setError(`解析失败: ${msg}`);
      setParsedData([]);
      message.error(`解析失败: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (parsedData.length === 0) {
      message.warning('没有可导入的数据');
      return;
    }

    if (!selectedCollectionId) {
      message.warning('请选择题集');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');
    setUploadProgress({ current: 0, total: parsedData.length });

    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < parsedData.length; i++) {
      const question = parsedData[i];
      setUploadProgress({ current: i + 1, total: parsedData.length });

      const { error: insertError } = await supabase
        .from('interview_question')
        // @ts-expect-error - Supabase type inference issue with insert method
        .insert({
          collection_id: selectedCollectionId,
          title: question.title,
          content: question.content,
          is_vip: question.is_vip,
          difficulty: question.difficulty,
          vip_level_required: question.vip_level_required,
          sort: question.sort,
        });

      if (insertError) {
        failCount++;
        errors.push(`第 ${i + 1} 条 "${question.title}": ${insertError.message}`);
      } else {
        successCount++;
      }
    }

    setIsLoading(false);
    setUploadProgress({ current: 0, total: 0 });

    if (failCount === 0) {
      setSuccess(`成功导入 ${successCount} 条题目`);
      message.success(`成功导入 ${successCount} 条题目`);
      setParsedData([]);
      setCsvFile(null);
      setShowImportModal(false);
      loadQuestions();
    } else {
      const detail = `导入完成：成功 ${successCount} 条，失败 ${failCount} 条\n\n${errors.slice(0, 10).join('\n')}${errors.length > 10 ? '\n...' : ''}`;
      setError(detail);
      message.warning(`导入完成：成功 ${successCount} 条，失败 ${failCount} 条`);
    }
  };

  const downloadTemplate = () => {
    const template = `title,content,is_vip,difficulty,collection_id,vip_level_required,sort
"什么是闭包?","闭包是指函数可以访问其词法作用域外的变量。",false,简单,,,1`;

    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'interview_questions_template.csv';
    link.click();
  };

  const difficultyColor = (difficulty: string | null) => {
    if (difficulty === '简单') return 'green';
    if (difficulty === '中等') return 'blue';
    if (difficulty === '困难') return 'red';
    return 'default';
  };

  const columns: ColumnsType<Question> = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      width: 280,
    },
    {
      title: '题集',
      key: 'collection',
      width: 140,
      render: (_, record) => getCollectionName(record.collection_id),
    },
    {
      title: '难度',
      dataIndex: 'difficulty',
      key: 'difficulty',
      width: 90,
      render: (difficulty: string | null) =>
        difficulty ? <Tag color={difficultyColor(difficulty)}>{difficulty}</Tag> : '-',
    },
    {
      title: 'VIP',
      key: 'vip',
      width: 100,
      render: (_, record) =>
        record.is_vip ? (
          <Tag color="gold">VIP{record.vip_level_required ? ` L${record.vip_level_required}` : ''}</Tag>
        ) : (
          '-'
        ),
    },
    {
      title: '排序',
      dataIndex: 'sort',
      key: 'sort',
      width: 70,
      render: (sort: number | null) => sort ?? '-',
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
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditQuestion(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => confirmDelete(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const resetImportState = () => {
    setCsvFile(null);
    setParsedData([]);
    setError('');
    setSuccess('');
    setUploadProgress({ current: 0, total: 0 });
  };

  const closeImportModal = () => {
    if (isLoading) return;
    setShowImportModal(false);
    resetImportState();
  };

  const uploadFileList: UploadFile[] = csvFile
    ? [{ uid: 'csv', name: csvFile.name, status: 'done' }]
    : [];

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
        subTitle="此页面仅限管理员访问。如有疑问请联系系统管理员。"
        extra={[
          <Button type="primary" key="home" onClick={() => router.push('/')}>
            返回首页
          </Button>,
          <Button key="back" onClick={() => router.back()}>
            返回上一页
          </Button>,
        ]}
      />
    );
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <Title level={3} style={{ marginBottom: 4 }}>
            面试题管理
          </Title>
          <Text type="secondary">维护题库、搜索筛选与编辑题目</Text>
        </div>
        <Space>
          <Button icon={<PlusOutlined />} onClick={openCreateQuestionModal}>
            添加题目
          </Button>
          <Button type="primary" icon={<ImportOutlined />} onClick={() => setShowImportModal(true)}>
            批量导入
          </Button>
        </Space>
      </div>

      <Card
        title="题目列表"
        extra={
          <Button icon={<ReloadOutlined />} loading={isLoadingQuestions} onClick={loadQuestions}>
            刷新
          </Button>
        }
      >
        <Row gutter={12} style={{ marginBottom: 16 }}>
          <Col xs={24} md={16}>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="搜索题目标题..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
          </Col>
          <Col xs={24} md={8}>
            <Select
              allowClear
              style={{ width: '100%' }}
              placeholder="筛选题集"
              value={filterCollectionId || undefined}
              onChange={(value) => setFilterCollectionId(value ?? '')}
              options={collections.map((c) => ({ label: c.title, value: c.id }))}
            />
          </Col>
        </Row>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={questions}
          loading={isLoadingQuestions}
          scroll={{ x: 960 }}
          locale={{ emptyText: <Empty description="暂无题目" /> }}
          pagination={{
            current: currentPage,
            pageSize: questionsPerPage,
            showSizeChanger: false,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page) => setCurrentPage(page),
          }}
        />
      </Card>

      <Modal
        title="批量导入"
        open={showImportModal}
        onCancel={closeImportModal}
        width={720}
        destroyOnClose
        footer={
          <Space>
            <Button onClick={closeImportModal} disabled={isLoading}>
              取消
            </Button>
            <Button
              loading={isLoading && parsedData.length === 0}
              disabled={!csvFile || !selectedCollectionId}
              onClick={handleParseCSV}
            >
              解析 CSV
            </Button>
            <Button
              type="primary"
              loading={isLoading && parsedData.length > 0}
              disabled={parsedData.length === 0}
              onClick={handleImport}
            >
              开始导入
            </Button>
          </Space>
        }
      >
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text type="secondary">上传 CSV 文件并导入到指定题集</Text>
            <Button type="link" icon={<DownloadOutlined />} onClick={downloadTemplate}>
              下载模板
            </Button>
          </div>

          <div>
            <Text strong>目标题集</Text>
            <Select
              style={{ width: '100%', marginTop: 8 }}
              placeholder="请选择题集"
              value={selectedCollectionId || undefined}
              onChange={setSelectedCollectionId}
              disabled={isLoading}
              options={collections.map((c) => ({ label: c.title, value: c.id }))}
            />
          </div>

          <div>
            <Text strong>CSV 文件</Text>
            <Upload.Dragger
              style={{ marginTop: 8 }}
              accept=".csv"
              maxCount={1}
              fileList={uploadFileList}
              beforeUpload={(file) => handleFileChange(file)}
              onRemove={() => {
                setCsvFile(null);
                setParsedData([]);
                return true;
              }}
              disabled={isLoading}
            >
              <p className="ant-upload-drag-icon">
                <CloudUploadOutlined />
              </p>
              <p className="ant-upload-text">点击或拖拽 CSV 到此处</p>
              <p className="ant-upload-hint">支持 .csv，内容含逗号或换行时请用双引号包裹</p>
            </Upload.Dragger>
          </div>

          {uploadProgress.total > 0 && (
            <Progress
              percent={Math.round((uploadProgress.current / uploadProgress.total) * 100)}
              status="active"
              format={() => `${uploadProgress.current} / ${uploadProgress.total}`}
            />
          )}

          {error && <Alert type="error" message={error} showIcon />}
          {success && <Alert type="success" message={success} showIcon />}

          {parsedData.length > 0 && (
            <>
              <Divider style={{ margin: '8px 0' }} />
              <Text strong>解析预览（{parsedData.length} 条）</Text>
              <List
                size="small"
                style={{ maxHeight: 240, overflow: 'auto' }}
                dataSource={parsedData.slice(0, 10)}
                renderItem={(item, index) => (
                  <List.Item>
                    <List.Item.Meta
                      title={
                        <Space wrap>
                          <span>{index + 1}. {item.title}</span>
                          {item.is_vip && <Tag color="gold">VIP</Tag>}
                          {item.difficulty && (
                            <Tag color={difficultyColor(item.difficulty)}>{item.difficulty}</Tag>
                          )}
                        </Space>
                      }
                      description={
                        <Paragraph ellipsis={{ rows: 2 }} type="secondary" style={{ marginBottom: 0 }}>
                          {item.content}
                        </Paragraph>
                      }
                    />
                  </List.Item>
                )}
              />
              {parsedData.length > 10 && (
                <Text type="secondary">还有 {parsedData.length - 10} 条未显示...</Text>
              )}
            </>
          )}

          <Alert
            type="info"
            showIcon
            message="CSV 格式说明"
            description={
              <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
                <li>必需列：title, content, is_vip, difficulty</li>
                <li>is_vip 填 true 或 false；difficulty 推荐：简单、中等、困难</li>
                <li>可选列：vip_level_required (1-5), sort</li>
              </ul>
            }
          />
        </Space>
      </Modal>

      <QuestionFormModal
        open={questionModalOpen}
        mode={questionModalMode}
        loading={isSavingQuestion}
        collections={collections}
        initialValues={questionFormInitial}
        onCancel={closeQuestionModal}
        onSubmit={handleSaveQuestion}
      />
    </Space>
  );
}

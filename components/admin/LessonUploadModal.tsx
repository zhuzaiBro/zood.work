'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  App,
  Form,
  Input,
  InputNumber,
  Modal,
  Progress,
  Radio,
  Switch,
  Table,
  Tabs,
  Tag,
  Upload,
} from 'antd';
import { CloudUploadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload';
import type { ColumnsType } from 'antd/es/table';
import { createClient } from '@/lib/supabase/client';
import { uploadLessonVideo } from '@/lib/admin/uploadLessonVideo';
import {
  formatVideoDuration,
  getVideoDetail,
  listVideos,
  saveLessonWithVideo,
  type VideoRecord,
} from '@/lib/admin/videoApiClient';

type VideoSourceMode = 'upload' | 'reuse';

const VIDEO_PAGE_SIZE = 10;

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  waiting: { label: '等待转码', color: 'default' },
  processing: { label: '转码中', color: 'processing' },
  ready: { label: '可播放', color: 'success' },
  failed: { label: '转码失败', color: 'error' },
};

interface LessonUploadModalProps {
  open: boolean;
  chapterId: string | null;
  chapterTitle?: string;
  defaultSortOrder?: number;
  onCancel: () => void;
  onSuccess: () => void;
}

export default function LessonUploadModal({
  open,
  chapterId,
  chapterTitle,
  defaultSortOrder = 0,
  onCancel,
  onSuccess,
}: LessonUploadModalProps) {
  const { message } = App.useApp();
  const supabase = createClient();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [videoMode, setVideoMode] = useState<VideoSourceMode>('upload');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [chunkProgress, setChunkProgress] = useState({ uploaded: 0, total: 0, percent: 0 });
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [videos, setVideos] = useState<VideoRecord[]>([]);
  const [videosLoading, setVideosLoading] = useState(false);
  const [videoSearch, setVideoSearch] = useState('');
  const [videoPage, setVideoPage] = useState(1);
  const [videoTotal, setVideoTotal] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const loadVideos = useCallback(
    async (page: number) => {
      setVideosLoading(true);
      try {
        const result = await listVideos(supabase, page, VIDEO_PAGE_SIZE);
        setVideos(result.items);
        setVideoTotal(result.total);
        setVideoPage(result.page);
      } catch (error) {
        const msg = error instanceof Error ? error.message : '加载视频列表失败';
        message.error(msg);
      } finally {
        setVideosLoading(false);
      }
    },
    [supabase, message],
  );

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue({
      title: '',
      description: '',
      sortOrder: defaultSortOrder,
      isFree: false,
    });
    setVideoMode('upload');
    setVideoFile(null);
    setSelectedVideoId(null);
    setVideoSearch('');
    setUploadProgress(0);
    setChunkProgress({ uploaded: 0, total: 0, percent: 0 });
  }, [open, defaultSortOrder, form]);

  useEffect(() => {
    if (open && videoMode === 'reuse') {
      loadVideos(1);
    }
  }, [open, videoMode, loadVideos]);

  const filteredVideos = useMemo(() => {
    const keyword = videoSearch.trim().toLowerCase();
    if (!keyword) return videos;
    return videos.filter((video) => video.title.toLowerCase().includes(keyword));
  }, [videos, videoSearch]);

  const uploadFileList: UploadFile[] = videoFile
    ? [{ uid: 'video', name: videoFile.name, status: 'done' }]
    : [];

  const handleCancel = () => {
    if (loading) return;
    onCancel();
  };

  const handleSubmit = async () => {
    if (!chapterId) {
      message.warning('请先选择章节');
      return;
    }

    const values = await form.validateFields();

    if (videoMode === 'upload') {
      if (!videoFile) {
        message.warning('请选择视频文件');
        return;
      }

      setLoading(true);
      setUploadProgress(0);
      abortRef.current = new AbortController();

      try {
        const videoId = await uploadLessonVideo({
          supabase,
          videoFile,
          lessonTitle: values.title.trim(),
          lessonDescription: values.description?.trim() || '',
          chapterId,
          isFreeLesson: values.isFree,
          sortOrder: values.sortOrder ?? 0,
          signal: abortRef.current.signal,
          onProgress: setUploadProgress,
          onChunkProgress: setChunkProgress,
        });

        message.success(`课时上传成功，videoId: ${videoId}`);
        onSuccess();
      } catch (error) {
        const msg = error instanceof Error ? error.message : '上传失败';
        message.error(msg);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!selectedVideoId) {
      message.warning('请选择要复用的视频');
      return;
    }

    setLoading(true);
    try {
      const selected =
        videos.find((video) => video.id === selectedVideoId) ??
        (await getVideoDetail(supabase, selectedVideoId));

      await saveLessonWithVideo({
        chapterId,
        title: values.title.trim(),
        description: values.description?.trim() || '',
        videoId: selectedVideoId,
        duration: selected.duration,
        isFree: values.isFree,
        sortOrder: values.sortOrder ?? 0,
      });

      message.success('课时添加成功');
      onSuccess();
    } catch (error) {
      const msg = error instanceof Error ? error.message : '添加失败';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const videoColumns: ColumnsType<VideoRecord> = [
    {
      title: '',
      width: 48,
      render: (_, record) => (
        <Radio checked={selectedVideoId === record.id} disabled={loading} />
      ),
    },
    {
      title: '标题',
      dataIndex: 'title',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: string) => {
        const meta = STATUS_LABELS[status] ?? { label: status, color: 'default' };
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: '时长',
      dataIndex: 'duration',
      width: 80,
      render: (duration: number | null) => formatVideoDuration(duration),
    },
    {
      title: '上传时间',
      dataIndex: 'createdAt',
      width: 170,
      render: (value?: string) =>
        value ? new Date(value).toLocaleString('zh-CN') : '-',
    },
  ];

  const okText =
    videoMode === 'upload'
      ? loading
        ? `上传中 ${uploadProgress}%`
        : '开始上传'
      : loading
        ? '添加中…'
        : '确认添加';

  return (
    <Modal
      title={chapterTitle ? `添加课时 · ${chapterTitle}` : '添加课时'}
      open={open}
      onCancel={handleCancel}
      onOk={handleSubmit}
      okText={okText}
      cancelText="取消"
      confirmLoading={loading}
      width={720}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="title"
          label="课时标题"
          rules={[{ required: true, message: '请输入课时标题' }]}
        >
          <Input placeholder="请输入课时标题" disabled={loading} />
        </Form.Item>
        <Form.Item name="description" label="课时描述">
          <Input.TextArea rows={3} placeholder="可选" disabled={loading} />
        </Form.Item>
        <Form.Item label="视频来源" required>
          <Tabs
            activeKey={videoMode}
            onChange={(key) => {
              setVideoMode(key as VideoSourceMode);
              setSelectedVideoId(null);
              setVideoFile(null);
            }}
            items={[
              {
                key: 'upload',
                label: '上传新视频',
                children: (
                  <Upload.Dragger
                    accept="video/mp4,video/*"
                    maxCount={1}
                    fileList={uploadFileList}
                    beforeUpload={(file) => {
                      if (!file.type.startsWith('video/')) {
                        message.error('请选择视频文件');
                        return Upload.LIST_IGNORE;
                      }
                      setVideoFile(file);
                      return false;
                    }}
                    onRemove={() => {
                      setVideoFile(null);
                      return true;
                    }}
                    disabled={loading}
                  >
                    <p className="ant-upload-drag-icon">
                      <CloudUploadOutlined />
                    </p>
                    <p className="ant-upload-text">点击或拖拽 MP4 到此处</p>
                    <p className="ant-upload-hint">通过 Video Manager API 分片上传</p>
                  </Upload.Dragger>
                ),
              },
              {
                key: 'reuse',
                label: '复用已有视频',
                children: (
                  <div className="space-y-3">
                    <Input.Search
                      placeholder="按标题筛选当前页"
                      allowClear
                      value={videoSearch}
                      onChange={(event) => setVideoSearch(event.target.value)}
                      disabled={loading}
                    />
                    <Table<VideoRecord>
                      size="small"
                      rowKey="id"
                      columns={videoColumns}
                      dataSource={filteredVideos}
                      loading={videosLoading}
                      pagination={{
                        current: videoPage,
                        pageSize: VIDEO_PAGE_SIZE,
                        total: videoTotal,
                        showSizeChanger: false,
                        showTotal: (total) => `共 ${total} 个视频`,
                        onChange: (page) => loadVideos(page),
                      }}
                      onRow={(record) => ({
                        onClick: () => {
                          if (!loading) setSelectedVideoId(record.id);
                        },
                        style: { cursor: loading ? 'not-allowed' : 'pointer' },
                      })}
                      scroll={{ y: 240 }}
                    />
                  </div>
                ),
              },
            ]}
          />
        </Form.Item>
        <Form.Item name="sortOrder" label="排序号">
          <InputNumber min={0} style={{ width: '100%' }} disabled={loading} />
        </Form.Item>
        <Form.Item name="isFree" label="免费课时" valuePropName="checked">
          <Switch disabled={loading} />
        </Form.Item>
      </Form>

      {loading && videoMode === 'upload' && uploadProgress > 0 && (
        <Progress
          percent={uploadProgress}
          status="active"
          format={() =>
            chunkProgress.total > 0
              ? `${((chunkProgress.uploaded / 1024 / 1024).toFixed(1))} / ${((chunkProgress.total / 1024 / 1024).toFixed(1))} MB`
              : `${uploadProgress}%`
          }
        />
      )}
    </Modal>
  );
}

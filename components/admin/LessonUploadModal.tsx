'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  App,
  Button,
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
import { uploadLessonCourseware } from '@/lib/uploadLessonCourseware';
import {
  formatVideoDuration,
  getVideoDetail,
  listVideos,
  saveLesson,
  saveLessonWithVideo,
  type VideoRecord,
} from '@/lib/admin/videoApiClient';
import { hasLessonDocument, hasLessonVideo } from '@/lib/lessonContent';

type LessonSourceMode = 'upload' | 'reuse' | 'document';

const Editor = dynamic(() => import('@/components/Editor'), { ssr: false });

const VIDEO_PAGE_SIZE = 10;

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  waiting: { label: '等待转码', color: 'default' },
  processing: { label: '转码中', color: 'processing' },
  ready: { label: '可播放', color: 'success' },
  failed: { label: '转码失败', color: 'error' },
};

interface LessonUploadModalProps {
  open: boolean;
  mode?: 'create' | 'edit';
  lesson?: {
    id: string;
    title: string;
    description?: string | null;
    coursewareName?: string | null;
    coursewareUrl?: string | null;
    contentHtml?: string | null;
    contentMarkdown?: string | null;
    videoId?: string | null;
    durationSeconds?: number | null;
    isFree: boolean;
    sortOrder: number;
  } | null;
  chapterId: string | null;
  chapterTitle?: string;
  defaultSortOrder?: number;
  onCancel: () => void;
  onSuccess: () => void;
}

export default function LessonUploadModal({
  open,
  mode = 'create',
  lesson,
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
  const [lessonMode, setLessonMode] = useState<LessonSourceMode>('upload');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [chunkProgress, setChunkProgress] = useState({ uploaded: 0, total: 0, percent: 0 });
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [videos, setVideos] = useState<VideoRecord[]>([]);
  const [videosLoading, setVideosLoading] = useState(false);
  const [videoSearch, setVideoSearch] = useState('');
  const [videoPage, setVideoPage] = useState(1);
  const [videoTotal, setVideoTotal] = useState(0);
  const [coursewareFile, setCoursewareFile] = useState<File | null>(null);
  const [contentHtml, setContentHtml] = useState('');
  const [contentMarkdown, setContentMarkdown] = useState('');
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

  const resolveInitialLessonMode = (): LessonSourceMode => {
    if (mode === 'edit' && lesson) {
      if (!hasLessonVideo(lesson) && hasLessonDocument(lesson)) {
        return 'document';
      }
      if (lesson.videoId) {
        return 'reuse';
      }
    }
    return 'upload';
  };

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue({
      title: lesson?.title ?? '',
      description: lesson?.description ?? '',
      coursewareName: lesson?.coursewareName ?? '',
      coursewareUrl: lesson?.coursewareUrl ?? '',
      sortOrder: lesson?.sortOrder ?? defaultSortOrder,
      isFree: lesson?.isFree ?? false,
    });
    setLessonMode(resolveInitialLessonMode());
    setVideoFile(null);
    setCoursewareFile(null);
    setSelectedVideoId(lesson?.videoId ?? null);
    setVideoSearch('');
    setUploadProgress(0);
    setChunkProgress({ uploaded: 0, total: 0, percent: 0 });
    setContentHtml(lesson?.contentHtml ?? lesson?.contentMarkdown ?? '');
    setContentMarkdown(lesson?.contentMarkdown ?? '');
  }, [open, defaultSortOrder, form, lesson, mode]);

  useEffect(() => {
    if (open && (lessonMode === 'reuse' || (mode === 'edit' && lesson?.videoId))) {
      loadVideos(1);
    }
  }, [open, lessonMode, loadVideos, mode, lesson?.videoId]);

  const filteredVideos = useMemo(() => {
    const keyword = videoSearch.trim().toLowerCase();
    if (!keyword) return videos;
    return videos.filter((video) => video.title.toLowerCase().includes(keyword));
  }, [videos, videoSearch]);

  const uploadFileList: UploadFile[] = videoFile
    ? [{ uid: 'video', name: videoFile.name, status: 'done' }]
    : [];
  const coursewareFileList: UploadFile[] = coursewareFile
    ? [{ uid: 'courseware', name: coursewareFile.name, status: 'done' }]
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
    let finalCoursewareUrl = values.coursewareUrl?.trim() || '';
    let finalCoursewareName = values.coursewareName?.trim() || '';

    if (coursewareFile) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        message.error('登录状态失效，请重新登录后再上传课件');
        return;
      }

      const uploadResult = await uploadLessonCourseware(supabase, user.id, coursewareFile);
      if ('error' in uploadResult) {
        message.error(uploadResult.error);
        return;
      }

      finalCoursewareUrl = uploadResult.publicUrl;
      if (!finalCoursewareName) {
        finalCoursewareName = uploadResult.fileName;
      }
    }

    if (lessonMode === 'document') {
      if (!contentMarkdown.trim() && !contentHtml.trim()) {
        message.warning('纯文档课时请填写课时讲义');
        return;
      }

      setLoading(true);
      try {
        await saveLesson({
          lessonId: mode === 'edit' ? lesson?.id : undefined,
          chapterId,
          title: values.title.trim(),
          description: values.description?.trim() || '',
          coursewareName: finalCoursewareName || null,
          coursewareUrl: finalCoursewareUrl || null,
          contentHtml: contentHtml.trim() || null,
          contentMarkdown: contentMarkdown.trim() || null,
          videoId: null,
          duration: null,
          isFree: values.isFree,
          sortOrder: values.sortOrder ?? 0,
        });

        message.success(mode === 'edit' ? '文档课时更新成功' : '文档课时创建成功');
        onSuccess();
      } catch (error) {
        const msg = error instanceof Error ? error.message : '保存失败';
        message.error(msg);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (lessonMode === 'upload') {
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
          coursewareName: finalCoursewareName || null,
          coursewareUrl: finalCoursewareUrl || null,
          contentHtml: contentHtml.trim() || null,
          contentMarkdown: contentMarkdown.trim() || null,
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
        lessonId: mode === 'edit' ? lesson?.id : undefined,
        chapterId,
        title: values.title.trim(),
        description: values.description?.trim() || '',
        coursewareName: finalCoursewareName || null,
        coursewareUrl: finalCoursewareUrl || null,
        contentHtml: contentHtml.trim() || null,
        contentMarkdown: contentMarkdown.trim() || null,
        videoId: selectedVideoId,
        duration: selected.duration,
        isFree: values.isFree,
        sortOrder: values.sortOrder ?? 0,
      });

      message.success(mode === 'edit' ? '课时更新成功' : '课时添加成功');
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
    lessonMode === 'document'
      ? loading
        ? '保存中…'
        : mode === 'edit'
          ? '保存文档课时'
          : '创建文档课时'
      : lessonMode === 'upload'
      ? loading
        ? `上传中 ${uploadProgress}%`
        : mode === 'edit'
          ? '上传并更新'
          : '开始上传'
      : loading
        ? mode === 'edit' ? '保存中…' : '添加中…'
        : mode === 'edit' ? '保存修改' : '确认添加';

  return (
    <Modal
      title={
        chapterTitle
          ? `${mode === 'edit' ? '编辑课时' : '添加课时'} · ${chapterTitle}`
          : mode === 'edit' ? '编辑课时' : '添加课时'
      }
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
        <Form.Item name="coursewareName" label="课件名称">
          <Input placeholder="例如：第一课讲义.pdf" disabled={loading} />
        </Form.Item>
        <Form.Item name="coursewareUrl" label="课件链接">
          <Input placeholder="可直接粘贴外部 URL，或下方上传课件文件" disabled={loading || Boolean(coursewareFile)} />
        </Form.Item>
        <Form.Item label="上传课件">
          <Upload
            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.txt,application/pdf"
            maxCount={1}
            fileList={coursewareFileList}
            beforeUpload={(file) => {
              setCoursewareFile(file);
              if (!form.getFieldValue('coursewareName')) {
                form.setFieldValue('coursewareName', file.name);
              }
              return false;
            }}
            onRemove={() => {
              setCoursewareFile(null);
              return true;
            }}
            disabled={loading}
          >
            <Button disabled={loading}>选择课件文件</Button>
          </Upload>
        </Form.Item>
        <Form.Item
          label="课时讲义 / 富文本"
          required={lessonMode === 'document'}
          extra={
            lessonMode === 'document'
              ? '纯文档课时必须填写讲义，学员将在学习页以文档形式阅读。'
              : '可选。填写后学员可在视频下方查看讲义，或配合代码学习 Tab。'
          }
        >
          <Editor
            value={contentHtml || contentMarkdown}
            onChange={(html, markdown) => {
              setContentHtml(html);
              setContentMarkdown(markdown);
            }}
          />
        </Form.Item>
        <Form.Item
          label="课时类型"
          required={lessonMode !== 'document'}
        >
          <Tabs
            activeKey={lessonMode}
            onChange={(key) => {
              const nextMode = key as LessonSourceMode;
              if (mode === 'edit' && nextMode === 'upload') {
                setSelectedVideoId(null);
              }
              setLessonMode(nextMode);
              if (nextMode !== 'reuse') {
                setSelectedVideoId(null);
              }
              if (nextMode !== 'upload') {
                setVideoFile(null);
              }
            }}
            items={[
              {
                key: 'document',
                label: '纯文档课时',
                children: (
                  <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 px-4 py-3 text-sm leading-6 text-slate-600">
                    不需要上传视频。填写上方「课时讲义」即可，学员在学习页会以文档阅读模式查看本课时。
                    {mode === 'edit' && lesson?.videoId ? (
                      <p className="mt-2 text-amber-700">
                        保存后将会移除当前课时绑定的视频，改为纯文档课时。
                      </p>
                    ) : null}
                  </div>
                ),
              },
              {
                key: 'upload',
                label: mode === 'edit' ? '替换为新视频' : '上传新视频',
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
                label: mode === 'edit' ? '切换已有视频' : '复用已有视频',
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

      {loading && lessonMode === 'upload' && uploadProgress > 0 && (
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

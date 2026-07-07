'use client';

import { useMemo, useRef, useState, type HTMLAttributes } from 'react';
import { App, Button, InputNumber, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EditOutlined, HolderOutlined } from '@ant-design/icons';
import { isDocumentOnlyLesson } from '@/lib/lessonContent';

export interface LessonRow {
  id: string;
  title: string;
  description?: string | null;
  coursewareName?: string | null;
  coursewareUrl?: string | null;
  contentHtml?: string | null;
  contentMarkdown?: string | null;
  duration?: string;
  durationSeconds?: number | null;
  isFree: boolean;
  isLocked: boolean;
  videoUrl?: string | null;
  videoId?: string | null;
  sortOrder: number;
}

interface LessonChapterTableProps {
  chapterId: string;
  lessons: LessonRow[];
  onEdit: (lesson: LessonRow) => void;
  onLessonsChange: (chapterId: string, lessons: LessonRow[]) => void;
}

function sortLessons(lessons: LessonRow[]) {
  return [...lessons].sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));
}

async function persistLessonOrder(chapterId: string, orderedIds: string[]) {
  const response = await fetch('/api/lessons/reorder', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chapterId, orderedLessonIds: orderedIds }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error || '保存排序失败');
  }
}

function reorderByIndex(lessons: LessonRow[], fromIndex: number, toIndex: number) {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) {
    return sortLessons(lessons);
  }

  const next = sortLessons(lessons);
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next.map((lesson, index) => ({ ...lesson, sortOrder: index }));
}

interface DraggableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  'data-row-key'?: string;
}

function DraggableBodyRow({
  draggingId,
  dropTargetId,
  saving,
  onDropTarget,
  onClearDropTarget,
  onDropRow,
  ...props
}: DraggableRowProps & {
  draggingId: string | null;
  dropTargetId: string | null;
  saving: boolean;
  onDropTarget: (id: string) => void;
  onClearDropTarget: (id: string) => void;
  onDropRow: (id: string) => void;
}) {
  const rowKey = props['data-row-key'];
  const isDragging = draggingId === rowKey;
  const isDropTarget = dropTargetId === rowKey && draggingId !== rowKey;

  return (
    <tr
      {...props}
      style={{
        ...props.style,
        opacity: isDragging ? 0.45 : 1,
        background: isDropTarget ? 'rgba(22, 119, 255, 0.08)' : props.style?.background,
      }}
      onDragOver={(event) => {
        event.preventDefault();
        if (rowKey && draggingId && rowKey !== draggingId) {
          onDropTarget(rowKey);
        }
      }}
      onDragLeave={() => {
        if (rowKey) onClearDropTarget(rowKey);
      }}
      onDrop={(event) => {
        event.preventDefault();
        if (rowKey) onDropRow(rowKey);
      }}
    />
  );
}

export default function LessonChapterTable({
  chapterId,
  lessons,
  onEdit,
  onLessonsChange,
}: LessonChapterTableProps) {
  const { message } = App.useApp();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const snapshotRef = useRef<LessonRow[]>([]);

  const sortedLessons = useMemo(() => sortLessons(lessons), [lessons]);

  const applyReorder = async (nextLessons: LessonRow[]) => {
    snapshotRef.current = sortedLessons;
    onLessonsChange(chapterId, nextLessons);
    setSaving(true);

    try {
      await persistLessonOrder(
        chapterId,
        nextLessons.map((lesson) => lesson.id),
      );
      message.success('课时排序已保存');
    } catch (error) {
      onLessonsChange(chapterId, snapshotRef.current);
      message.error(error instanceof Error ? error.message : '保存排序失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDrop = (targetId: string) => {
    if (!draggingId || draggingId === targetId || saving) return;

    const fromIndex = sortedLessons.findIndex((lesson) => lesson.id === draggingId);
    const toIndex = sortedLessons.findIndex((lesson) => lesson.id === targetId);
    if (fromIndex === -1 || toIndex === -1) return;

    void applyReorder(reorderByIndex(sortedLessons, fromIndex, toIndex));
    setDraggingId(null);
    setDropTargetId(null);
  };

  const commitSortInput = (lessonId: string, rawValue: number | string | null) => {
    const value = typeof rawValue === 'number' ? rawValue : Number(rawValue);
    if (Number.isNaN(value) || saving) return;

    const fromIndex = sortedLessons.findIndex((lesson) => lesson.id === lessonId);
    if (fromIndex === -1) return;

    const toIndex = Math.max(0, Math.min(Math.round(value), sortedLessons.length - 1));
    if (fromIndex === toIndex) return;

    void applyReorder(reorderByIndex(sortedLessons, fromIndex, toIndex));
  };

  const tableComponents = useMemo(
    () => ({
      body: {
        row: (props: DraggableRowProps) => (
          <DraggableBodyRow
            {...props}
            draggingId={draggingId}
            dropTargetId={dropTargetId}
            saving={saving}
            onDropTarget={setDropTargetId}
            onClearDropTarget={(id) => {
              setDropTargetId((current) => (current === id ? null : current));
            }}
            onDropRow={handleDrop}
          />
        ),
      },
    }),
    [draggingId, dropTargetId, saving, sortedLessons],
  );

  const columns: ColumnsType<LessonRow> = [
    {
      title: '',
      key: 'drag',
      width: 36,
      render: (_, record) => (
        <span
          draggable={!saving}
          onDragStart={(event) => {
            setDraggingId(record.id);
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/plain', record.id);
          }}
          onDragEnd={() => {
            setDraggingId(null);
            setDropTargetId(null);
          }}
          style={{
            cursor: saving ? 'not-allowed' : 'grab',
            color: '#999',
            display: 'inline-flex',
            alignItems: 'center',
            padding: '2px 0',
          }}
          title="拖拽排序"
        >
          <HolderOutlined />
        </span>
      ),
    },
    {
      title: '课时标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: '时长',
      dataIndex: 'duration',
      key: 'duration',
      width: 80,
      render: (duration?: string) => duration || '-',
    },
    {
      title: '免费',
      key: 'isFree',
      width: 70,
      render: (_, record) => (record.isFree ? <Tag color="blue">免费</Tag> : '-'),
    },
    {
      title: '类型',
      key: 'lessonType',
      width: 80,
      render: (_, record) => {
        if (isDocumentOnlyLesson(record)) {
          return <Tag color="green">文档</Tag>;
        }
        if (record.videoId) {
          return <Tag color="blue">视频</Tag>;
        }
        return <Tag>未配置</Tag>;
      },
    },
    {
      title: '资料',
      key: 'resources',
      width: 120,
      render: (_, record) => (
        <Space size={4} wrap>
          {record.coursewareUrl ? <Tag color="cyan">课件</Tag> : null}
          {record.contentMarkdown ? <Tag color="geekblue">讲义</Tag> : null}
          {!record.coursewareUrl && !record.contentMarkdown ? '-' : null}
        </Space>
      ),
    },
    {
      title: '排序',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      width: 88,
      render: (sortOrder: number, record) => (
        <InputNumber
          size="small"
          min={0}
          max={Math.max(sortedLessons.length - 1, 0)}
          defaultValue={sortOrder}
          key={`${record.id}-${sortOrder}`}
          disabled={saving}
          controls
          style={{ width: 64 }}
          onPressEnter={(event) => {
            commitSortInput(record.id, (event.target as HTMLInputElement).value);
          }}
          onBlur={(event) => {
            commitSortInput(record.id, event.target.value);
          }}
          onChange={(value) => {
            if (value === null || value === record.sortOrder) return;
            if (Math.abs(value - record.sortOrder) === 1) {
              commitSortInput(record.id, value);
            }
          }}
        />
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 80,
      render: (_, record) => (
        <Button size="small" icon={<EditOutlined />} onClick={() => onEdit(record)}>
          编辑
        </Button>
      ),
    },
  ];

  return (
    <Table
      rowKey="id"
      size="small"
      columns={columns}
      dataSource={sortedLessons}
      pagination={false}
      loading={false}
      locale={{ emptyText: '该章节暂无课时，点击「上传课时」添加' }}
      components={tableComponents}
    />
  );
}

'use client';

import Link from 'next/link';
import { useMemo, useRef, useState, type HTMLAttributes } from 'react';
import { App, InputNumber, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { HolderOutlined } from '@ant-design/icons';

export interface CourseRow {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  price: number;
  is_free: boolean;
  status: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface CourseListTableProps {
  courses: CourseRow[];
  loading?: boolean;
  onCoursesChange: (courses: CourseRow[]) => void;
}

const statusMap: Record<string, { color: string; label: string }> = {
  draft: { color: 'default', label: '草稿' },
  published: { color: 'green', label: '已发布' },
  archived: { color: 'orange', label: '已归档' },
};

const { Text } = Typography;

function sortCourses(courses: CourseRow[]) {
  return [...courses].sort(
    (a, b) => a.sort_order - b.sort_order || a.title.localeCompare(b.title),
  );
}

async function persistCourseOrder(orderedIds: string[]) {
  const response = await fetch('/api/courses/reorder', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderedCourseIds: orderedIds }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error || '保存排序失败');
  }
}

function reorderByIndex(courses: CourseRow[], fromIndex: number, toIndex: number) {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) {
    return sortCourses(courses);
  }

  const next = sortCourses(courses);
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next.map((course, index) => ({ ...course, sort_order: index }));
}

interface DraggableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  'data-row-key'?: string;
}

function DraggableBodyRow({
  draggingId,
  dropTargetId,
  onDropTarget,
  onClearDropTarget,
  onDropRow,
  ...props
}: DraggableRowProps & {
  draggingId: string | null;
  dropTargetId: string | null;
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

function CourseCover({ url }: { url: string | null }) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        style={{
          width: 72,
          height: 54,
          objectFit: 'cover',
          borderRadius: 6,
          border: '1px solid #f0f0f0',
          flexShrink: 0,
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: 72,
        height: 54,
        borderRadius: 6,
        border: '1px dashed #d9d9d9',
        background: '#fafafa',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 11,
        color: '#bbb',
        flexShrink: 0,
      }}
    >
      无封面
    </div>
  );
}

export default function CourseListTable({
  courses,
  onCoursesChange,
}: CourseListTableProps) {
  const { message } = App.useApp();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const snapshotRef = useRef<CourseRow[]>([]);

  const sortedCourses = useMemo(() => sortCourses(courses), [courses]);

  const applyReorder = async (nextCourses: CourseRow[]) => {
    snapshotRef.current = sortedCourses;
    onCoursesChange(nextCourses);
    setSaving(true);

    try {
      await persistCourseOrder(nextCourses.map((course) => course.id));
      message.success('课程排序已保存');
    } catch (error) {
      onCoursesChange(snapshotRef.current);
      message.error(error instanceof Error ? error.message : '保存排序失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDrop = (targetId: string) => {
    if (!draggingId || draggingId === targetId || saving) return;

    const fromIndex = sortedCourses.findIndex((course) => course.id === draggingId);
    const toIndex = sortedCourses.findIndex((course) => course.id === targetId);
    if (fromIndex === -1 || toIndex === -1) return;

    void applyReorder(reorderByIndex(sortedCourses, fromIndex, toIndex));
    setDraggingId(null);
    setDropTargetId(null);
  };

  const commitSortInput = (courseId: string, rawValue: number | string | null) => {
    const value = typeof rawValue === 'number' ? rawValue : Number(rawValue);
    if (Number.isNaN(value) || saving) return;

    const fromIndex = sortedCourses.findIndex((course) => course.id === courseId);
    if (fromIndex === -1) return;

    const toIndex = Math.max(0, Math.min(Math.round(value), sortedCourses.length - 1));
    if (fromIndex === toIndex) return;

    void applyReorder(reorderByIndex(sortedCourses, fromIndex, toIndex));
  };

  const tableComponents = useMemo(
    () => ({
      body: {
        row: (props: DraggableRowProps) => (
          <DraggableBodyRow
            {...props}
            draggingId={draggingId}
            dropTargetId={dropTargetId}
            onDropTarget={setDropTargetId}
            onClearDropTarget={(id) => {
              setDropTargetId((current) => (current === id ? null : current));
            }}
            onDropRow={handleDrop}
          />
        ),
      },
    }),
    [draggingId, dropTargetId, saving, sortedCourses],
  );

  const columns: ColumnsType<CourseRow> = [
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
          }}
          title="拖拽排序"
        >
          <HolderOutlined />
        </span>
      ),
    },
    {
      title: '课程',
      key: 'course',
      render: (_, record) => (
        <Space align="start" size={12}>
          <CourseCover url={record.cover_image_url} />
          <div style={{ minWidth: 0 }}>
            <Link href={`/admin/videoManage/${record.id}`}>
              <Text strong>{record.title}</Text>
            </Link>
            {record.description ? (
              <div>
                <Text type="secondary" ellipsis style={{ maxWidth: 360, fontSize: 12 }}>
                  {record.description}
                </Text>
              </div>
            ) : null}
          </div>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: string) => {
        const item = statusMap[status] || { color: 'default', label: status };
        return <Tag color={item.color}>{item.label}</Tag>;
      },
    },
    {
      title: '定价',
      key: 'price',
      width: 90,
      render: (_, record) =>
        record.is_free ? <Tag color="blue">免费</Tag> : <Tag color="gold">¥{record.price}</Tag>,
    },
    {
      title: '排序',
      dataIndex: 'sort_order',
      key: 'sort_order',
      width: 88,
      render: (sortOrder: number, record) => (
        <InputNumber
          size="small"
          min={0}
          max={Math.max(sortedCourses.length - 1, 0)}
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
            if (value === null || value === record.sort_order) return;
            if (Math.abs(value - record.sort_order) === 1) {
              commitSortInput(record.id, value);
            }
          }}
        />
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 110,
      render: (value: string) => new Date(value).toLocaleDateString('zh-CN'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 72,
      render: (_, record) => <Link href={`/admin/videoManage/${record.id}`}>管理</Link>,
    },
  ];

  return (
    <Table
      rowKey="id"
      size="middle"
      columns={columns}
      dataSource={sortedCourses}
      loading={false}
      pagination={false}
      components={tableComponents}
    />
  );
}

'use client';

import { useEffect, useState } from 'react';
import QiniuUploader from '@/components/QiniuUploader';
import {
  Button,
  Divider,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Switch,
  Typography,
} from 'antd';
import { PictureOutlined } from '@ant-design/icons';

const STATUS_OPTIONS = [
  { value: 'draft', label: '草稿', description: '仅管理员可见，前台不展示' },
  { value: 'published', label: '已发布', description: '在课程列表中公开可见' },
  { value: 'archived', label: '已归档', description: '下架隐藏，已购用户策略待定' },
] as const;

export type CourseSettingsValues = {
  title: string;
  description?: string;
  coverImageUrl?: string;
  status: string;
  isFree: boolean;
  price: number;
};

interface CourseSettingsModalProps {
  open: boolean;
  loading?: boolean;
  initialValues?: Partial<CourseSettingsValues>;
  onCancel: () => void;
  onSubmit: (values: CourseSettingsValues) => void | Promise<void>;
}

const { Text } = Typography;

export default function CourseSettingsModal({
  open,
  loading,
  initialValues,
  onCancel,
  onSubmit,
}: CourseSettingsModalProps) {
  const [form] = Form.useForm<CourseSettingsValues>();
  const [coverUrl, setCoverUrl] = useState<string | undefined>();
  const isFreeWatch = Form.useWatch('isFree', form);
  const statusWatch = Form.useWatch('status', form);

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue({
      title: initialValues?.title ?? '',
      description: initialValues?.description ?? '',
      coverImageUrl: initialValues?.coverImageUrl ?? '',
      status: initialValues?.status ?? 'draft',
      isFree: initialValues?.isFree ?? false,
      price: initialValues?.price ?? 0,
    });
    setCoverUrl(initialValues?.coverImageUrl ?? undefined);
  }, [open, initialValues, form]);

  const handleOk = async () => {
    const values = await form.validateFields();
    await onSubmit({
      ...values,
      coverImageUrl: coverUrl ?? '',
      price: values.isFree ? 0 : values.price,
    });
  };

  return (
    <Modal
      title="课程设置"
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      okText={loading ? '保存中' : '保存'}
      cancelText="取消"
      okButtonProps={{ disabled: loading }}
      width={560}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item name="coverImageUrl" hidden>
          <Input />
        </Form.Item>
        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <QiniuUploader
            maxSize={5}
            accept="image/*"
            onSuccess={(response) => {
              setCoverUrl(response.url);
              form.setFieldValue('coverImageUrl', response.url);
            }}
            onError={(error) => {
              form.setFields([{ name: 'coverImageUrl', errors: [error.message] }]);
            }}
          >
            <div
              style={{
                width: 120,
                height: 90,
                borderRadius: 8,
                overflow: 'hidden',
                border: '1px dashed #d9d9d9',
                cursor: 'pointer',
                position: 'relative',
                background: '#fafafa',
                flexShrink: 0,
              }}
            >
              {coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={coverUrl}
                  alt="课程封面"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#999',
                    fontSize: 12,
                    gap: 4,
                  }}
                >
                  <PictureOutlined style={{ fontSize: 20 }} />
                  <span>上传封面</span>
                </div>
              )}
            </div>
          </QiniuUploader>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Form.Item
              name="title"
              label="课程标题"
              rules={[{ required: true, message: '请输入课程标题' }]}
              style={{ marginBottom: 12 }}
            >
              <Input placeholder="课程标题" />
            </Form.Item>
            <Form.Item name="description" label="课程描述" style={{ marginBottom: 0 }}>
              <Input.TextArea rows={2} placeholder="可选，简短介绍" />
            </Form.Item>
          </div>
        </div>

        {coverUrl ? (
          <div style={{ marginBottom: 12 }}>
            <Button
              type="link"
              size="small"
              danger
              style={{ padding: 0, height: 'auto' }}
              onClick={() => {
                setCoverUrl(undefined);
                form.setFieldValue('coverImageUrl', '');
              }}
            >
              移除封面
            </Button>
          </div>
        ) : null}

        <Divider style={{ margin: '12px 0' }} />

        <Space size={16} style={{ width: '100%' }} align="start">
          <Form.Item
            name="status"
            label="可见度"
            rules={[{ required: true, message: '请选择可见度' }]}
            style={{ flex: 1, marginBottom: 12 }}
          >
            <Select
              options={STATUS_OPTIONS.map((item) => ({
                value: item.value,
                label: item.label,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="isFree"
            label="免费课程"
            valuePropName="checked"
            style={{ marginBottom: 12 }}
          >
            <Switch
              checkedChildren="免费"
              unCheckedChildren="付费"
              onChange={(checked) => {
                if (checked) {
                  form.setFieldValue('price', 0);
                }
              }}
            />
          </Form.Item>
        </Space>
        <Text type="secondary" style={{ display: 'block', marginTop: -8, marginBottom: 12, fontSize: 12 }}>
          {STATUS_OPTIONS.find((item) => item.value === statusWatch)?.description}
        </Text>
        <Form.Item
          name="price"
          label="价格（元）"
          rules={[
            {
              validator: async (_, value) => {
                if (form.getFieldValue('isFree')) return;
                if (value === undefined || value === null) {
                  throw new Error('请输入价格');
                }
                if (Number(value) < 0) {
                  throw new Error('价格不能为负数');
                }
              },
            },
          ]}
          style={{ marginBottom: 0 }}
        >
          <InputNumber
            min={0}
            precision={2}
            addonBefore="¥"
            style={{ width: '100%' }}
            disabled={isFreeWatch}
            placeholder={isFreeWatch ? '免费课程无需定价' : '请输入价格'}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}

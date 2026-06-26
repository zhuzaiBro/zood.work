'use client';

import { useCallback } from 'react';
import { Form, Input, InputNumber, Modal, Row, Col, Select, Switch, Typography } from 'antd';
import type { Database } from '@/types/database.types';

type Collection = Database['public']['Tables']['interview_collections']['Row'];

export type QuestionFormValues = {
  collection_id: string;
  title: string;
  content: string;
  difficulty: string | null;
  sort: number | null;
  is_vip: boolean;
  vip_level_required: number | null;
};

interface QuestionFormModalProps {
  open: boolean;
  mode: 'create' | 'edit';
  formKey?: string;
  loading?: boolean;
  collections: Collection[];
  initialValues?: Partial<QuestionFormValues>;
  onCancel: () => void;
  onSubmit: (values: QuestionFormValues) => void | Promise<void>;
}

const { Text } = Typography;

function buildFormValues(initialValues?: Partial<QuestionFormValues>): Partial<QuestionFormValues> {
  return {
    collection_id: initialValues?.collection_id,
    title: initialValues?.title ?? '',
    content: initialValues?.content ?? '',
    difficulty: initialValues?.difficulty ?? null,
    sort: initialValues?.sort ?? null,
    is_vip: initialValues?.is_vip ?? false,
    vip_level_required: initialValues?.vip_level_required ?? null,
  };
}

export default function QuestionFormModal({
  open,
  mode,
  formKey = 'create',
  loading,
  collections,
  initialValues,
  onCancel,
  onSubmit,
}: QuestionFormModalProps) {
  const [form] = Form.useForm<QuestionFormValues>();
  const isVip = Form.useWatch('is_vip', form);

  const applyInitialValues = useCallback(() => {
    form.setFieldsValue(buildFormValues(initialValues));
  }, [form, initialValues]);

  const handleAfterOpenChange = (visible: boolean) => {
    if (visible) {
      form.resetFields();
      applyInitialValues();
      return;
    }
    form.resetFields();
  };

  const handleOk = async () => {
    const values = await form.validateFields();
    await onSubmit({
      ...values,
      difficulty: values.difficulty ?? null,
      sort: values.sort ?? null,
      vip_level_required: values.is_vip ? values.vip_level_required ?? null : null,
    });
  };

  return (
    <Modal
      title={mode === 'create' ? '添加题目' : '编辑题目'}
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      okText={mode === 'create' ? '创建' : '保存'}
      cancelText="取消"
      confirmLoading={loading}
      width={800}
      destroyOnClose
      afterOpenChange={handleAfterOpenChange}
    >
      <Form
        key={formKey}
        form={form}
        layout="vertical"
        preserve={false}
        initialValues={buildFormValues(initialValues)}
      >
        <Form.Item
          name="collection_id"
          label="所属题集"
          rules={[{ required: true, message: '请选择题集' }]}
        >
          <Select
            placeholder="请选择题集"
            options={collections.map((c) => ({ label: c.title, value: c.id }))}
          />
        </Form.Item>

        <Form.Item
          name="title"
          label="标题"
          rules={[{ required: true, message: '请输入题目标题' }]}
        >
          <Input placeholder="请输入题目标题" />
        </Form.Item>

        <Form.Item
          name="content"
          label="答案内容（Markdown）"
          rules={[{ required: true, message: '请输入答案内容' }]}
        >
          <Input.TextArea rows={12} placeholder="支持 Markdown 格式" />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="difficulty" label="难度">
              <Select
                allowClear
                placeholder="不设置"
                options={[
                  { label: '简单', value: '简单' },
                  { label: '中等', value: '中等' },
                  { label: '困难', value: '困难' },
                ]}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="sort" label="排序号">
              <InputNumber style={{ width: '100%' }} placeholder="数字越小越靠前" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="VIP 设置" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Form.Item name="is_vip" valuePropName="checked" noStyle>
              <Switch />
            </Form.Item>
            <Text type="secondary">VIP 专属</Text>
            {isVip && (
              <Form.Item name="vip_level_required" noStyle>
                <Select
                  allowClear
                  style={{ width: 120 }}
                  placeholder="VIP 等级"
                  options={[1, 2, 3, 4, 5].map((n) => ({ label: String(n), value: n }))}
                />
              </Form.Item>
            )}
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
}

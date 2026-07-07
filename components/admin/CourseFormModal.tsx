'use client';

import { Form, Input, Modal } from 'antd';

export type CourseFormValues = {
  title: string;
  description?: string;
};

interface CourseFormModalProps {
  open: boolean;
  loading?: boolean;
  onCancel: () => void;
  onSubmit: (values: CourseFormValues) => void | Promise<void>;
}

export default function CourseFormModal({
  open,
  loading,
  onCancel,
  onSubmit,
}: CourseFormModalProps) {
  const [form] = Form.useForm<CourseFormValues>();

  const handleOk = async () => {
    const values = await form.validateFields();
    await onSubmit(values);
    form.resetFields();
  };

  return (
    <Modal
      title="创建课程"
      open={open}
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      onOk={handleOk}
      okText={loading ? '创建中' : '创建'}
      cancelText="取消"
      okButtonProps={{ disabled: loading }}
      destroyOnClose
    >
      <Form form={form} layout="vertical" preserve={false}>
        <Form.Item
          name="title"
          label="课程标题"
          rules={[{ required: true, message: '请输入课程标题' }]}
        >
          <Input placeholder="请输入课程标题" />
        </Form.Item>
        <Form.Item name="description" label="课程描述">
          <Input.TextArea rows={4} placeholder="可选" />
        </Form.Item>
      </Form>
    </Modal>
  );
}

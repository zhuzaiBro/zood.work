'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Button, Card, Form, Input, Result, Space, Typography } from 'antd';
import { AdminListSkeleton } from '@/components/ui/PageSkeleton';
import { browserUser } from '@/lib/auth/session';
import { publicTelegramConfig } from '@/lib/support/chatRealtime';

const { Title, Paragraph, Text } = Typography;

export default function AdminSupportPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [hasPermission, setHasPermission] = useState(true);
  const [configured, setConfigured] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [token, setToken] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const loadConfig = async () => {
    setLoading(true);
    setError('');
    try {
      const user = await browserUser();
      if (!user) {
        router.push('/login?redirect=/admin/support');
        return;
      }
      const response = await fetch('/api/admin/support/telegram', { cache: 'no-store' });
      const payload = await response.json().catch(() => ({}));
      if (response.status === 401) {
        router.push('/login?redirect=/admin/support');
        return;
      }
      if (response.status === 403) {
        setHasPermission(false);
        return;
      }
      if (!response.ok) {
        setError(typeof payload.error === 'string' ? payload.error : '客服配置暂时不能读取');
        return;
      }
      const view = publicTelegramConfig(payload);
      setConfigured(view?.configured === true);
      setHint(view?.hint ?? null);
      setHasPermission(true);
    } catch {
      setError('客服配置暂时不能读取');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadConfig();
    // The config is loaded once when the admin page opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (body: Record<string, unknown>) => {
    const response = await fetch('/api/admin/support/telegram', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Zood-Request': 'support-config',
      },
      body: JSON.stringify(body),
    });
    const payload = await response.json().catch(() => ({}));
    if (response.status === 403) {
      setHasPermission(false);
      return;
    }
    if (!response.ok) {
      setError(typeof payload.error === 'string' ? payload.error : '客服配置暂时不能保存');
      return;
    }
    const view = publicTelegramConfig(payload);
    setConfigured(view?.configured === true);
    setHint(view?.hint ?? null);
    setToken('');
    setNotice(body.clearTelegramBotToken ? '已清除保存的 token' : '配置已更新');
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const value = token.trim();
      await submit(value ? { telegramBotToken: value } : {});
    } finally {
      setSaving(false);
    }
  };

  const clear = async () => {
    setClearing(true);
    setError('');
    setNotice('');
    try {
      await submit({ clearTelegramBotToken: true });
    } finally {
      setClearing(false);
    }
  };

  if (loading) {
    return <AdminListSkeleton />;
  }

  if (!hasPermission) {
    return (
      <Result
        status="403"
        title="无权访问"
        subTitle="此页面仅限管理员查看。"
        extra={<Button type="primary" onClick={() => router.push('/')}>返回首页</Button>}
      />
    );
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%', maxWidth: 720 }}>
      <div>
        <Title level={3} style={{ marginBottom: 4 }}>客服配置</Title>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          保存 token 不会发送测试消息，也不会设置 webhook。chat_id 绑定仍是单独的流程，只保存 token 不会开始自动回复。
        </Paragraph>
      </div>
      <Card>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Text>
            {configured ? `已配置，仅显示末四位 ${hint ?? ''}` : '尚未配置 Telegram bot token'}
          </Text>
          <form onSubmit={save}>
            <Form layout="vertical" component={false}>
              <Form.Item label="Telegram bot token">
                <Input.Password
                  value={token}
                  autoComplete="new-password"
                  placeholder="留空则保留当前配置"
                  onChange={(event) => setToken(event.target.value)}
                />
              </Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" loading={saving || loading} disabled={clearing}>
                  保存
                </Button>
                <Button danger loading={clearing} disabled={saving || loading || !configured} onClick={() => void clear()}>
                  清除 token
                </Button>
              </Space>
            </Form>
          </form>
          {notice && <Alert type="success" showIcon message={notice} />}
          {error && <Alert type="error" showIcon message={error} />}
        </Space>
      </Card>
    </Space>
  );
}

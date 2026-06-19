'use client';

import { Layout, Menu, Typography, Button, theme } from 'antd';
import {
  FileTextOutlined,
  HomeOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

const menuItems = [
  {
    key: '/admin/questions',
    icon: <FileTextOutlined />,
    label: <Link href="/admin/questions">面试题管理</Link>,
  },
  {
    key: '/admin/videoManage',
    icon: <VideoCameraOutlined />,
    label: <Link href="/admin/videoManage">视频管理</Link>,
  },
  {
    key: '/admin/users',
    icon: <TeamOutlined />,
    label: <Link href="/admin/users">用户管理</Link>,
  },
  {
    key: '/admin/purchaseRequests',
    icon: <ShoppingCartOutlined />,
    label: <Link href="/admin/purchaseRequests">购买咨询</Link>,
  },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { token } = theme.useToken();

  const selectedKey = menuItems.find((item) => pathname.startsWith(item.key))?.key
    ?? '/admin/questions';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        width={220}
        breakpoint="lg"
        collapsedWidth={0}
        style={{
          background: token.colorBgContainer,
          borderRight: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            padding: '0 20px',
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <Title level={5} style={{ margin: 0 }}>
            Zood 后台
          </Title>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          style={{ borderInlineEnd: 0, marginTop: 8 }}
        />
      </Sider>

      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: token.colorBgContainer,
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Text type="secondary">管理后台</Text>
          <Link href="/">
            <Button type="text" icon={<HomeOutlined />}>
              返回站点
            </Button>
          </Link>
        </Header>
        <Content style={{ padding: 24, background: token.colorBgLayout }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}

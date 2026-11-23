import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '登录 | 台屏智联',
  description: '商家管理中心登录',
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
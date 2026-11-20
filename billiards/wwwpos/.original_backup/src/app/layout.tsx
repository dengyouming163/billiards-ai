import type { Metadata } from 'next';
import { Inspector } from 'react-dev-inspector';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: '台球厅收银系统',
    template: '%s | 台球厅收银系统',
  },
  description: '商业台球系统收银端 - 为16:9宽屏收银机优化的专业收银应用',
  keywords: ['台球', '收银', 'POS', '台球厅管理'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        <Inspector />
        {children}
      </body>
    </html>
  );
}

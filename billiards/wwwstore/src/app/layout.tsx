import type { Metadata } from 'next';
import './globals.css';
import { AppProviderWrapper } from '@/components/app-provider-wrapper';

export const metadata: Metadata = {
  title: {
    default: '客稻云 - 球房管理系统',
    template: '%s | 客稻云',
  },
  description: '多商户商业台球球房管理系统，助您高效管理门店经营',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        <AppProviderWrapper>
          {children}
        </AppProviderWrapper>
      </body>
    </html>
  );
}
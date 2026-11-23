import type { Metadata } from 'next';
import './globals.css';
import { AppProviderWrapper } from '@/components/app-provider-wrapper';

export const metadata: Metadata = {
  title: {
    default: 'VenueIQ - 场馆智能运营平台',
    template: '%s | VenueIQ',
  },
  description: '多业态场馆智能运营平台，覆盖台球、KTV、棋牌等场景的门店经营、计费与结算',
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
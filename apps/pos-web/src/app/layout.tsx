import type { Metadata } from 'next';
import { Inspector } from 'react-dev-inspector';
import './globals.css';
import { AppProviderWrapper } from '@/components/app-provider-wrapper';
import { NotificationOverlay } from '@/components/NotificationOverlay';

export const metadata: Metadata = {
  title: {
    default: 'VenueIQ 收银端',
    template: '%s | VenueIQ 收银端',
  },
  description: 'VenueIQ 多业态场馆收银端 - 为16:9宽屏收银机优化的专业收银应用',
  keywords: ['场馆', '收银', 'POS', '台球', 'KTV'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        {process.env.NODE_ENV === 'development' && <Inspector />}
        <AppProviderWrapper>
          {children}
          <NotificationOverlay />
        </AppProviderWrapper>
      </body>
    </html>
  );
}

'use client';

import { usePathname } from 'next/navigation';
import { AuthProvider } from '@/lib/auth-context';
import { AppProvider } from '@/hooks/use-app';
import { AppShell } from '@/components/layout';
import { ToastProvider } from '@/lib/toast-context';

interface AppProviderWrapperProps {
  children: React.ReactNode;
}

export function AppProviderWrapper({ children }: AppProviderWrapperProps) {
  const pathname = usePathname();
  
  // 公开页面列表 - 不需要 AppShell 布局
  const publicPages = ['/login', '/register'];
  const isPublicPage = publicPages.some(page => pathname?.startsWith(page));

  return (
    <AuthProvider>
      <AppProvider>
        <ToastProvider>
          {isPublicPage ? (
            // 公开页面 - 直接渲染，不使用 AppShell
            <>{children}</>
          ) : (
            // 受保护页面 - 使用 AppShell 布局（包含登录验证）
            <AppShell>{children}</AppShell>
          )}
        </ToastProvider>
      </AppProvider>
    </AuthProvider>
  );
}
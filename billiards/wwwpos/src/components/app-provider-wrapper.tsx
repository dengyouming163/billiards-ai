'use client';

import { AuthProvider } from '@/lib/auth-context';

export function AppProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}

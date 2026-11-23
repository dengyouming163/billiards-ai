'use client';

import { AuthProvider } from '@/lib/auth-context';

interface AuthProviderWrapperProps {
  children: React.ReactNode;
}

export function AuthProviderWrapper({ children }: AuthProviderWrapperProps) {
  return <AuthProvider>{children}</AuthProvider>;
}
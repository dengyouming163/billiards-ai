'use client';

import { useState } from 'react';
import { useApp } from '@/hooks/use-app';
import { Search, ChevronDown, LogOut, User, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function Header() {
  const { state } = useApp();
  const { currentStore, stores, user } = state;
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <div className="sticky top-0 z-40">
      {/* This component is kept for compatibility but the actual header is in AppShell */}
    </div>
  );
}

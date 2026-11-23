'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/hooks/use-app';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import { NotificationPanel } from './notification-panel';
import { fetchUnreadCount } from '@/lib/api/header';
import { fetchEmployeePermissions, fetchEmployeeStores } from '@/lib/api/employees';
import { 
  LayoutDashboard,
  Gamepad2,
  Bot,
  Receipt,
  ShoppingCart,
  Users,
  UserCog,
  GraduationCap,
  Package,
  Wallet,
  Settings,
  Bell, 
  HelpCircle, 
  ChevronLeft, 
  ChevronRight,
  Store,
  ChevronDown,
  LogOut,
  User,
  Package2,
  Clock
} from 'lucide-react';
import { ROLE_CONFIG, EmployeeRole } from '@/lib/types';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AppShellProps {
  children: React.ReactNode;
}

interface NavItem {
  icon: typeof LayoutDashboard;
  label: string;
  href: string;
  permission?: string;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: '数据概览', href: '/', permission: 'overview' },
  { icon: Bot, label: 'Agent 运行', href: '/agent', permission: 'overview' },
  { icon: Gamepad2, label: '台桌管理', href: '/tables', permission: 'settings:table' },
  { icon: GraduationCap, label: '助教管理', href: '/assistants', permission: 'assistant:list' },
  { icon: Package2, label: '商品管理', href: '/products', permission: 'settings:product' },
  { icon: ShoppingCart, label: '订单管理', href: '/orders', permission: 'order:list' },
  { icon: Users, label: '会员管理', href: '/members', permission: 'member:list' },
  { icon: Wallet, label: '财务对账', href: '/finance', permission: 'finance:cashflow' },
  { icon: UserCog, label: '员工管理', href: '/employees', permission: 'employee:list' },
  { icon: Settings, label: '系统设置', href: '/settings', permission: 'settings:store' },
];

export function AppShell({ children }: AppShellProps) {
  const { state, toggleSidebar, switchStore } = useApp();
  const { user: authUser, loading: authLoading, isAuthenticated, logout } = useAuth();
  const { sidebarCollapsed, isLoading, currentStore, stores, user } = state;
  const pathname = usePathname();
  const router = useRouter();

  const [showNotification, setShowNotification] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  const [employeeStores, setEmployeeStores] = useState<typeof stores>([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

  useEffect(() => {
    if (currentStore) {
      loadUnreadCount();
      const interval = setInterval(loadUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [currentStore]);

  useEffect(() => {
    if (!currentStore) return;
    const storeId = currentStore.id;
    let cancelled = false;

    const loadPermissions = async (retry = 0) => {
      try {
        const data = await fetchEmployeePermissions(storeId);
        if (!cancelled) {
          setPermissions(new Set(data));
        }
      } catch (error) {
        console.error('Failed to load permissions:', error);
        if (!cancelled && retry < 2) {
          setTimeout(() => loadPermissions(retry + 1), 2000);
        }
      }
    };

    loadPermissions();
    return () => { cancelled = true; };
  }, [currentStore]);

  useEffect(() => {
    if (!currentStore) return;
    const storeId = currentStore.id;
    fetchEmployeeStores(storeId)
      .then((data) => setEmployeeStores(data))
      .catch((error) => console.error('Failed to load employee stores:', error));
  }, [currentStore]);

  const loadUnreadCount = async () => {
    try {
      const result = await fetchUnreadCount();
      setUnreadCount(result.count);
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  };

  const handleUnreadChange = (count: number) => {
    setUnreadCount(count);
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated && pathname !== '/login') {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, pathname, router]);

  if (authLoading || isLoading) {
      return (
        <div className="min-h-screen bg-[#f7f7f7] flex items-center justify-center">
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-[#07C160] to-[#06AD56] rounded-2xl shadow-lg shadow-[#07C160]/30 flex items-center justify-center">
                <Gamepad2 className="w-8 h-8 text-white animate-pulse" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-[#333333] font-medium">加载中...</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className="w-2 h-2 bg-[#07C160] rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-[#07C160] rounded-full animate-bounce delay-100" />
                <span className="w-2 h-2 bg-[#07C160] rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        </div>
      );
    }

  if (!isAuthenticated) {
    return null;
  }

  const filteredNavItems = navItems.filter(
    (item) => !item.permission || permissions.has(item.permission)
  );

  const displayStores = employeeStores.length > 0 ? employeeStores : stores;

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="h-screen overflow-hidden bg-[#f7f7f7] flex flex-col">
      <header className="bg-white border-b border-[#e5e5e5] shadow-sm z-50 flex-shrink-0">
        <div className="flex items-center justify-between h-12 px-4">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="w-9 h-9 bg-gradient-to-br from-[#07C160] to-[#06AD56] rounded-xl shadow-lg shadow-[#07C160]/25 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                <Gamepad2 className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-base font-bold text-black">VenueIQ</h1>
              <p className="text-xs text-[#999999] -mt-0.5">场馆智能运营平台</p>
            </div>
            
            <div className="hidden md:flex items-center gap-3 text-[#333333] border-l border-[#e5e5e5] pl-4">
              <Clock className="w-4 h-4 text-[#07C160]" />
              <div className="text-left">
                <p className="text-sm font-medium">
                  {currentDateTime.getFullYear()}年{currentDateTime.getMonth() + 1}月{currentDateTime.getDate()}日
                </p>
                <p className="text-xs text-[#999999]">
                  {weekDays[currentDateTime.getDay()]} {currentDateTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setShowNotification(!showNotification)}
                className={cn(
                  'relative p-2 rounded-lg transition-all duration-200',
                  unreadCount > 0 
                    ? 'bg-[#FF5252]/10 text-[#FF5252] hover:bg-[#FF5252]/20' 
                    : 'text-[#333333] hover:bg-[#f7f7f7]'
                )}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-[#FF5252] text-white text-xs font-bold rounded-full animate-bounce-soft">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
              {showNotification && (
                <NotificationPanel
                  onClose={() => setShowNotification(false)}
                  onUnreadChange={handleUnreadChange}
                />
              )}
            </div>
            
            <button
              onClick={() => router.push('/support')}
              className="p-2 rounded-lg text-[#333333] hover:bg-[#f7f7f7] transition-all duration-200"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
            
            <div className="w-px h-6 bg-[#e5e5e5] mx-1" />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-[#f7f7f7] transition-all duration-200">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#07C160] to-[#06AD56] flex items-center justify-center shadow-md">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-[#333333]">{user?.name || authUser?.name}</p>
                    <p className="text-xs text-[#999999]">
                      {ROLE_CONFIG[((user?.role || authUser?.role) as EmployeeRole)]?.label || (user?.role || authUser?.role) || '未知角色'}
                    </p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-[#999999]" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 animate-scale-in">
                <Link href="/profile" className="block">
                  <DropdownMenuItem className="cursor-pointer py-2.5 hover:bg-[#f7f7f7] rounded-lg">
                    <User className="w-4 h-4 mr-3 text-[#999999]" />
                    <span className="text-sm text-[#333333]">个人设置</span>
                  </DropdownMenuItem>
                </Link>
                <Link href="/account" className="block">
                  <DropdownMenuItem className="cursor-pointer py-2.5 hover:bg-[#f7f7f7] rounded-lg">
                    <Settings className="w-4 h-4 mr-3 text-[#999999]" />
                    <span className="text-sm text-[#333333]">账号设置</span>
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="cursor-pointer py-2.5 hover:bg-[#FF5252]/10 rounded-lg text-[#FF5252] hover:text-[#FF5252]"
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  <span className="text-sm">退出登录</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="min-h-[60px] py-3 bg-gradient-to-r from-[#fafafa] to-white border-t border-[#e5e5e5]/50 shadow-sm">
          <div className="flex items-center h-full px-4 overflow-hidden">
            <div className="flex items-center gap-2 mr-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-5 py-2.5 rounded-full text-base hover:bg-[#f7f7f7] border border-[#e5e5e5] transition-all duration-300 hover:border-[#07C160]/30 hover:shadow-md">
                    <Store className="w-5 h-5 text-[#07C160]" />
                    <span className="font-semibold text-[#333333]">{currentStore?.name || '选择门店'}</span>
                    <ChevronDown className="w-4 h-4 text-[#999999]" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64 animate-scale-in">
                  <div className="px-3 py-2 text-sm font-medium text-[#999999]">切换门店</div>
                  {displayStores.length === 0 ? (
                    <div className="px-3 py-6 text-center text-sm text-[#999999]">
                      暂无门店权限，请联系管理员
                    </div>
                  ) : (
                    displayStores.map((store) => (
                      <DropdownMenuItem
                        key={store.id}
                        onClick={() => switchStore(store)}
                        className={cn(
                          'flex items-center gap-3 cursor-pointer py-3 px-2 rounded-lg transition-all',
                          currentStore?.id === store.id && 'bg-[#07C160]/10 text-[#07C160]'
                        )}
                      >
                        <div className={cn(
                          'w-8 h-8 rounded-lg flex items-center justify-center',
                          currentStore?.id === store.id ? 'bg-[#07C160]/20' : 'bg-[#f7f7f7]'
                        )}>
                          <Store className={cn(
                            'w-4 h-4',
                            currentStore?.id === store.id ? 'text-[#07C160]' : 'text-[#999999]'
                          )} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{store.name}</div>
                          <div className="text-xs text-[#999999] truncate">{store.address}</div>
                        </div>
                        {currentStore?.id === store.id && (
                          <Badge variant="default" className="bg-[#07C160] text-xs px-2 text-white">当前</Badge>
                        )}
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <div className="w-px h-8 bg-[#e5e5e5]" />
            
            <nav className="flex items-center gap-1.5 ml-8 pl-4 overflow-hidden flex-wrap py-1.5 flex-1">
              {filteredNavItems.length === 0 && (
                <div className="px-4 py-3 text-sm text-[#999999]">
                  暂无可用菜单
                </div>
              )}
              {filteredNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={item.label}
                    className={cn(
                      'flex items-center gap-2.5 px-5 py-2.5 rounded-full text-base font-semibold transition-all duration-300 flex-shrink-0',
                      isActive
                        ? 'bg-gradient-to-r from-[#07C160] to-[#06AD56] text-white shadow-xl shadow-[#07C160]/40 scale-105'
                        : 'text-[#666666] hover:bg-[#f7f7f7] hover:text-[#333333] hover:shadow-md hover:scale-102'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4">
        <div className="rounded-2xl bg-white border border-[#e5e5e5] shadow-sm p-6 min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
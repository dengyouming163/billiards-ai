'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/hooks/use-app';
import { useAuth } from '@/lib/auth-context';
import {
  Settings,
  Building2,
  Clock,
  CreditCard,
  Percent,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/page-header';

import { useToast } from '@/lib/toast-context';
import {
  fetchPaymentSettings,
  savePaymentSettings,
  fetchNotificationSettings,
  saveNotificationSettings,
  fetchSecuritySettings,
  saveSecuritySettings,
  fetchDisplaySettings,
  saveDisplaySettings,
} from '@/lib/api/settings';

import { SettingsStoreTab } from './settings-store-tab';
import { SettingsWechatTab } from './settings-wechat-tab';

import { SettingsBusinessTab } from './settings-business-tab';
import SettingsDiscountTab from './settings-discount-tab';

interface NotificationSettings {
  tableTimeout: boolean;
  lowStock: boolean;
  newOrder: boolean;
  [key: string]: unknown;
}

interface SecuritySettings {
  twoFactor: boolean;
  operationLog: boolean;
  dataBackup: boolean;
  [key: string]: unknown;
}

interface DisplaySettings {
  darkMode: boolean;
  realTimeRefresh: boolean;
  [key: string]: unknown;
}

type TabKey = 'store' | 'business' | 'wechat' | 'discount';

export default function SettingsPage() {
  const { permissionCodes, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && permissionCodes.length > 0 && !permissionCodes.includes('settings:store')) {
      router.replace('/');
    }
  }, [isLoading, permissionCodes]);

  const { state, dispatch } = useApp();
  const { currentStore } = state;
  const { success, warning } = useToast();

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    tableTimeout: true,
    lowStock: true,
    newOrder: true,
  });

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactor: false,
    operationLog: true,
    dataBackup: true,
  });

  const [displaySettings, setDisplaySettings] = useState<DisplaySettings>({
    darkMode: false,
    realTimeRefresh: true,
  });

  const [paymentSettings, setPaymentSettings] = useState({ wechat: true, cash: true, autoChange: true, roundZero: false, receiptPrint: true, receiptCopies: 2 });
  const [settingsSaving, setSettingsSaving] = useState(false);

  const [activeTab, setActiveTab] = useState<TabKey>('store');

  useEffect(() => {
    if (!currentStore?.id) return;
    const loadAllSettings = async () => {
      try {
        const [notif, sec, disp, pay] = await Promise.all([
          fetchNotificationSettings(),
          fetchSecuritySettings(),
          fetchDisplaySettings(),
          fetchPaymentSettings(),
        ]);
        setNotificationSettings(notif);
        setSecuritySettings(sec);
        setDisplaySettings(disp);
        setPaymentSettings(pay);
      } catch (err) {
        console.error('加载设置失败:', err);
      }
    };
    loadAllSettings();
  }, [currentStore?.id]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="系统设置"
        description="管理和配置系统各项参数"
        icon={Settings}
      />

      {/* Tab bar — exact match with employees/page.tsx */}
      <div className="flex flex-wrap gap-2 p-2 bg-[#f7f7f7] backdrop-blur-sm rounded-xl">
        <Button
          variant={activeTab === 'store' ? 'default' : 'ghost'}
          size="sm"
          className={`rounded-full transition-all duration-200 px-4 ${
            activeTab === 'store'
              ? 'bg-gradient-to-r from-[#07C160] to-[#06AD56] text-white shadow-lg shadow-[#07C160]/25 hover:shadow-xl'
              : 'hover:bg-white/80'
          }`}
          onClick={() => setActiveTab('store')}
        >
          <Building2 className="w-4 h-4 mr-2" />
          门店信息
        </Button>
        <Button
          variant={activeTab === 'business' ? 'default' : 'ghost'}
          size="sm"
          className={`rounded-full transition-all duration-200 px-4 ${
            activeTab === 'business'
              ? 'bg-gradient-to-r from-[#07C160] to-[#06AD56] text-white shadow-lg shadow-[#07C160]/25 hover:shadow-xl'
              : 'hover:bg-white/80'
          }`}
          onClick={() => setActiveTab('business')}
        >
          <Clock className="w-4 h-4 mr-2" />
          营业设置
        </Button>
        <Button
          variant={activeTab === 'wechat' ? 'default' : 'ghost'}
          size="sm"
          className={`rounded-full transition-all duration-200 px-4 ${
            activeTab === 'wechat'
              ? 'bg-gradient-to-r from-[#07C160] to-[#06AD56] text-white shadow-lg shadow-[#07C160]/25 hover:shadow-xl'
              : 'hover:bg-white/80'
          }`}
          onClick={() => setActiveTab('wechat')}
        >
          <CreditCard className="w-4 h-4 mr-2" />
          微信支付
        </Button>
        <Button
          variant={activeTab === 'discount' ? 'default' : 'ghost'}
          size="sm"
          className={`rounded-full transition-all duration-200 px-4 ${
            activeTab === 'discount'
              ? 'bg-gradient-to-r from-[#07C160] to-[#06AD56] text-white shadow-lg shadow-[#07C160]/25 hover:shadow-xl'
              : 'hover:bg-white/80'
          }`}
          onClick={() => setActiveTab('discount')}
        >
          <Percent className="w-4 h-4 mr-2" />
          折扣配置
        </Button>
      </div>

      {/* Content container — exact match with employees/page.tsx */}
      <div className="rounded-[24px] border border-[#e5e5e5] bg-white shadow-sm overflow-hidden">
        {activeTab === 'store' && (
          <SettingsStoreTab currentStore={currentStore} dispatch={dispatch} success={success} warning={warning} />
        )}
        {activeTab === 'business' && (
          <SettingsBusinessTab
            settingsSaving={settingsSaving}
            onSave={async () => {
              setSettingsSaving(true);
              try { success('营业设置已保存'); }
              catch { warning('保存失败，请稍后重试'); }
              finally { setSettingsSaving(false); }
            }}
          />
        )}
        {activeTab === 'wechat' && <SettingsWechatTab />}
        {activeTab === 'discount' && (
          <SettingsDiscountTab currentStore={currentStore} success={success} warning={warning} visible={activeTab === 'discount'} />
        )}
      </div>
    </div>
  );
}

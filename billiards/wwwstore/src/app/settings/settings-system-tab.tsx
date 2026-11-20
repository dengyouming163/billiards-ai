'use client';

import { Bell, Shield, Palette, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

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

interface SettingsSystemTabProps {
  notificationSettings: NotificationSettings;
  securitySettings: SecuritySettings;
  displaySettings: DisplaySettings;
  setNotificationSettings: (settings: NotificationSettings) => void;
  setSecuritySettings: (settings: SecuritySettings) => void;
  setDisplaySettings: (settings: DisplaySettings) => void;
  settingsSaving: boolean;
  onSave: () => Promise<void>;
}

export function SettingsSystemTab({
  notificationSettings,
  securitySettings,
  displaySettings,
  setNotificationSettings,
  setSecuritySettings,
  setDisplaySettings,
  settingsSaving,
  onSave,
}: SettingsSystemTabProps) {
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-200">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">通知设置</h2>
              <p className="text-sm text-slate-500">配置系统通知相关参数</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div>
                <p className="text-sm font-medium text-slate-700">超时提醒</p>
                <p className="text-xs text-slate-500">台桌接近结束时发送提醒</p>
              </div>
              <Switch
                checked={notificationSettings.tableTimeout}
                onCheckedChange={(checked) =>
                  setNotificationSettings({ ...notificationSettings, tableTimeout: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div>
                <p className="text-sm font-medium text-slate-700">低库存提醒</p>
                <p className="text-xs text-slate-500">商品库存低于预警值时通知</p>
              </div>
              <Switch
                checked={notificationSettings.lowStock}
                onCheckedChange={(checked) =>
                  setNotificationSettings({ ...notificationSettings, lowStock: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div>
                <p className="text-sm font-medium text-slate-700">新订单提醒</p>
                <p className="text-xs text-slate-500">收到新订单时通知</p>
              </div>
              <Switch
                checked={notificationSettings.newOrder}
                onCheckedChange={(checked) =>
                  setNotificationSettings({ ...notificationSettings, newOrder: checked })
                }
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-200">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">安全设置</h2>
              <p className="text-sm text-slate-500">配置系统安全相关参数</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div>
                <p className="text-sm font-medium text-slate-700">双重验证</p>
                <p className="text-xs text-slate-500">登录时需要手机验证码</p>
              </div>
              <Switch
                checked={securitySettings.twoFactor}
                onCheckedChange={(checked) =>
                  setSecuritySettings({ ...securitySettings, twoFactor: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div>
                <p className="text-sm font-medium text-slate-700">操作日志</p>
                <p className="text-xs text-slate-500">记录所有关键操作</p>
              </div>
              <Switch
                checked={securitySettings.operationLog}
                onCheckedChange={(checked) =>
                  setSecuritySettings({ ...securitySettings, operationLog: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div>
                <p className="text-sm font-medium text-slate-700">数据备份</p>
                <p className="text-xs text-slate-500">每日自动备份数据</p>
              </div>
              <Switch
                checked={securitySettings.dataBackup}
                onCheckedChange={(checked) =>
                  setSecuritySettings({ ...securitySettings, dataBackup: checked })
                }
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-violet-500 shadow-lg shadow-purple-200">
              <Palette className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">显示设置</h2>
              <p className="text-sm text-slate-500">配置系统显示相关参数</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div>
                <p className="text-sm font-medium text-slate-700">深色模式</p>
                <p className="text-xs text-slate-500">使用深色主题</p>
              </div>
              <Switch
                checked={displaySettings.darkMode}
                onCheckedChange={(checked) =>
                  setDisplaySettings({ ...displaySettings, darkMode: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div>
                <p className="text-sm font-medium text-slate-700">实时刷新</p>
                <p className="text-xs text-slate-500">自动刷新台桌状态</p>
              </div>
              <Switch
                checked={displaySettings.realTimeRefresh}
                onCheckedChange={(checked) =>
                  setDisplaySettings({ ...displaySettings, realTimeRefresh: checked })
                }
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg shadow-blue-200">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">区域设置</h2>
              <p className="text-sm text-slate-500">配置地区和语言相关参数</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">时区</label>
              <Select defaultValue="Asia/Shanghai">
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asia/Shanghai">中国标准时间 (UTC+8)</SelectItem>
                  <SelectItem value="Asia/Hong_Kong">香港时间 (UTC+8)</SelectItem>
                  <SelectItem value="Asia/Tokyo">东京时间 (UTC+9)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">货币</label>
              <Select defaultValue="CNY">
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CNY">人民币 (¥)</SelectItem>
                  <SelectItem value="HKD">港币 (HK$)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
      <Button
        onClick={onSave}
        disabled={settingsSaving}
        className="bg-slate-600 hover:bg-slate-700"
      >
        {settingsSaving ? '保存中...' : '保存系统设置'}
      </Button>
    </>
  );
}

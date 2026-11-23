'use client';

import { Button } from '@/components/ui/button';
import { SettingsCard } from './settings-card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SettingsBusinessTabProps {
  settingsSaving: boolean;
  onSave: () => Promise<void>;
}

export function SettingsBusinessTab({
  settingsSaving,
  onSave,
}: SettingsBusinessTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SettingsCard title="营业时间" desc="设置门店的营业时间段">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <span className="text-sm font-medium text-slate-700">每日营业</span>
              <span className="text-sm text-slate-500">09:00 - 02:00</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">开始时间</Label>
                <Input type="time" defaultValue="09:00" className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">结束时间</Label>
                <Input type="time" defaultValue="02:00" className="rounded-xl" />
              </div>
            </div>
            <div className="pt-4 border-t border-slate-100">
              <Button
                onClick={onSave}
                disabled={settingsSaving}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {settingsSaving ? '保存中...' : '保存营业设置'}
              </Button>
            </div>
          </div>
        </SettingsCard>
      </div>
    </div>
  );
}

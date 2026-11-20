'use client';

import { CreditCard, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

interface SettingsPaymentTabProps {
  paymentSettings: {
    wechat: boolean;
    alipay: boolean;
    cash: boolean;
    member: boolean;
    autoChange: boolean;
    roundZero: boolean;
    receiptPrint: boolean;
    receiptCopies: number;
  };
  setPaymentSettings: (settings: SettingsPaymentTabProps['paymentSettings']) => void;
  settingsSaving: boolean;
  onSave: () => Promise<void>;
}

export function SettingsPaymentTab({
  paymentSettings,
  setPaymentSettings,
  settingsSaving,
  onSave,
}: SettingsPaymentTabProps) {
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg shadow-green-200">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">支付方式</h2>
              <p className="text-sm text-slate-500">配置支持的支付方式</p>
            </div>
          </div>
          <div className="space-y-4">
            {[
              { key: 'wechat', label: '微信支付', desc: '开启后支持微信支付' },
              { key: 'cash', label: '现金支付', desc: '开启后支持现金支付' },
            ].map((pm) => (
              <div key={pm.key} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-slate-700">{pm.label}</p>
                  <p className="text-xs text-slate-500">{pm.desc}</p>
                </div>
                <Switch
                  checked={paymentSettings[pm.key as keyof typeof paymentSettings] as boolean}
                  onCheckedChange={(v) => setPaymentSettings({ ...paymentSettings, [pm.key]: v })}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 shadow-lg shadow-indigo-200">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">收款设置</h2>
              <p className="text-sm text-slate-500">配置收款相关参数</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium text-slate-700">自动找零</p><p className="text-xs text-slate-500">结账时自动计算找零金额</p></div>
              <Switch checked={paymentSettings.autoChange} onCheckedChange={(v) => setPaymentSettings({ ...paymentSettings, autoChange: v })} />
            </div>
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium text-slate-700">整元抹零</p><p className="text-xs text-slate-500">分以下金额自动抹零</p></div>
              <Switch checked={paymentSettings.roundZero} onCheckedChange={(v) => setPaymentSettings({ ...paymentSettings, roundZero: v })} />
            </div>
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium text-slate-700">消费小票打印</p><p className="text-xs text-slate-500">结账后自动打印小票</p></div>
              <Switch checked={paymentSettings.receiptPrint} onCheckedChange={(v) => setPaymentSettings({ ...paymentSettings, receiptPrint: v })} />
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <div><p className="text-sm font-medium text-slate-700">小票联数</p><p className="text-xs text-slate-500">打印小票的份数</p></div>
              <Select value={String(paymentSettings.receiptCopies)} onValueChange={(v) => setPaymentSettings({ ...paymentSettings, receiptCopies: Number(v) })}>
                <SelectTrigger className="w-24 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="1">1联</SelectItem><SelectItem value="2">2联</SelectItem><SelectItem value="3">3联</SelectItem></SelectContent>
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
        {settingsSaving ? '保存中...' : '保存支付设置'}
      </Button>
    </>
  );
}

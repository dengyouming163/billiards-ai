'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { fetchApplymentStatus, type ApplymentStatus } from '@/lib/api/wechat-applyment';
import { APPLYMENT_STATE } from '@/lib/constants/wechat-applyment';
import { ApplyForm } from './wechat-pay/apply-form';
import { StatusViews } from './wechat-pay/status-views';
import { Button } from '@/components/ui/button';
import { SettingsCard } from './settings-card';

type View =
  | 'loading'
  | 'empty'
  | 'apply'
  | 'editting'
  | 'auditing'
  | 'rejected'
  | 'signing'
  | 'finished';

function getView(status: ApplymentStatus | null, isApplying: boolean): View {
  if (!status) return 'loading';
  if (isApplying) return 'apply';
  if (!status.has_applyment) return 'empty';
  const s = status.applyment!.applyment_state;
  if (s === APPLYMENT_STATE.EDITTING || s === APPLYMENT_STATE.CANCELED) return 'editting';
  if (s === APPLYMENT_STATE.AUDITING) return 'auditing';
  if (s === APPLYMENT_STATE.REJECTED) return 'rejected';
  if (s === APPLYMENT_STATE.TO_BE_SIGNED || s === APPLYMENT_STATE.SIGNING) return 'signing';
  if (s === APPLYMENT_STATE.FINISHED) return 'finished';
  return 'empty';
}

export function SettingsWechatTab() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<ApplymentStatus | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  const loadStatus = async () => {
    setLoading(true);
    try {
      setStatus(await fetchApplymentStatus());
    } catch {
      // 静默失败
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const view = getView(status, isApplying);

  // 加载中
  if (view === 'loading') {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  // 无进件 → 引导申请
  if (view === 'empty') {
    return (
      <SettingsCard title="微信支付" desc="配置微信支付参数">
        <div className="text-center py-12">
          <p className="text-6xl mb-4">📋</p>
          <p className="text-lg font-semibold text-slate-700 mb-2">
            暂未申请微信支付
          </p>
          <p className="text-sm text-slate-400 mb-6">
            申请成为微信支付特约商户后，即可使用微信收款功能
          </p>
          <Button
            onClick={() => setIsApplying(true)}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            立即申请
          </Button>
        </div>
      </SettingsCard>
    );
  }

  // 进件表单（新建或编辑/驳回后重新申请）
  if (view === 'apply' || view === 'editting') {
    return (
      <ApplyForm
        initialData={
          view === 'editting' && status?.applyment ? status.applyment : undefined
        }
        onSuccess={() => {
          setIsApplying(false);
          loadStatus();
        }}
        onCancel={() => setIsApplying(false)}
      />
    );
  }

  // 其他状态 → 状态视图
  return (
    <StatusViews
      status={status!}
      onRefresh={loadStatus}
      onReapply={() => setIsApplying(true)}
    />
  );
}

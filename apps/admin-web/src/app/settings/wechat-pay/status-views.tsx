'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle, XCircle, Clock, FileText } from 'lucide-react';
import { syncApplymentStatus, fetchSignUrl, type ApplymentStatus } from '@/lib/api/wechat-applyment';
import { APPLYMENT_STATE } from '@/lib/constants/wechat-applyment';
import { toast } from 'sonner';

const STATE_CFG: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  [APPLYMENT_STATE.AUDITING]: { label: '审核中', color: 'bg-amber-100 text-amber-700', icon: Clock },
  [APPLYMENT_STATE.REJECTED]: { label: '已驳回', color: 'bg-red-100 text-red-700', icon: XCircle },
  [APPLYMENT_STATE.TO_BE_SIGNED]: { label: '待签约', color: 'bg-blue-100 text-blue-700', icon: FileText },
  [APPLYMENT_STATE.SIGNING]: { label: '签约中', color: 'bg-blue-100 text-blue-700', icon: Clock },
  [APPLYMENT_STATE.FINISHED]: { label: '已完成', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
};

type Props = {
  status: ApplymentStatus;
  onRefresh: () => void;
  onReapply: () => void;
};

export function StatusViews({ status, onRefresh, onReapply }: Props) {
  const a = status.applyment!;
  const cfg = STATE_CFG[a.applyment_state] || STATE_CFG[APPLYMENT_STATE.AUDITING];
  const Icon = cfg.icon;
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncApplymentStatus();
      toast.success('状态已同步');
      onRefresh();
    } catch (e: any) {
      toast.error(e?.message || '同步失败');
    } finally {
      setSyncing(false);
    }
  };

  const handleGetSignUrl = async () => {
    try {
      const res = await fetchSignUrl();
      if (res.sign_url) {
        window.open(res.sign_url, '_blank');
      }
    } catch (e: any) {
      toast.error(e?.message || '获取签约链接失败');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>微信支付</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 状态标识 */}
        <div className="text-center py-6">
          <Badge className={`px-4 py-2 text-lg ${cfg.color}`}>
            <Icon className="w-5 h-5 mr-2 inline" />
            {cfg.label}
          </Badge>
          {a.applyment_id && (
            <p className="text-sm text-slate-400 mt-3">
              申请单号: {a.applyment_id}
            </p>
          )}
          {a.business_code && (
            <p className="text-xs text-slate-400 mt-1">
              业务编号: {a.business_code}
            </p>
          )}
        </div>

        {/* 驳回原因 */}
        {(() => { const ad = typeof a.audit_detail === 'string' ? JSON.parse(a.audit_detail) : a.audit_detail; return ad && Array.isArray(ad) && ad.length > 0; })() && (
          <div className="bg-red-50 rounded-xl p-4 space-y-3">
            <p className="text-sm font-semibold text-red-700">驳回原因</p>
            {(typeof a.audit_detail === 'string' ? JSON.parse(a.audit_detail) : a.audit_detail).map((d: any, i: number) => (
              <div key={i} className="text-sm text-red-600 bg-white/50 rounded-lg p-3">
                <span className="font-medium">{d.field_name}</span>
                <br />
                <span className="text-xs">{d.reject_reason}</span>
              </div>
            ))}
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-3">
          {a.applyment_state !== APPLYMENT_STATE.FINISHED && (
            <Button
              onClick={handleSync}
              disabled={syncing}
              variant="outline"
              className="flex-1"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              同步状态
            </Button>
          )}
          {a.applyment_state === APPLYMENT_STATE.REJECTED && (
            <Button
              onClick={onReapply}
              className="flex-1 bg-amber-600 hover:bg-amber-700"
            >
              重新申请
            </Button>
          )}
          {(a.applyment_state === APPLYMENT_STATE.TO_BE_SIGNED ||
            a.applyment_state === APPLYMENT_STATE.SIGNING) && (
            <Button
              onClick={handleGetSignUrl}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              立即签约
            </Button>
          )}
        </div>

        {/* 已完成信息 */}
        {a.applyment_state === APPLYMENT_STATE.FINISHED && a.sub_mchid && (
          <div className="border-t pt-6">
            <div className="flex items-center gap-2 text-emerald-600 mb-4">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold">进件已完成</span>
            </div>
            <div className="space-y-1 text-sm">
              <div>
                <span className="text-slate-400">特约商户号：</span>
                <span className="font-mono font-bold text-slate-800">
                  {a.sub_mchid}
                </span>
              </div>
              {a.sub_mchname && (
                <div>
                  <span className="text-slate-400">商户名称：</span>
                  <span>{a.sub_mchname}</span>
                </div>
              )}
              {a.created_at && (
                <div>
                  <span className="text-slate-400">申请时间：</span>
                  <span>{a.created_at}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

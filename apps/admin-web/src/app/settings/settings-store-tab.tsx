'use client';

import { useState, useCallback, useEffect } from 'react';
import { Store } from '@/lib/types';
import {
  Building2,
  Phone,
  MapPin,
  Clock,
  Shield,
  Edit,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { SettingsCard } from './settings-card';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { updateStore as updateStoreApi } from '@/lib/api/stores';

interface SettingsStoreTabProps {
  currentStore: Store | null;
  dispatch: React.Dispatch<{ type: 'SET_CURRENT_STORE'; payload: Store | null }>;
  success: (msg: string) => void;
  warning: (msg: string) => void;
}

export function SettingsStoreTab({ currentStore, dispatch, success, warning }: SettingsStoreTabProps) {
  const [editStoreOpen, setEditStoreOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [storeForm, setStoreForm] = useState({
    name: currentStore?.name || '',
    address: currentStore?.address || '',
    phone: currentStore?.phone || '',
    status: (currentStore?.status || 'active') as 'active' | 'inactive',
    openTime: currentStore?.businessHours?.start || '09:00',
    closeTime: currentStore?.businessHours?.end || '02:00',
  });

  const [openTableConfirm, setOpenTableConfirm] = useState(!!currentStore?.open_table_confirm && currentStore.open_table_confirm != 0);
  const [confirmTimeout, setConfirmTimeout] = useState(Number(currentStore?.open_table_confirm_timeout) || 1);
  const [productTimeout, setProductTimeout] = useState(Number(currentStore?.product_order_timeout) || 5);
  const [assistantTimeout, setAssistantTimeout] = useState(Number(currentStore?.assistant_booking_timeout) || 5);
  const [chargingRate, setChargingRate] = useState(Number(currentStore?.charging_rate) || 5);

  // 当 currentStore 从父组件更新时同步本地状态 (API 返回字符串需转换)
  useEffect(() => {
    setOpenTableConfirm(!!currentStore?.open_table_confirm && currentStore.open_table_confirm != 0);
  }, [currentStore?.open_table_confirm]);

  useEffect(() => {
    setConfirmTimeout(Number(currentStore?.open_table_confirm_timeout) || 1);
  }, [currentStore?.open_table_confirm_timeout]);
  useEffect(() => {
    setProductTimeout(Number(currentStore?.product_order_timeout) || 5);
  }, [currentStore?.product_order_timeout]);
  useEffect(() => {
    setAssistantTimeout(Number(currentStore?.assistant_booking_timeout) || 5);
  }, [currentStore?.assistant_booking_timeout]);
  useEffect(() => {
    setChargingRate(Number(currentStore?.charging_rate) || 5);
  }, [currentStore?.charging_rate]);

  const handleOpenTableConfirmChange = useCallback(async (value: boolean) => {
    if (!currentStore?.id) return;
    setOpenTableConfirm(value);
    try {
      const updated = await updateStoreApi(currentStore.id, { open_table_confirm: value ? 1 : 0 });
      dispatch({ type: 'SET_CURRENT_STORE', payload: updated });
    } catch {
      setOpenTableConfirm(!value);
      warning('开台确认设置保存失败，请稍后重试');
    }
  }, [currentStore?.id, warning, dispatch]);

  const handleConfirmTimeoutChange = useCallback(async (minutes: number) => {
    if (!currentStore?.id) return;
    const val = Math.max(1, Math.min(30, minutes || 1));
    setConfirmTimeout(val);
    try {
      const updated = await updateStoreApi(currentStore.id, { open_table_confirm_timeout: val });
      dispatch({ type: 'SET_CURRENT_STORE', payload: updated });
    } catch {
      setConfirmTimeout(Number(currentStore?.open_table_confirm_timeout) || 1);
      warning('超时时间保存失败');
    }
  }, [currentStore?.id, warning, dispatch]);

  const handleProductTimeoutChange = useCallback(async (minutes: number) => {
    if (!currentStore?.id) return;
    const val = Math.max(1, Math.min(30, minutes || 5));
    setProductTimeout(val);
    try {
      const updated = await updateStoreApi(currentStore.id, { product_order_timeout: val });
      dispatch({ type: 'SET_CURRENT_STORE', payload: updated });
    } catch {
      setProductTimeout(Number(currentStore?.product_order_timeout) || 5);
      warning('商品点单时限保存失败');
    }
  }, [currentStore?.id, warning, dispatch]);

  const handleAssistantTimeoutChange = useCallback(async (minutes: number) => {
    if (!currentStore?.id) return;
    const val = Math.max(1, Math.min(30, minutes || 5));
    setAssistantTimeout(val);
    try {
      const updated = await updateStoreApi(currentStore.id, { assistant_booking_timeout: val });
      dispatch({ type: 'SET_CURRENT_STORE', payload: updated });
    } catch {
      setAssistantTimeout(Number(currentStore?.assistant_booking_timeout) || 5);
      warning('助教上桌时限保存失败');
    }
  }, [currentStore?.id, warning, dispatch]);

  const handleChargingRateChange = useCallback(async (rate: number) => {
    if (!currentStore?.id) return;
    const val = Math.max(0, Math.min(999, rate || 5));
    setChargingRate(val);
    try {
      const updated = await updateStoreApi(currentStore.id, { charging_rate: val });
      dispatch({ type: 'SET_CURRENT_STORE', payload: updated });
    } catch {
      setChargingRate(Number(currentStore?.charging_rate) || 5);
      warning('充电费率保存失败');
    }
  }, [currentStore?.id, warning, dispatch]);

  const handleSaveStore = async () => {
    if (!currentStore?.id) return;
    setIsSaving(true);
    try {
      const updatedStore = await updateStoreApi(currentStore.id, {
        name: storeForm.name,
        address: storeForm.address,
        phone: storeForm.phone,
        status: storeForm.status,
        business_hours_start: storeForm.openTime,
        business_hours_end: storeForm.closeTime,
      });
      dispatch({ type: 'SET_CURRENT_STORE', payload: updatedStore });
      setEditStoreOpen(false);
    } catch (err) {
      console.error('保存门店信息失败:', err);
      warning('保存门店信息失败，请稍后重试');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <SettingsCard
        title="门店信息"
        desc="管理门店基础信息"
        actions={
          <Button
            onClick={() => setEditStoreOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Edit className="w-4 h-4 mr-2" />
            编辑信息
          </Button>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-blue-50">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">门店名称</p>
                <p className="text-base font-medium text-slate-900">{currentStore?.name}</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-emerald-50">
                <Phone className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">联系电话</p>
                <p className="text-base font-medium text-slate-900">{currentStore?.phone}</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-purple-50">
                <MapPin className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">门店地址</p>
                <p className="text-base font-medium text-slate-900">{currentStore?.address}</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-amber-50">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">营业时间</p>
                <p className="text-base font-medium text-slate-900">
                  {currentStore?.businessHours?.start} - {currentStore?.businessHours?.end}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-teal-50">
                <Shield className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">营业状态</p>
                <p className="text-base font-medium">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    currentStore?.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {currentStore?.status === 'active' ? '营业中' : '休息中'}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* 开台确认开关 */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700">开台需收银端确认</p>
                <p className="text-xs text-slate-400 mt-1">开启后顾客扫码开台需收银端确认才生效</p>
              </div>
              <button
                onClick={() => handleOpenTableConfirmChange(!openTableConfirm)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  openTableConfirm ? 'bg-emerald-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    openTableConfirm ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            {openTableConfirm && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-600">收银端处理时限</span>
                  <input type="number" min={1} max={30} value={confirmTimeout}
                    onChange={(e) => handleConfirmTimeoutChange(parseInt(e.target.value) || 1)}
                    className="w-20 px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-center" />
                  <span className="text-sm text-slate-400">分钟</span>
                  <span className="text-xs text-slate-400">超时后无法操作</span>
                </div>
              </div>
            )}
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-600">商品点单处理时限</span>
                <input type="number" min={1} max={30} value={productTimeout}
                  onChange={(e) => handleProductTimeoutChange(parseInt(e.target.value) || 5)}
                  className="w-20 px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-center" />
                <span className="text-sm text-slate-400">分钟</span>
                <span className="text-xs text-slate-400">超时后无法点单</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-600">助教上桌处理时限</span>
                <input type="number" min={1} max={30} value={assistantTimeout}
                  onChange={(e) => handleAssistantTimeoutChange(parseInt(e.target.value) || 5)}
                  className="w-20 px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-center" />
                <span className="text-sm text-slate-400">分钟</span>
                <span className="text-xs text-slate-400">超时后无法安排上桌</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-600">充电计费单价</span>
                <input type="number" min={0} max={999} value={chargingRate}
                  onChange={(e) => handleChargingRateChange(parseFloat(e.target.value) || 5)}
                  className="w-20 px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-center" />
                <span className="text-sm text-slate-400">元/半小时</span>
              </div>
            </div>
          </div>
      </SettingsCard>

      <Dialog open={editStoreOpen} onOpenChange={setEditStoreOpen}>
        <DialogContent className="bg-white rounded-2xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              编辑门店信息
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              修改门店的基本信息，包括名称、地址、联系方式等
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="storeName" className="text-slate-700">门店名称</Label>
              <Input
                id="storeName"
                value={storeForm.name}
                onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })}
                className="rounded-xl"
                placeholder="请输入门店名称"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="storeAddress" className="text-slate-700">门店地址</Label>
              <Input
                id="storeAddress"
                value={storeForm.address}
                onChange={(e) => setStoreForm({ ...storeForm, address: e.target.value })}
                className="rounded-xl"
                placeholder="请输入门店地址"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="storePhone" className="text-slate-700">联系电话</Label>
              <Input
                id="storePhone"
                value={storeForm.phone}
                onChange={(e) => setStoreForm({ ...storeForm, phone: e.target.value })}
                className="rounded-xl"
                placeholder="请输入联系电话"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="storeStatus" className="text-slate-700">营业状态</Label>
              <Select
                value={storeForm.status}
                onValueChange={(value: 'active' | 'inactive') => setStoreForm({ ...storeForm, status: value })}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">营业中</SelectItem>
                  <SelectItem value="inactive">休息中</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="openTime" className="text-slate-700">开始营业时间</Label>
                <Input
                  id="openTime"
                  type="time"
                  value={storeForm.openTime}
                  onChange={(e) => setStoreForm({ ...storeForm, openTime: e.target.value })}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="closeTime" className="text-slate-700">结束营业时间</Label>
                <Input
                  id="closeTime"
                  type="time"
                  value={storeForm.closeTime}
                  onChange={(e) => setStoreForm({ ...storeForm, closeTime: e.target.value })}
                  className="rounded-xl"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setEditStoreOpen(false)}
              className="rounded-xl"
            >
              取消
            </Button>
            <Button
              onClick={handleSaveStore}
              disabled={isSaving}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700"
            >
              {isSaving ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

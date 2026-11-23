'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { orderApi } from '@/lib/api/pos';
import { ModalShell } from '@/components/ModalShell';
import { Button } from '@/components/ui/button';
import type { Table, Session, Order } from '@/types';
import { ArrowRightLeft, Merge, Check, Users, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface TransferMergeModalProps {
  table: Table; onClose: () => void; mode: 'transfer' | 'merge';
  onSuccess?: () => void; onComplete?: () => void; orderId?: string;
}

export function TransferMergeModal({ table, onClose, mode, onSuccess, onComplete, orderId: propOrderId }: TransferMergeModalProps) {
  const { state, dispatch } = useApp();
  const { tables, orders } = state;
  const [selectedTargetTable, setSelectedTargetTable] = useState<string>('');
  const [selectedMergeTable, setSelectedMergeTable] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [orderId, setOrderId] = useState<string>('');
  const [successState, setSuccessState] = useState<{ type: string; targetName: string } | null>(null);

  useEffect(() => { const interval = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(interval); }, []);

  useEffect(() => {
    if (propOrderId) { setOrderId(propOrderId); return; }
    const fetchOrder = async () => {
      if (table.status !== 'occupied') return;
      try { const data = await orderApi.getCurrentOrder(table.id) as Record<string, unknown>; if (data?.id) setOrderId(data.id as string); } catch { /* silent */ }
    };
    fetchOrder();
  }, [table.id, table.status, propOrderId]);

  const currentSession = table.currentSession;
  const tableOrders = orders.filter((o) => o.tableId === table.id && o.status !== 'cancelled');
  const idleTables = tables.filter((t) => t.id !== table.id && t.status === 'idle');
  const inUseTables = tables.filter((t) => t.id !== table.id && t.status === 'occupied');
  const isTransfer = mode === 'transfer';
  const availableTables = isTransfer ? idleTables : inUseTables;
  const selectedTable = isTransfer ? selectedTargetTable : selectedMergeTable;
  const setSelectedTable = isTransfer ? setSelectedTargetTable : setSelectedMergeTable;

  const currentTableStats = (() => {
    if (!currentSession) return null;
    const duration = (now - new Date(currentSession.startTime).getTime()) / 3600000;
    const tableFee = duration * table.hourlyRate;
    const productFee = tableOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    return { duration, hours: Math.floor(duration), minutes: Math.floor((duration % 1) * 60),
      tableFee: Math.round(tableFee * 100) / 100, productFee,
      total: Math.round((tableFee + productFee) * 100) / 100,
      customerCount: currentSession.customerCount, assistantName: currentSession.assistantName || '无助教' };
  })();

  const handleConfirm = async () => {
    if (!orderId) return;
    setIsProcessing(true);
    try {
      if (isTransfer) {
        if (selectedTargetTable) {
          await orderApi.changeTable({ order_id: orderId, target_table_id: selectedTargetTable });
          dispatch({ type: 'TRANSFER_TABLE', payload: { fromTableId: table.id, toTableId: selectedTargetTable } });
          const target = tables.find((t) => t.id === selectedTargetTable);
          setSuccessState({ type: mode, targetName: target?.name ?? '' });
        }
      } else {
        if (selectedMergeTable) {
          const sourceOrderData = await orderApi.getCurrentOrder(selectedMergeTable) as Record<string, unknown>;
          if (sourceOrderData?.id) {
            await orderApi.merge({ source_order_id: sourceOrderData.id as string, target_order_id: orderId });
            dispatch({ type: 'MERGE_TABLES', payload: { sourceTableId: selectedMergeTable, targetTableId: table.id } });
            const target = tables.find((t) => t.id === selectedMergeTable);
            setSuccessState({ type: mode, targetName: target?.name ?? '' });
          }
        }
      }
    } catch (err) { console.error(`${isTransfer ? 'Transfer' : 'Merge'} failed:`, err); }
    finally { setIsProcessing(false); }
  };

  const title = isTransfer ? '换台' : '并台';
  const TitleIcon = isTransfer ? ArrowRightLeft : Merge;

  if (successState) {
    return (
      <ModalShell onClose={onClose} title={successState.type === 'transfer' ? '换台成功' : '并台成功'} icon={<CheckCircle2 className="w-5 h-5" />}>
        <div className="flex flex-col items-center justify-center py-8">
          <p className="text-sm text-gray-500 text-center mb-6 max-w-[280px]">
            {successState.type === 'transfer' ? `源桌台已释放，目标桌台已更换为台球桌 ${successState.targetName}` : '两桌消费已合并，源桌台已关闭，所有订单已转移'}
          </p>
          <Button onClick={() => { onSuccess?.(); onComplete?.(); }}
            className="w-40 h-11 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">确定</Button>
        </div>
      </ModalShell>
    );
  }

  return (
    <ModalShell onClose={onClose} title={title} icon={<TitleIcon className="w-5 h-5" />}
      footer={
        <div className="flex gap-3 w-full">
          <Button onClick={onClose} variant="outline" className="flex-1 h-11 rounded-xl">取消</Button>
          <Button onClick={handleConfirm} disabled={!selectedTable || !orderId || isProcessing}
            className={`flex-1 h-11 rounded-xl text-white border-0 ${isTransfer ? 'bg-gradient-to-r from-blue-500 to-indigo-500' : 'bg-gradient-to-r from-purple-500 to-pink-500'}`}>
            {isProcessing ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2 inline" />}
            {isTransfer ? '确认换台' : '确认并台'}
          </Button>
        </div>
      }
    >
      {/* Source Table Info */}
      <div className="bg-gray-50 rounded-xl p-4 mb-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-500">{isTransfer ? '当前桌台' : '合并桌台'}</span>
          <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-white text-xs font-medium">桌{table.name}</span>
        </div>
        {currentTableStats ? (
          <div className="grid grid-cols-4 gap-3">
            <div className="text-center"><div className="text-lg font-bold text-emerald-600">{currentTableStats.hours}h{currentTableStats.minutes}m</div><div className="text-xs text-gray-400">时长</div></div>
            <div className="text-center"><div className="text-lg font-bold text-emerald-600">{currentTableStats.customerCount}</div><div className="text-xs text-gray-400">人数</div></div>
            <div className="text-center"><div className="text-lg font-bold text-emerald-600">¥{currentTableStats.tableFee}</div><div className="text-xs text-gray-400">台费</div></div>
            <div className="text-center"><div className="text-lg font-bold text-emerald-600">¥{currentTableStats.total}</div><div className="text-xs text-gray-400">合计</div></div>
          </div>
        ) : <div className="text-center py-3 text-gray-400">无进行中的计时</div>}
      </div>

      {/* Target Selection */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium">选择{isTransfer ? '目标桌台' : '合并到的桌台'}</span>
          <span className="text-xs text-gray-400">{availableTables.length}个可用</span>
        </div>
        {availableTables.length > 0 ? (
          <div className="grid grid-cols-4 gap-2">
            {availableTables.map((t) => {
              const tOrders = orders.filter((o) => o.tableId === t.id && o.status !== 'cancelled');
              const tTotal = tOrders.reduce((sum, o) => sum + o.totalAmount, 0);
              const isSelected = selectedTable === t.id;
              return (
                <button key={t.id} onClick={() => setSelectedTable(t.id)}
                  className={`relative p-3 rounded-xl border-2 text-left transition-all ${isSelected ? 'border-emerald-500 bg-emerald-50 shadow-lg' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                  {isSelected && <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg"><Check className="w-3 h-3 text-white" /></div>}
                  <div className="text-center"><div className="text-lg font-bold mb-1">桌{t.name}</div>
                    {t.status === 'occupied' && t.currentSession && (<><div className="flex items-center justify-center gap-1 text-xs text-gray-400 mb-1"><Users className="w-3 h-3" /><span>{t.currentSession.customerCount}人</span></div><div className="text-xs font-medium text-blue-600">¥{t.currentSession.tableFee + tTotal}</div></>)}
                    {t.status === 'idle' && <div className="text-xs text-gray-400">空闲</div>}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10 bg-gray-50 rounded-xl"><AlertTriangle className="w-10 h-10 mx-auto mb-2 text-amber-500" /><p className="text-sm text-gray-400">{isTransfer ? '暂无可用的空闲桌台' : '没有其他使用中的桌台'}</p></div>
        )}
      </div>

      {selectedTable && (
        <div className={`p-3 rounded-xl border ${isTransfer ? 'bg-blue-50 border-blue-200' : 'bg-amber-50 border-amber-200'}`}>
          <div className="flex items-start gap-2"><AlertTriangle className={`w-4 h-4 mt-0.5 ${isTransfer ? 'text-blue-500' : 'text-amber-500'}`} />
            <p className={`text-sm ${isTransfer ? 'text-blue-600' : 'text-amber-600'}`}>{isTransfer ? '换台后计时将转移到新桌台，原桌台变为空闲。' : '并台后两桌消费将合并，源桌台自动关闭，所有订单转移。'}</p>
          </div>
        </div>
      )}
    </ModalShell>
  );
}

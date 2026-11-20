'use client';

import { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import type { Table, Session, Order } from '@/types';
import {
  X,
  ArrowRightLeft,
  Merge,
  Check,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

interface TransferMergeModalProps {
  table: Table;
  onClose: () => void;
  mode: 'transfer' | 'merge';
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  idle: { label: '空闲', color: 'var(--color-status-idle)' },
  inuse: { label: '使用中', color: 'var(--color-status-inuse)' },
  reserved: { label: '预约', color: 'var(--color-status-reserved)' },
  cleaning: { label: '清洁中', color: 'var(--color-status-cleaning)' },
};

export function TransferMergeModal({
  table,
  onClose,
  mode,
}: TransferMergeModalProps) {
  const { state, dispatch } = useApp();
  const { tables, orders } = state;

  const [selectedTargetTable, setSelectedTargetTable] = useState<string>('');
  const [selectedMergeTable, setSelectedMergeTable] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'select' | 'confirm'>('select');
  const [now, setNow] = useState(() => Date.now());

  // Update time every second for live calculations
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Get current session and orders for this table
  const currentSession = table.currentSession;
  const tableOrders = orders.filter(
    (o) => o.tableId === table.id && o.status !== 'cancelled'
  );

  // Transfer: select an idle table
  const idleTables = tables.filter(
    (t) => t.id !== table.id && t.status === 'idle'
  );

  // Merge: select another in-use table
  const inUseTables = tables.filter(
    (t) => t.id !== table.id && t.status === 'inuse'
  );

  const isTransfer = mode === 'transfer';
  const availableTables = isTransfer ? idleTables : inUseTables;
  const selectedTable = isTransfer ? selectedTargetTable : selectedMergeTable;
  const setSelectedTable = isTransfer
    ? setSelectedTargetTable
    : setSelectedMergeTable;

  const targetTable = tables.find((t) => t.id === selectedTable);

  // Calculate merge preview data
  const mergePreview = useMemo(() => {
    if (!isTransfer || !targetTable || !currentSession) return null;

    // Merge scenario: calculate combined data
    if (!isTransfer && targetTable?.currentSession) {
      const sourceSession = currentSession;
      const targetSession = targetTable.currentSession;
      const sourceOrders = tableOrders;
      const targetOrders = orders.filter(
        (o) => o.tableId === targetTable.id && o.status !== 'cancelled'
      );

      const combinedCustomerCount =
        sourceSession.customerCount + targetSession.customerCount;

      // Calculate combined fee (source table fee based on duration)
      const sourceDuration =
        (now - new Date(sourceSession.startTime).getTime()) / 3600000;
      const sourceTableFee =
        sourceDuration * table.hourlyRate +
        (sourceSession.pricingType === 'perGame'
          ? Math.floor(sourceDuration) * 5
          : 0);

      const combinedTableFee = sourceTableFee + (targetSession.tableFee || 0);
      const combinedProductFee =
        sourceOrders.reduce((sum, o) => sum + o.totalAmount, 0) +
        targetOrders.reduce((sum, o) => sum + o.totalAmount, 0);

      return {
        customerCount: combinedCustomerCount,
        tableFee: combinedTableFee,
        productFee: combinedProductFee,
        total: combinedTableFee + combinedProductFee,
      };
    }
    return null;
  }, [isTransfer, targetTable, currentSession, tableOrders, orders, table]);

  // Calculate current table stats
  const currentTableStats = useMemo(() => {
    if (!currentSession) return null;

    const duration =
      (now - new Date(currentSession.startTime).getTime()) / 3600000;
    const tableFee =
      duration * table.hourlyRate +
      (currentSession.pricingType === 'perGame' ? Math.floor(duration) * 5 : 0);

    const productFee = tableOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    return {
      duration,
      hours: Math.floor(duration),
      minutes: Math.floor((duration % 1) * 60),
      tableFee: Math.round(tableFee * 100) / 100,
      productFee,
      total: Math.round((tableFee + productFee) * 100) / 100,
      customerCount: currentSession.customerCount,
      assistantName: currentSession.assistantName || '无助教',
    };
  }, [currentSession, table, tableOrders]);

  const handleConfirm = async () => {
    setIsProcessing(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (isTransfer) {
      // Transfer: move session to target table
      if (targetTable && currentSession) {
        dispatch({
          type: 'UPDATE_TABLE',
          payload: {
            ...targetTable,
            status: 'inuse',
            currentSession: {
              ...currentSession,
              tableId: targetTable.id,
            },
          },
        });
      }

      // Close current table (session already moved)
      dispatch({
        type: 'UPDATE_TABLE',
        payload: {
          ...table,
          status: 'idle',
          currentSession: undefined,
        },
      });
    } else {
      // Merge: combine two tables
      const sourceTable = table;
      const mergeTargetTable = targetTable;

      if (mergeTargetTable?.currentSession && currentSession) {
        // Combine sessions
        const mergedSession: Session = {
          ...mergeTargetTable.currentSession,
          customerCount:
            mergeTargetTable.currentSession.customerCount +
            currentSession.customerCount,
          // Keep original pricing type
        };

        dispatch({
          type: 'UPDATE_TABLE',
          payload: {
            ...mergeTargetTable,
            currentSession: mergedSession,
          },
        });

        // Move orders from source to target
        tableOrders.forEach((order) => {
          dispatch({
            type: 'UPDATE_ORDER',
            payload: {
              ...order,
              tableId: mergeTargetTable.id,
            },
          });
        });
      }

      // Close source table
      dispatch({
        type: 'UPDATE_TABLE',
        payload: {
          ...sourceTable,
          status: 'idle',
          currentSession: undefined,
        },
      });
    }

    setIsProcessing(false);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/70 z-[60]" onClick={onClose} />

      {/* Modal */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] w-[520px] max-h-[calc(100vh-2rem)] flex flex-col bg-[var(--color-bg-secondary)] rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--color-border-subtle)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isTransfer
                    ? 'bg-gradient-to-br from-blue-400 to-indigo-500'
                    : 'bg-gradient-to-br from-purple-400 to-pink-500'
                }`}
              >
                {isTransfer ? (
                  <ArrowRightLeft className="w-5 h-5 text-white" />
                ) : (
                  <Merge className="w-5 h-5 text-white" />
                )}
              </div>
              <div>
                <h2 className="text-lg font-bold">
                  {isTransfer ? '换台' : '并台'}
                </h2>
                <p className="text-sm text-[var(--color-text-muted)]">
                  {isTransfer ? '将台球桌更换到其他位置' : '将两个台球桌合并'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-5">
          {/* Source Table Info */}
          <div className="bg-gradient-to-br from-[var(--color-accent)]/10 to-[var(--color-accent)]/5 rounded-xl p-4 mb-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-[var(--color-text-muted)]">
                {isTransfer ? '当前桌台' : '合并桌台'}
              </span>
              <div className="px-2 py-0.5 rounded-md bg-[var(--color-accent)] text-white text-xs font-medium">
                桌{table.name}
              </div>
            </div>

            {currentTableStats ? (
              <div className="grid grid-cols-4 gap-3">
                <div className="text-center">
                  <div className="text-lg font-bold text-[var(--color-accent)]">
                    {currentTableStats.hours}h{currentTableStats.minutes}m
                  </div>
                  <div className="text-xs text-[var(--color-text-muted)]">
                    时长
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-[var(--color-accent)]">
                    {currentTableStats.customerCount}
                  </div>
                  <div className="text-xs text-[var(--color-text-muted)]">
                    人数
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-[var(--color-accent)]">
                    ¥{currentTableStats.tableFee}
                  </div>
                  <div className="text-xs text-[var(--color-text-muted)]">
                    台费
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-[var(--color-accent)]">
                    ¥{currentTableStats.total}
                  </div>
                  <div className="text-xs text-[var(--color-text-muted)]">
                    合计
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-3 text-[var(--color-text-muted)]">
                无进行中的计时
              </div>
            )}
          </div>

          {/* Target Selection */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">
                选择{isTransfer ? '目标桌台' : '合并到的桌台'}
              </span>
              <span className="text-xs text-[var(--color-text-muted)]">
                {availableTables.length}个可用
              </span>
            </div>

            {availableTables.length > 0 ? (
              <div className="grid grid-cols-4 gap-2">
                {availableTables.map((t) => {
                  const tOrders = orders.filter(
                    (o) => o.tableId === t.id && o.status !== 'cancelled'
                  );
                  const tTotal = tOrders.reduce(
                    (sum, o) => sum + o.totalAmount,
                    0
                  );
                  const isSelected = selectedTable === t.id;

                  return (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTable(t.id)}
                      className={`relative p-3 rounded-xl border-2 text-left transition-all ${
                        isSelected
                          ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 shadow-lg shadow-[var(--color-accent)]/20'
                          : 'border-[var(--color-border-subtle)] hover:border-[var(--color-accent)]/50 bg-[var(--color-bg-primary)]'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[var(--color-accent)] flex items-center justify-center shadow-lg">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}

                      <div className="text-center">
                        <div className="text-lg font-bold mb-1">
                          桌{t.name}
                        </div>
                        {t.status === 'inuse' && t.currentSession && (
                          <>
                            <div className="flex items-center justify-center gap-1 text-xs text-[var(--color-text-muted)] mb-1">
                              <Users className="w-3 h-3" />
                              <span>{t.currentSession.customerCount}人</span>
                            </div>
                            <div className="text-xs font-medium text-[var(--color-status-inuse)]">
                              ¥{t.currentSession.tableFee + tTotal}
                            </div>
                          </>
                        )}
                        {t.status === 'idle' && (
                          <div className="text-xs text-[var(--color-text-muted)]">
                            空闲
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 bg-[var(--color-bg-primary)] rounded-xl">
                <AlertTriangle className="w-10 h-10 mx-auto mb-2 text-amber-500" />
                <p className="text-sm text-[var(--color-text-muted)]">
                  {isTransfer
                    ? '暂无可用的空闲桌台'
                    : '没有其他使用中的桌台'}
                </p>
              </div>
            )}
          </div>

          {/* Warning Note */}
          {selectedTable && (
            <div
              className={`p-3 rounded-xl border ${
                isTransfer
                  ? 'bg-blue-500/10 border-blue-500/20'
                  : 'bg-amber-500/10 border-amber-500/20'
              }`}
            >
              <div className="flex items-start gap-2">
                <AlertTriangle
                  className={`w-4 h-4 mt-0.5 ${
                    isTransfer ? 'text-blue-400' : 'text-amber-500'
                  }`}
                />
                <p
                  className={`text-sm ${
                    isTransfer ? 'text-blue-400' : 'text-amber-500'
                  }`}
                >
                  {isTransfer
                    ? '换台后计时将转移到新桌台，原桌台变为空闲。'
                    : '并台后两桌消费将合并，源桌台自动关闭，所有订单转移。'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[var(--color-border-subtle)] flex gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 h-11 rounded-xl"
          >
            取消
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedTable || isProcessing}
            className={`flex-1 h-11 rounded-xl ${
              isTransfer
                ? 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400'
                : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400'
            } text-white border-0`}
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                处理中...
              </span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                {isTransfer ? '确认换台' : '确认并台'}
              </>
            )}
          </Button>
        </div>
      </div>
    </>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { ModalShell } from '@/components/ModalShell';
import { Button } from '@/components/ui/button';
import type { Table } from '@/types';
import { Users, Minus, Plus, Loader2 } from 'lucide-react';

interface OpenTableModalProps {
  table: Table;
  onClose: () => void;
  onConfirm: (playerCount: number) => void;
}

export function OpenTableModal({ table, onClose, onConfirm }: OpenTableModalProps) {
  const maxCapacity = table.capacity > 0 ? table.capacity : 6;
  const [customerCount, setCustomerCount] = useState(Math.min(2, maxCapacity));
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleConfirm = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await onConfirm(customerCount);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ModalShell onClose={onClose} title={`${table.name}号桌 · 开台`} icon={<Users className="w-5 h-5" />}
      footer={
        <div className="flex gap-3 w-full">
          <Button onClick={onClose} variant="outline" className="flex-1 h-14 text-sm rounded-full bg-white border-[#07C160] text-[#07C160]" disabled={isProcessing}>取消</Button>
          <Button onClick={handleConfirm} disabled={isProcessing} className="flex-1 h-14 text-base rounded-full bg-gradient-to-r from-[#07C160] to-[#06AD56] text-white">
            {isProcessing ? <><Loader2 className="w-5 h-5 animate-spin" /> 开台中...</> : '确认开台'}
          </Button>
        </div>
      }
    >
      <div className="bg-white rounded-2xl p-6 border border-[#e5e5e5]">
        <label className="flex items-center gap-3 text-base font-medium text-[#333333] mb-5">
          <Users className="w-5 h-5 text-[#999999]" /> 顾客人数
        </label>
        <div className="flex items-center gap-5">
          <button onClick={() => setCustomerCount(Math.max(2, customerCount - 1))}
            className="w-14 h-14 rounded-xl bg-white border-2 border-[#e5e5e5] flex items-center justify-center hover:bg-gray-50 transition-colors">
            <Minus className="w-6 h-6 text-[#333333]" />
          </button>
          <div className="flex-1 flex items-center justify-center">
            <span className="text-4xl font-bold text-[#333333]">{customerCount}</span>
            <span className="ml-2 text-[#999999] text-lg">人</span>
          </div>
          <button onClick={() => setCustomerCount(Math.min(maxCapacity, customerCount + 1))}
            className="w-14 h-14 rounded-xl bg-white border-2 border-[#e5e5e5] flex items-center justify-center hover:bg-gray-50 transition-colors">
            <Plus className="w-6 h-6 text-[#333333]" />
          </button>
        </div>
        <p className="mt-3 text-sm text-[#999999] text-center">最多可容纳 {maxCapacity} 人</p>
      </div>
    </ModalShell>
  );
}

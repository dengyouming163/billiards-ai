'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import type { Table, Assistant } from '@/types';
import {
  X,
  UserCog,
  Check,
  UserPlus,
  Clock,
  Star,
  Crown,
} from 'lucide-react';

interface AssistantModalProps {
  table: Table;
  onClose: () => void;
}

const LEVEL_CONFIG: Record<string, { label: string; color: string; bg: string; Icon: typeof Star }> = {
  junior: { label: '初级', color: 'text-slate-400', bg: 'bg-slate-100', Icon: UserPlus },
  senior: { label: '高级', color: 'text-emerald-500', bg: 'bg-emerald-100', Icon: Star },
  star: { label: '明星', color: 'text-amber-500', bg: 'bg-amber-100', Icon: Crown },
};

export function AssistantModal({ table, onClose }: AssistantModalProps) {
  const { state, assignAssistant, removeAssistant } = useApp();
  const { assistants } = state;

  const [selectedAssistant, setSelectedAssistant] = useState<string>(
    table.currentSession?.assistantId || ''
  );
  const [isProcessing, setIsProcessing] = useState(false);

  const availableAssistants = assistants.filter((a) => a.status === 'available');
  const busyAssistants = assistants.filter((a) => a.status === 'busy');
  const currentAssistantId = table.currentSession?.assistantId;
  const currentAssistant = assistants.find((a) => a.id === currentAssistantId);

  const handleConfirm = async () => {
    setIsProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 300));

    if (selectedAssistant && selectedAssistant !== currentAssistantId) {
      const assistant = assistants.find((a) => a.id === selectedAssistant);
      if (assistant) {
        assignAssistant(table.id, selectedAssistant, assistant.name);
      }
    }

    setIsProcessing(false);
    onClose();
  };

  const handleRemove = async () => {
    setIsProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 300));
    removeAssistant(table.id);
    setIsProcessing(false);
    onClose();
  };

  const getLevelConfig = (level: string | undefined) => {
    return LEVEL_CONFIG[level as keyof typeof LEVEL_CONFIG] || LEVEL_CONFIG.junior;
  };

  const renderAssistantCard = (
    assistant: Assistant,
    isAvailable: boolean,
    isSelected: boolean
  ) => {
    const levelInfo = getLevelConfig(assistant.level);
    const LevelIcon = levelInfo.Icon;

    return (
      <button
        key={assistant.id}
        onClick={() => isAvailable && setSelectedAssistant(assistant.id)}
        disabled={!isAvailable}
        className={`relative w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
          isSelected
            ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 shadow-lg shadow-[var(--color-accent)]/20'
            : isAvailable
            ? 'border-[var(--color-border-subtle)] hover:border-[var(--color-accent)]/50 bg-[var(--color-bg-primary)]'
            : 'border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] opacity-60 cursor-not-allowed'
        }`}
      >
        {isSelected && (
          <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[var(--color-accent)] flex items-center justify-center shadow-lg">
            <Check className="w-4 h-4 text-white" />
          </div>
        )}

        {/* Avatar */}
        {assistant.avatar ? (
          <img
            src={assistant.avatar}
            alt={assistant.name}
            className="w-14 h-14 rounded-xl object-cover"
          />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[var(--color-accent)]/20 to-[var(--color-accent)]/10 flex items-center justify-center">
            <span className="text-xl font-bold text-[var(--color-accent)]">
              {assistant.name.charAt(0)}
            </span>
          </div>
        )}

        {/* Info */}
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold">{assistant.name}</span>
            <span
              className={`px-2 py-0.5 rounded-md text-xs font-medium ${levelInfo.bg} ${levelInfo.color}`}
            >
              <LevelIcon className="w-3 h-3 inline mr-1" />
              {levelInfo.label}
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm text-[var(--color-text-muted)]">
            <span className="font-medium text-[var(--color-accent)]">
              ¥{assistant.hourlyRate}/小时
            </span>
          </div>
        </div>

        {/* Status */}
        {!isAvailable && (
          <div className="px-2 py-1 rounded-md bg-amber-100 text-amber-600 text-xs font-medium">
            服务中
          </div>
        )}
      </button>
    );
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
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-pink-400 to-rose-500">
                <UserCog className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold">选择助教</h2>
                <p className="text-sm text-[var(--color-text-muted)]">
                  桌{table.name}
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
        <div className="flex-1 overflow-auto p-5 space-y-5">
          {/* Current assistant */}
          {currentAssistant && (
            <div className="bg-gradient-to-br from-pink-500/10 to-rose-500/5 rounded-xl p-4 border border-pink-500/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {currentAssistant.avatar ? (
                    <img
                      src={currentAssistant.avatar}
                      alt={currentAssistant.name}
                      className="w-12 h-12 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center">
                      <span className="text-lg font-bold text-white">
                        {currentAssistant.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-rose-400">
                      {currentAssistant.name}
                    </p>
                    <p className="text-sm text-[var(--color-text-muted)]">
                      当前助教
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRemove}
                  disabled={isProcessing}
                  className="border-rose-500/50 text-rose-400 hover:bg-rose-500/10 rounded-lg"
                >
                  下桌
                </Button>
              </div>
            </div>
          )}

          {/* Available assistants */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium">可选助教</h3>
              <span className="text-xs text-[var(--color-text-muted)]">
                {availableAssistants.length} 位空闲
              </span>
            </div>

            {availableAssistants.length > 0 ? (
              <div className="space-y-2">
                {availableAssistants.map((assistant) =>
                  renderAssistantCard(
                    assistant,
                    true,
                    selectedAssistant === assistant.id
                  )
                )}
              </div>
            ) : (
              <div className="text-center py-10 bg-[var(--color-bg-primary)] rounded-xl border border-[var(--color-border-subtle)]">
                <UserCog className="w-12 h-12 mx-auto mb-3 text-[var(--color-text-muted)] opacity-50" />
                <p className="text-sm text-[var(--color-text-muted)]">
                  暂没有空闲助教
                </p>
              </div>
            )}
          </div>

          {/* Busy assistants */}
          {busyAssistants.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium">服务中</h3>
                <span className="text-xs text-[var(--color-text-muted)]">
                  {busyAssistants.length} 位忙碌
                </span>
              </div>
              <div className="space-y-2">
                {busyAssistants.map((assistant) =>
                  renderAssistantCard(assistant, false, false)
                )}
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
            disabled={
              !selectedAssistant ||
              selectedAssistant === currentAssistantId ||
              isProcessing
            }
            className="flex-1 h-11 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white border-0"
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                处理中...
              </span>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                确认上桌
              </>
            )}
          </Button>
        </div>
      </div>
    </>
  );
}

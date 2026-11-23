'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalContainerProps {
  title: string;
  icon?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
}

export function ModalContainer({
  title,
  icon,
  onClose,
  children,
  footer,
  width = 'max-w-4xl',
}: ModalContainerProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className={`bg-white rounded-2xl w-full ${width} h-[80vh] flex flex-col shadow-2xl`} onClick={e => e.stopPropagation()}>
        {/* Fixed Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-white rounded-t-2xl flex-shrink-0">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-sm">
                {icon}
              </div>
            )}
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>

        {/* Fixed Footer */}
        {footer && (
          <div className="px-4 py-3 border-t border-slate-100 bg-white rounded-b-2xl flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

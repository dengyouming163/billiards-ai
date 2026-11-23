'use client';

import { useEffect, useId, memo } from 'react';
import { X } from 'lucide-react';

interface ModalShellProps {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
  icon?: React.ReactNode;
  headerRight?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export const ModalShell = memo(function ModalShell({ children, onClose, title, icon, headerRight, footer, className }: ModalShellProps) {
  const titleId = useId();

  // Escape key close + body scroll lock
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div
        className={`bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col ${className || ''}`}
        style={{ width: '50vw', height: '80vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 shrink-0">
          <div className="flex items-center gap-3 [&_svg]:text-white">
            {icon && <div className="w-8 h-8">{icon}</div>}
            <h2 id={titleId} className="text-xl font-bold text-white">{title}</h2>
          </div>
          <div className="flex items-center gap-3">
            {headerRight}
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/20 transition-colors" aria-label="关闭">
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-4 flex flex-col">
          {children}
        </div>

        {/* Footer (optional) */}
        {footer && (
          <div className="px-7 py-5 border-t border-gray-100 flex justify-end gap-4 bg-gray-50/50 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
});

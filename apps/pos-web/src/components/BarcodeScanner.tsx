'use client';

import { memo, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';

export interface BarcodeScannerProps {
  value: string;
  onChange: (code: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  error?: string;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}

export interface BarcodeScannerHandle {
  focus: () => void;
}

export const BarcodeScanner = memo(forwardRef<BarcodeScannerHandle, BarcodeScannerProps>(
  function BarcodeScanner({ value, onChange, onSubmit, disabled, error, placeholder, autoFocus = true, className }, ref) {
    const inputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
    }));

    useEffect(() => {
      if (autoFocus) {
        // 延迟聚焦以避免 modal 动画冲突
        const t = setTimeout(() => inputRef.current?.focus(), 100);
        return () => clearTimeout(t);
      }
    }, [autoFocus]);

    return (
      <div className={className}>
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !disabled && value.length >= 16) {
              onSubmit();
            }
          }}
          placeholder={placeholder || '扫描或输入顾客微信付款码'}
          maxLength={18}
          disabled={disabled}
          autoComplete="off"
          className="w-full px-4 py-3 text-lg rounded-xl border-2 border-slate-200
                     focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100
                     outline-none transition-all text-center tracking-wider
                     disabled:opacity-50 disabled:cursor-not-allowed"
        />
        {error && (
          <p className="text-red-500 text-sm mt-2 text-center">{error}</p>
        )}
      </div>
    );
  }
));

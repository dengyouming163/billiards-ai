'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-2xl border border-[#e5e5e5] bg-white px-3 py-2 text-sm',
          'text-[#333333] placeholder:text-[#cccccc]',
          'transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-[#D1FAE5] focus:border-[#07C160]',
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-50',
          'file:border-0 file:bg-transparent file:text-sm file:font-medium',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };

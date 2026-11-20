'use client';

import { memo } from 'react';

export const SkeletonBlock = memo(function SkeletonBlock({ className = '' }: { className?: string }) {
  return (
    <div className={`rounded-2xl overflow-hidden shadow-sm border border-slate-100 ${className}`}>
      <div className="w-full h-full bg-slate-100 animate-pulse rounded-2xl">
        <div className="p-5 space-y-3">
          <div className="h-3 bg-slate-200 rounded w-1/3" />
          <div className="h-8 bg-slate-200 rounded w-2/3" />
          <div className="h-3 bg-slate-200 rounded w-1/4" />
        </div>
      </div>
    </div>
  );
});

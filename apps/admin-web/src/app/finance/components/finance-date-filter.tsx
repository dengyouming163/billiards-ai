'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, Search } from 'lucide-react';

interface FinanceDateFilterProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (d: string) => void;
  onEndDateChange: (d: string) => void;
  onQuery: (startDate?: string, endDate?: string) => void;
  onExport: () => void;
  loading?: boolean;
  exporting?: boolean;
}

const presets = [
  { label: '今日', getValue: () => {
    const d = new Date();
    return { start: d.toISOString().slice(0, 10), end: d.toISOString().slice(0, 10) };
  }},
  { label: '昨日', getValue: () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return { start: d.toISOString().slice(0, 10), end: d.toISOString().slice(0, 10) };
  }},
  { label: '本周', getValue: () => {
    const d = new Date();
    const day = d.getDay();
    const diff = day === 0 ? 6 : day - 1;
    const mon = new Date(d);
    mon.setDate(d.getDate() - diff);
    return { start: mon.toISOString().slice(0, 10), end: d.toISOString().slice(0, 10) };
  }},
  { label: '本月', getValue: () => {
    const d = new Date();
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    return { start: start.toISOString().slice(0, 10), end: d.toISOString().slice(0, 10) };
  }},
];

export function FinanceDateFilter({
  startDate, endDate,
  onStartDateChange, onEndDateChange,
  onQuery, onExport,
  loading, exporting,
}: FinanceDateFilterProps) {
  const [activePreset, setActivePreset] = useState('今日');

  const handlePreset = (preset: typeof presets[0]) => {
    const { start, end } = preset.getValue();
    setActivePreset(preset.label);
    onStartDateChange(start);
    onEndDateChange(end);
    onQuery(start, end);
  };

  const handleStartDateChange = (d: string) => {
    setActivePreset('');
    onStartDateChange(d);
  };

  const handleEndDateChange = (d: string) => {
    setActivePreset('');
    onEndDateChange(d);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {presets.map((p) => {
        const isActive = activePreset === p.label;
        return (
          <Button
            key={p.label}
            variant={isActive ? 'default' : 'outline'}
            size="sm"
            className={`rounded-xl ${isActive ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white' : ''}`}
            onClick={() => handlePreset(p)}
          >
            {p.label}
          </Button>
        );
      })}
      <div className="w-px h-6 bg-slate-200 mx-1" />
      <Input
        type="date"
        value={startDate}
        onChange={(e) => handleStartDateChange(e.target.value)}
        className="w-[150px] rounded-xl h-9 text-sm"
      />
      <span className="text-slate-400 text-sm">~</span>
      <Input
        type="date"
        value={endDate}
        onChange={(e) => handleEndDateChange(e.target.value)}
        className="w-[150px] rounded-xl h-9 text-sm"
      />
      <Button
        size="sm"
        className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
        onClick={() => onQuery(startDate, endDate)}
        disabled={loading}
      >
        <Search className="w-4 h-4 mr-1" />
        查询
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="rounded-xl"
        onClick={onExport}
        disabled={exporting}
      >
        <Download className="w-4 h-4 mr-1" />
        导出Excel
      </Button>
    </div>
  );
}

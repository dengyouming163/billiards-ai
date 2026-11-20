'use client';

import { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/hooks/use-app';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/hooks/use-toast';
import { fetchAssistantSalary } from '@/lib/api/reports';
import {
  Download,
  CheckCircle,
  Calendar,
  AlertCircle,
} from 'lucide-react';

interface SalaryRecord {
  id: string;
  assistant_id: string;
  assistant_name: string;
  commission_mode: 'no_guarantee' | 'with_guarantee' | 'base_salary';
  commission_mode_label: string;
  table_hours: number;
  overtime_hours: number;
  outwork_hours: number;
  commission_total: number;
  base_or_guarantee: number;
  salary_total: number;
  guarantee_triggered: boolean;
  notes: string;
  status: 'pending' | 'paid';
  paid_at?: string;
}

const getMonthDefault = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export function AssistantsSalaryTab() {
  const { state } = useApp();
  const { currentStore } = state;
  const { toast } = useToast();

  const [month, setMonth] = useState(getMonthDefault());
  const [loading, setLoading] = useState(false);
  const [salaryData, setSalaryData] = useState<SalaryRecord[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const loadData = async () => {
    setLoading(true);
    try {
      if (!currentStore?.id) return;
      const data = await fetchAssistantSalary(currentStore.id, month);
      setSalaryData(data || []);
    } catch (e: any) {
      toast({ title: e?.message || '加载失败', variant: 'error' });
      setSalaryData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentStore?.id) {
      loadData();
    }
  }, [month, currentStore?.id]);

  const stats = useMemo(() => {
    const totalSalary = salaryData.reduce((s, r) => s + r.salary_total, 0);
    const totalCommission = salaryData.reduce((s, r) => s + r.commission_total, 0);
    const paidCount = salaryData.filter((r) => r.status === 'paid').length;
    const pendingCount = salaryData.filter((r) => r.status === 'pending').length;
    return { totalSalary, totalCommission, paidCount, pendingCount };
  }, [salaryData]);

  const handleExportCSV = () => {
    if (salaryData.length === 0) return;
    const headers = [
      '助教姓名',
      '提成模式',
      '上桌工时(h)',
      '加班工时(h)',
      '外勤工时(h)',
      '提成金额',
      '保底/底薪',
      '应发合计',
      '保底触发',
      '备注',
      '状态',
    ];
    const rows = salaryData.map((r) =>
      [
        r.assistant_name,
        r.commission_mode_label,
        r.table_hours,
        r.overtime_hours,
        r.outwork_hours,
        r.commission_total.toFixed(2),
        r.base_or_guarantee.toFixed(2),
        r.salary_total.toFixed(2),
        r.guarantee_triggered ? '是' : '否',
        r.notes,
        r.status === 'paid' ? '已发放' : '待发放',
      ].join(',')
    );
    const csv = '﻿' + headers.join(',') + '\n' + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `助教工资报表_${month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleMarkPaid = async () => {
    if (selectedIds.size === 0) {
      toast({ title: '请先选择要标记的记录', variant: 'warning' });
      return;
    }
    try {
      const { markCommissionPaid } = await import('@/lib/api/assistants');
      await markCommissionPaid(Array.from(selectedIds));
      toast({ title: `已标记 ${selectedIds.size} 条记录为已发放` });
      setSelectedIds(new Set());
      loadData();
    } catch (e: any) {
      toast({ title: e?.message || '标记失败', variant: 'error' });
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    const pending = salaryData.filter((r) => r.status === 'pending');
    if (selectedIds.size === pending.length && pending.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pending.map((r) => r.id)));
    }
  };

  const getModeBadge = (mode: string) => {
    switch (mode) {
      case 'no_guarantee':
        return <Badge variant="outline">无保底</Badge>;
      case 'with_guarantee':
        return <Badge className="bg-amber-100 text-amber-700 border-amber-200">保底提成</Badge>;
      case 'base_salary':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">固定底薪</Badge>;
      default:
        return <Badge variant="outline">{mode}</Badge>;
    }
  };

  const getRowClassName = (record: SalaryRecord) => {
    if (record.guarantee_triggered) return 'bg-amber-50';
    if (record.commission_mode === 'base_salary') return 'bg-blue-50';
    return '';
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">助教薪资</h2>
          <p className="text-sm text-slate-500">查看和导出助教月度工资报表</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            <Input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-[160px] rounded-xl"
            />
          </div>
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={handleExportCSV}
            disabled={salaryData.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            导出CSV
          </Button>
          {selectedIds.size > 0 && (
            <Button
              className="rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
              onClick={handleMarkPaid}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              一键标记发放 ({selectedIds.size})
            </Button>
          )}
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-white rounded-2xl">
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">应发总额</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              ¥{stats.totalSalary.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-2xl">
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">提成合计</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">
              ¥{stats.totalCommission.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-2xl">
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">待发放</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{stats.pendingCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-2xl">
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">已发放</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{stats.paidCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Salary table */}
      <Card className="bg-white rounded-2xl">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Spinner className="w-8 h-8 text-amber-500" />
            </div>
          ) : salaryData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <AlertCircle className="w-12 h-12 text-slate-300 mb-4" />
              <p className="text-slate-500 text-lg font-medium">暂无工资数据</p>
              <p className="text-slate-400 text-sm mt-1">
                当前月份没有助教工资记录，请确认后端工资结算接口是否可用
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <input
                        type="checkbox"
                        checked={
                          salaryData.filter((r) => r.status === 'pending').length > 0 &&
                          selectedIds.size === salaryData.filter((r) => r.status === 'pending').length
                        }
                        onChange={toggleSelectAll}
                        className="rounded"
                      />
                    </TableHead>
                    <TableHead>助教姓名</TableHead>
                    <TableHead>提成模式</TableHead>
                    <TableHead className="text-right">上桌工时(h)</TableHead>
                    <TableHead className="text-right">加班工时(h)</TableHead>
                    <TableHead className="text-right">外勤工时(h)</TableHead>
                    <TableHead className="text-right">提成金额</TableHead>
                    <TableHead className="text-right">保底/底薪</TableHead>
                    <TableHead className="text-right">应发合计</TableHead>
                    <TableHead>备注</TableHead>
                    <TableHead>状态</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salaryData.map((record, index) => (
                    <TableRow key={record.id || `salary-row-${index}`} className={getRowClassName(record)}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(record.id)}
                          onChange={() => toggleSelect(record.id)}
                          disabled={record.status === 'paid'}
                          className="rounded"
                        />
                      </TableCell>
                      <TableCell className="font-medium">{record.assistant_name}</TableCell>
                      <TableCell>{getModeBadge(record.commission_mode)}</TableCell>
                      <TableCell className="text-right">{record.table_hours.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{record.overtime_hours.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{record.outwork_hours.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-mono text-emerald-600">
                        ¥{record.commission_total.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {record.commission_mode === 'no_guarantee' ? (
                          <span className="text-slate-400">-</span>
                        ) : (
                          <span className={record.guarantee_triggered ? 'text-amber-600 font-semibold' : ''}>
                            ¥{record.base_or_guarantee.toFixed(2)}
                            {record.guarantee_triggered && ' *'}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-bold font-mono">
                        ¥{record.salary_total.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 max-w-[150px] truncate">
                        {record.notes || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={record.status === 'paid' ? 'default' : 'secondary'}>
                          {record.status === 'paid' ? '已发放' : '待发放'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex items-center gap-6 text-sm text-slate-500">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-amber-50 border border-amber-200" />
          <span>保底触发 (黄色)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-50 border border-blue-200" />
          <span>固定底薪 (蓝色)</span>
        </div>
      </div>
    </div>
  );
}

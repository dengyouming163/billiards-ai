'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Users, RefreshCw } from 'lucide-react';
import { createTableOrder } from '@/lib/api/orders';
import { fetchTables } from '@/lib/api/tables';
import type { Table } from '@/lib/types';

interface TableOrderModalProps {
  onSuccess?: () => void;
}

export function TableOrderModal({ onSuccess }: TableOrderModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tables, setTables] = useState<Table[]>([]);
  const [tablesLoading, setTablesLoading] = useState(false);
  const [tableId, setTableId] = useState('');
  const [memberName, setMemberName] = useState('');
  const [customerCount, setCustomerCount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadTables();
    }
  }, [isOpen]);

  const loadTables = async () => {
    setTablesLoading(true);
    try {
      const data = await fetchTables();
      setTables(data);
    } catch (error) {
      toast({ title: '加载台桌列表失败', variant: 'error' });
    } finally {
      setTablesLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!tableId) {
      toast({ title: '请选择台桌', variant: 'error' });
      return;
    }

    setIsLoading(true);
    try {
      await createTableOrder({
        table_id: tableId,
        member_name: memberName || undefined,
        customer_count: customerCount ? parseInt(customerCount, 10) : undefined,
      });
      toast({ title: '开台成功', variant: 'success' });
      setIsOpen(false);
      setTableId('');
      setMemberName('');
      setCustomerCount('');
      onSuccess?.();
    } catch (error) {
      toast({ title: '开台失败', variant: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const getTableStatus = (table: Table) => {
    if (table.status === 'reserved') return 'reserved';
    if (table.status === 'maintenance') return 'maintenance';
    return table.status === 'idle' ? 'available' : 'occupied';
  };

  const tableTypeNames: Record<string, string> = {
    standard: '标准台',
    tournament: '比赛台',
    snooker: '斯诺克',
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-[#00D4AA] to-[#00B894] hover:from-[#00B894] hover:to-[#00A08A] text-white shadow-md">
          <Plus className="w-4 h-4 mr-2" />
          开台
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-800">开台</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="table-select">选择台桌 *</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={loadTables}
                disabled={tablesLoading}
              >
                <RefreshCw className={`w-3 h-3 ${tablesLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            <Select value={tableId} onValueChange={setTableId}>
              <SelectTrigger id="table-select">
                <SelectValue placeholder="请选择台桌" />
              </SelectTrigger>
              <SelectContent>
                {tablesLoading ? (
                  <SelectItem value="" disabled>
                    <span className="flex items-center justify-center w-full">
                      <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                      加载中...
                    </span>
                  </SelectItem>
                ) : tables.length === 0 ? (
                  <SelectItem value="" disabled>
                    暂无可用台桌
                  </SelectItem>
                ) : (
                  tables.map((table) => {
                    const status = getTableStatus(table);
                    const isDisabled = status !== 'available';
                    return (
                      <SelectItem 
                        key={table.id} 
                        value={table.id}
                        disabled={isDisabled}
                      >
                        <span className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <span>{table.name || `桌台${table.number}`}</span>
                            {table.table_type_name && (
                              <span className="text-xs text-gray-400">
                                ({tableTypeNames[table.table_type_name] || table.table_type_name})
                              </span>
                            )}
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            status === 'available' 
                              ? 'bg-green-100 text-green-600' 
                              : status === 'reserved'
                              ? 'bg-blue-100 text-blue-600'
                              : status === 'maintenance'
                              ? 'bg-red-100 text-red-600'
                              : 'bg-gray-100 text-gray-400'
                          }`}>
                            {status === 'available' ? '空闲' : status === 'reserved' ? '已预约' : status === 'maintenance' ? '维护中' : '占用'}
                          </span>
                        </span>
                      </SelectItem>
                    );
                  })
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="member-name">会员姓名</Label>
            <Input
              id="member-name"
              placeholder="输入会员姓名（非必填）"
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer-count">人数</Label>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-500" />
              <Input
                id="customer-count"
                type="number"
                placeholder="输入人数"
                value={customerCount}
                onChange={(e) => setCustomerCount(e.target.value)}
                min="1"
                max="20"
              />
              <span className="text-gray-400">人</span>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => setIsOpen(false)}
            >
              取消
            </Button>
            <Button 
              className="flex-1 bg-gradient-to-r from-[#00D4AA] to-[#00B894] hover:from-[#00B894] hover:to-[#00A08A] text-white"
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? '开台中...' : '确认开台'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
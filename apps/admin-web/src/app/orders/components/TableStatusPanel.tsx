'use client';

import { useState, useEffect } from 'react';
import { Table as TableIcon, Clock, Play, Pause, Plus, ShoppingCart, User, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getOrdersByTable, pauseOrder, resumeOrder, type Order } from '@/lib/api/orders';
import { fetchTables } from '@/lib/api/tables';
import { useToast } from '@/hooks/use-toast';
import type { Table } from '@/lib/types';

const tableTypeNames: Record<string, string> = {
  standard: '标准台',
  tournament: '比赛台',
  snooker: '斯诺克',
};

export function TableStatusPanel() {
  const [tables, setTables] = useState<Table[]>([]);
  const [tableOrders, setTableOrders] = useState<Record<string, Order[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [tablesData] = await Promise.all([
        fetchTables(),
      ]);
      setTables(tablesData);

      const ordersMap: Record<string, Order[]> = {};
      for (const table of tablesData) {
        try {
          const orders = await getOrdersByTable(table.id);
          ordersMap[table.id] = orders;
        } catch (error) {
          ordersMap[table.id] = [];
        }
      }
      setTableOrders(ordersMap);
    } catch (error) {
      toast({ title: '加载数据失败', variant: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePause = async (orderId: string) => {
    try {
      await pauseOrder(orderId);
      toast({ title: '暂停成功', variant: 'success' });
      loadData();
    } catch (error) {
      toast({ title: '暂停失败', variant: 'error' });
    }
  };

  const handleResume = async (orderId: string) => {
    try {
      await resumeOrder(orderId);
      toast({ title: '恢复成功', variant: 'success' });
      loadData();
    } catch (error) {
      toast({ title: '恢复失败', variant: 'error' });
    }
  };

  const getTableStatus = (tableId: string) => {
    const orders = tableOrders[tableId] || [];
    const activeOrder = orders.find((o) => o.status === 'in_progress');
    const pausedOrder = orders.find((o) => o.status === 'paused');
    
    if (activeOrder) return { status: 'occupied' as const, order: activeOrder };
    if (pausedOrder) return { status: 'paused' as const, order: pausedOrder };
    return { status: 'available' as const, order: null };
  };

  const formatDuration = (startTime?: string) => {
    if (!startTime) return '0分钟';
    const start = new Date(startTime);
    const now = new Date();
    const diff = Math.floor((now.getTime() - start.getTime()) / 60000);
    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;
    if (hours > 0) {
      return `${hours}小时${minutes}分钟`;
    }
    return `${minutes}分钟`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (tables.length === 0) {
    return (
      <div className="text-center py-8">
        <TableIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="text-gray-500">暂无台桌数据</p>
        <Button variant="outline" size="sm" onClick={loadData} className="mt-3">
          <RefreshCw className="w-4 h-4 mr-2" />
          刷新
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {tables.map((table) => {
        const { status, order } = getTableStatus(table.id);
        const isAvailable = status === 'available';
        const isOccupied = status === 'occupied';
        const isPaused = status === 'paused';
        const tableName = table.name || `桌台${table.number}`;

        return (
          <div
            key={table.id}
            className={`relative rounded-xl p-4 transition-all cursor-pointer ${
              isAvailable 
                ? 'bg-white border-2 border-gray-200 hover:border-green-400 hover:shadow-md' 
                : isOccupied
                ? 'bg-gradient-to-br from-green-50 to-emerald-100 border-2 border-green-300'
                : 'bg-gradient-to-br from-yellow-50 to-orange-100 border-2 border-yellow-300'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <TableIcon className={`w-5 h-5 ${isAvailable ? 'text-gray-400' : 'text-green-600'}`} />
                <span className="font-semibold text-gray-800">{tableName}</span>
              </div>
              <Badge 
                variant={isAvailable ? 'outline' : 'secondary'}
                className={isPaused ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100' : ''}
              >
                {isAvailable ? '空闲' : isOccupied ? '使用中' : '已暂停'}
              </Badge>
            </div>

            <p className="text-sm text-gray-500 mb-3">
              {table.table_type_name ? (tableTypeNames[table.table_type_name] || table.table_type_name) : ''}
              {table.zone_name && (
                <span className="text-gray-400 ml-2">· {table.zone_name}</span>
              )}
            </p>

            {order && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">已消费 {formatDuration(order.start_time)}</span>
                </div>
                {order.member_name && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{order.member_name}</span>
                  </div>
                )}
                <div className="flex gap-2 mt-2">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="flex-1 text-xs"
                    onClick={() => isOccupied ? handlePause(order.id) : handleResume(order.id)}
                  >
                    {isOccupied ? (
                      <>
                        <Pause className="w-3 h-3 mr-1" />
                        暂停
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3 mr-1" />
                        恢复
                      </>
                    )}
                  </Button>
                  <Button size="sm" variant="ghost" className="flex-1 text-xs">
                    <Plus className="w-3 h-3 mr-1" />
                    加时
                  </Button>
                  <Button size="sm" variant="ghost" className="flex-1 text-xs">
                    <ShoppingCart className="w-3 h-3 mr-1" />
                    点单
                  </Button>
                </div>
              </div>
            )}

            {isAvailable && (
              <div className="mt-2">
                <Button 
                  className="w-full text-sm bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  开台
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
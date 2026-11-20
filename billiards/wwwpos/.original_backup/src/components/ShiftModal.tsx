'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { mockOperators } from '@/data/mock-data';
import {
  Clock,
  User,
  DollarSign,
  History,
  Banknote,
  CreditCard,
  AlertCircle,
  ArrowRightLeft,
  Package,
  ShoppingCart,
} from 'lucide-react';
import { ModalContainer } from './ModalContainer';

interface ShiftModalProps {
  onClose: () => void;
}

export function ShiftModal({ onClose }: ShiftModalProps) {
  const { state, startShift, endShift } = useApp();
  const { currentShift, tables, orders, assistants } = state;

  const [activeTab, setActiveTab] = useState<'start' | 'end' | 'history'>('start');
  const [selectedOperator, setSelectedOperator] = useState('');
  const [openingCash, setOpeningCash] = useState('');
  const [closingCash, setClosingCash] = useState('');
  const [remark, setRemark] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const operators = mockOperators;

  // Get real-time shift data
  const getShiftData = () => {
    const now = new Date();
    const shiftStart = currentShift ? new Date(currentShift.startTime) : now;
    const shiftDuration = Math.floor((now.getTime() - shiftStart.getTime()) / 1000 / 60);
    
    const inUseTables = tables.filter((t) => t.status === 'inuse');
    const pendingOrders = orders.filter((o) => o.status === 'pending');
    const tableRevenue = inUseTables.length * 80 + Math.floor(shiftDuration / 15) * 20;
    const productRevenue = orders
      .filter((o) => o.tableId)
      .reduce((sum, o) => sum + o.totalAmount, 0);
    const totalRevenue = tableRevenue + productRevenue;
    const cashRevenue = totalRevenue * 0.35;
    const electronicRevenue = totalRevenue * 0.65;

    return {
      duration: shiftDuration,
      totalRevenue,
      tableRevenue,
      productRevenue,
      cashRevenue,
      electronicRevenue,
      inUseTables,
      pendingOrders: pendingOrders.length,
    };
  };

  const shiftData = currentShift ? getShiftData() : null;

  const handleStartShift = () => {
    if (!selectedOperator || !openingCash) return;
    setIsProcessing(true);
    const operator = operators.find((o) => o.id === selectedOperator);
    if (operator) {
      startShift(operator.id, operator.name, parseFloat(openingCash));
    }
    setIsProcessing(false);
    onClose();
  };

  const handleEndShift = () => {
    if (!closingCash) return;
    setIsProcessing(true);
    endShift(parseFloat(closingCash));
    setIsProcessing(false);
    onClose();
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}小时${mins}分钟` : `${mins}分钟`;
  };

  const cashDifference = closingCash
    ? parseFloat(closingCash) - (currentShift?.openingCash || 0) - (shiftData?.cashRevenue || 0)
    : 0;

  const handleStart = () => {
    if (!selectedOperator || !openingCash) return;
    setIsProcessing(true);
    const operator = operators.find((o) => o.id === selectedOperator);
    if (operator) {
      startShift(operator.id, operator.name, parseFloat(openingCash));
    }
    setTimeout(() => {
      setIsProcessing(false);
      onClose();
    }, 500);
  };

  const handleEnd = () => {
    if (!closingCash) return;
    setIsProcessing(true);
    endShift(parseFloat(closingCash));
    setTimeout(() => {
      setIsProcessing(false);
      onClose();
    }, 500);
  };

  const footer = activeTab === 'start' ? (
    <div className="flex gap-2">
      <button
        onClick={onClose}
        className="px-4 py-2 rounded-lg bg-slate-100 text-slate-600 text-sm hover:bg-slate-200 transition-colors"
      >
        取消
      </button>
      <button
        onClick={handleStart}
        disabled={!selectedOperator || !openingCash || isProcessing}
        className="flex-1 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-medium hover:shadow-sm transition-all disabled:opacity-50"
      >
        {isProcessing ? '处理中...' : '确认上班'}
      </button>
    </div>
  ) : activeTab === 'end' ? (
    <div className="flex gap-2">
      <button
        onClick={onClose}
        className="px-4 py-2 rounded-lg bg-slate-100 text-slate-600 text-sm hover:bg-slate-200 transition-colors"
      >
        取消
      </button>
      <button
        onClick={handleEnd}
        disabled={!closingCash || isProcessing}
        className="flex-1 py-2 rounded-lg bg-gradient-to-r from-rose-500 to-pink-500 text-white text-sm font-medium hover:shadow-sm transition-all disabled:opacity-50"
      >
        {isProcessing ? '处理中...' : '确认交班'}
      </button>
    </div>
  ) : null;

  return (
    <ModalContainer
      title="交接班"
      icon={<Clock className="w-4 h-4 text-white" />}
      onClose={onClose}
      footer={footer}
      width="max-w-xl"
    >
      {/* Tabs */}
      <div className="flex border-b border-slate-100">
        {[
          { id: 'start', label: '上班', icon: Clock },
          { id: 'end', label: '交班', icon: ArrowRightLeft },
          { id: 'history', label: '记录', icon: History },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors relative ${
              activeTab === tab.id
                ? 'text-emerald-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Start Shift Tab */}
        {activeTab === 'start' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-2">选择收银员</label>
              <div className="grid grid-cols-2 gap-2">
                {operators
                  .filter((o) => o.role === 'cashier' || o.role === 'manager')
                  .map((operator) => (
                    <button
                      key={operator.id}
                      onClick={() => setSelectedOperator(operator.id)}
                      className={`p-3 rounded-lg border transition-all text-left ${
                        selectedOperator === operator.id
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                          <User className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{operator.name}</p>
                          <p className="text-xs text-slate-500">
                            {operator.role === 'manager' ? '店长' : '收银员'}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">备用金</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="number"
                  placeholder="输入备用金金额"
                  value={openingCash}
                  onChange={(e) => setOpeningCash(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5" />
                <div className="text-xs text-amber-700">
                  <p className="font-medium">交班提醒</p>
                  <p className="mt-0.5">
                    {tables.filter((t) => t.status === 'inuse').length} 张台球桌正在使用中，
                    {orders.filter((o) => o.status === 'pending').length} 个待处理订单
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* End Shift Tab */}
        {activeTab === 'end' && currentShift && (
          <div className="space-y-4">
            {/* Shift info */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                  <User className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">{currentShift.operatorName}</p>
                  <p className="text-xs text-slate-500">
                    {formatDuration(shiftData?.duration || 0)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-emerald-600">
                  ¥{shiftData?.totalRevenue.toFixed(0) || 0}
                </p>
                <p className="text-xs text-slate-500">营业额</p>
              </div>
            </div>

            {/* Revenue breakdown */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-1.5 mb-1">
                  <Package className="w-3.5 h-3.5 text-blue-500" />
                  <span className="text-xs text-slate-500">台球收入</span>
                </div>
                <p className="text-base font-bold">¥{shiftData?.tableRevenue.toFixed(0) || 0}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-1.5 mb-1">
                  <ShoppingCart className="w-3.5 h-3.5 text-orange-500" />
                  <span className="text-xs text-slate-500">商品收入</span>
                </div>
                <p className="text-base font-bold">¥{shiftData?.productRevenue.toFixed(0) || 0}</p>
              </div>
            </div>

            {/* Payment breakdown */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <p className="text-xs text-slate-500 mb-2">收款方式</p>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs">
                    <Banknote className="w-3.5 h-3.5 text-green-500" />
                    现金
                  </span>
                  <span className="text-sm font-medium">¥{shiftData?.cashRevenue.toFixed(0) || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs">
                    <CreditCard className="w-3.5 h-3.5 text-blue-500" />
                    电子支付
                  </span>
                  <span className="text-sm font-medium">¥{shiftData?.electronicRevenue.toFixed(0) || 0}</span>
                </div>
              </div>
            </div>

            {/* Pending items */}
            {shiftData && (shiftData.inUseTables.length > 0 || shiftData.pendingOrders > 0) && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
                <div className="flex items-center gap-1.5 mb-1">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-xs font-medium text-amber-700">待交接事项</span>
                </div>
                <div className="text-xs text-amber-600 space-y-0.5">
                  {shiftData.inUseTables.length > 0 && (
                    <p>• {shiftData.inUseTables.length} 张台球桌正在使用中</p>
                  )}
                  {shiftData.pendingOrders > 0 && (
                    <p>• {shiftData.pendingOrders} 个待处理订单</p>
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">现金实收</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="number"
                  placeholder="清点现金后输入"
                  value={closingCash}
                  onChange={(e) => setClosingCash(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            {closingCash && (
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">备用金</span>
                  <span>¥{currentShift.openingCash}</span>
                </div>
                <div className="flex items-center justify-between text-xs mt-1">
                  <span className="text-slate-500">现金收入</span>
                  <span>¥{shiftData?.cashRevenue.toFixed(0) || 0}</span>
                </div>
                <div className="flex items-center justify-between text-xs mt-1">
                  <span className="text-slate-500">实点现金</span>
                  <span className="font-medium">¥{closingCash}</span>
                </div>
                <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-200">
                  <span className="text-xs font-medium">长款/短款</span>
                  <span className={`text-sm font-bold ${cashDifference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {cashDifference >= 0 ? '+' : ''}¥{cashDifference.toFixed(0)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'end' && !currentShift && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Clock className="w-10 h-10 mb-3 text-slate-300" />
            <p className="text-sm text-slate-500">当前没有进行中的班次</p>
            <button
              onClick={() => setActiveTab('start')}
              className="mt-3 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-medium"
            >
              开始新班次
            </button>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-2">
            <p className="text-xs text-slate-500">最近7天班次记录</p>
            
            {[
              { date: '今天 22:00', operator: '张晓明', duration: 480, sales: 2850, cash: 980, diff: 0 },
              { date: '今天 14:30', operator: '李小红', duration: 450, sales: 1680, cash: 520, diff: -20 },
              { date: '昨天 22:00', operator: '张晓明', duration: 510, sales: 4200, cash: 1580, diff: 10 },
            ].map((record, index) => (
              <div
                key={index}
                className="p-3 rounded-lg bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium">{record.operator}</p>
                      <p className="text-xs text-slate-400">
                        {record.date} · {Math.floor(record.duration / 60)}小时{Math.floor(record.duration % 60)}分
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-600">¥{record.sales}</p>
                    <p className={`text-xs ${record.diff === 0 ? 'text-green-500' : record.diff > 0 ? 'text-amber-500' : 'text-red-500'}`}>
                      {record.diff === 0 ? '平账' : `${record.diff > 0 ? '+' : ''}${record.diff}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Banknote className="w-3 h-3" />
                    现金 ¥{record.cash}
                  </span>
                  <span className="flex items-center gap-1">
                    <CreditCard className="w-3 h-3" />
                    电子 ¥{record.sales - record.cash}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ModalContainer>
  );
}

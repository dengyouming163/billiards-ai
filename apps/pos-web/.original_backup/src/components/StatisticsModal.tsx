'use client';

import { useState, memo } from 'react';
import { X, TrendingUp, Users, DollarSign, Clock, Coffee, UserCheck, BarChart3, PieChart } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { mockDailyReport } from '@/data/mock-data';

interface StatisticsModalProps {
  onClose: () => void;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subValue?: string;
  color: string;
}

const StatCard = memo(function StatCard({ icon, label, value, subValue, color }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-xl ${color}`}>
          {icon}
        </div>
        <span className="text-sm text-slate-500">{label}</span>
      </div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      {subValue && <div className="text-xs text-slate-400 mt-1">{subValue}</div>}
    </div>
  );
});

export default function StatisticsModal({ onClose }: StatisticsModalProps) {
  const { state } = useApp();
  const [activeTab, setActiveTab] = useState<'summary' | 'tables' | 'products' | 'technicians'>('summary');

  const report = mockDailyReport;
  const { summary, timeSlots, paymentMethods, tables, technicians, topProducts } = report;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">经营统计</h2>
              <p className="text-white/80 text-sm">
                {new Date(report.date).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 py-3 border-b border-slate-100 flex gap-2">
          {[
            { key: 'summary', label: '营收概览', icon: <TrendingUp className="w-4 h-4" /> },
            { key: 'tables', label: '桌台明细', icon: <BarChart3 className="w-4 h-4" /> },
            { key: 'products', label: '商品销量', icon: <Coffee className="w-4 h-4" /> },
            { key: 'technicians', label: '助教业绩', icon: <UserCheck className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === tab.key
                  ? 'bg-indigo-500 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 180px)' }}>
          {activeTab === 'summary' && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                  icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
                  label="总营收"
                  value={formatCurrency(summary.totalRevenue)}
                  color="bg-emerald-50"
                />
                <StatCard
                  icon={<Clock className="w-5 h-5 text-blue-600" />}
                  label="台费收入"
                  value={formatCurrency(summary.tableRevenue)}
                  color="bg-blue-50"
                />
                <StatCard
                  icon={<Coffee className="w-5 h-5 text-amber-600" />}
                  label="商品收入"
                  value={formatCurrency(summary.productRevenue)}
                  color="bg-amber-50"
                />
                <StatCard
                  icon={<UserCheck className="w-5 h-5 text-purple-600" />}
                  label="助教收入"
                  value={formatCurrency(summary.assistantRevenue)}
                  color="bg-purple-50"
                />
              </div>

              {/* Secondary Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                  icon={<Users className="w-5 h-5 text-teal-600" />}
                  label="服务顾客"
                  value={`${summary.totalCustomers}人`}
                  color="bg-teal-50"
                />
                <StatCard
                  icon={<Clock className="w-5 h-5 text-rose-600" />}
                  label="平均台时"
                  value={`${Math.round(summary.avgTableDuration / 60)}小时`}
                  color="bg-rose-50"
                />
                <StatCard
                  icon={<PieChart className="w-5 h-5 text-indigo-600" />}
                  label="优惠金额"
                  value={formatCurrency(summary.discountAmount + summary.couponAmount)}
                  color="bg-indigo-50"
                />
                <StatCard
                  icon={<DollarSign className="w-5 h-5 text-orange-600" />}
                  label="会员充值"
                  value={formatCurrency(summary.memberRecharge)}
                  color="bg-orange-50"
                />
              </div>

              {/* Time Slots */}
              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-3">时段分布</h3>
                <div className="space-y-3">
                  {timeSlots.map((slot, index) => (
                    <div key={index} className="bg-slate-50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-slate-900">{slot.name}</span>
                        <span className="font-bold text-indigo-600">{formatCurrency(slot.totalRevenue)}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-xs text-slate-500">
                        <span>开台 {slot.openTables} 桌</span>
                        <span>台费 {formatCurrency(slot.tableRevenue)}</span>
                        <span>商品 {formatCurrency(slot.productRevenue)}</span>
                        <span>助教 {formatCurrency(slot.assistantRevenue)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Methods */}
              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-3">支付方式</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {paymentMethods.map((pm, index) => {
                    const methodLabels: Record<string, string> = {
                      wechat: '微信',
                      alipay: '支付宝',
                      cash: '现金',
                      member: '会员',
                      bankcard: '银行卡',
                    };
                    const methodColors: Record<string, string> = {
                      wechat: 'bg-emerald-500',
                      alipay: 'bg-blue-500',
                      cash: 'bg-amber-500',
                      member: 'bg-purple-500',
                      bankcard: 'bg-slate-500',
                    };
                    return (
                      <div key={index} className="bg-slate-50 rounded-xl p-3 text-center">
                        <div className={`inline-flex p-2 rounded-xl ${methodColors[pm.method] || 'bg-slate-400'} mb-2`}>
                          <DollarSign className="w-5 h-5 text-white" />
                        </div>
                        <div className="font-bold text-slate-900">{formatCurrency(pm.amount)}</div>
                        <div className="text-xs text-slate-500">{methodLabels[pm.method] || pm.method}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tables' && (
            <div className="space-y-3">
              {tables.map((t, index) => {
                const table = state.tables.find((tb) => tb.id === t.tableId);
                return (
                  <div key={index} className="bg-slate-50 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        table?.type === 'vip' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                        <BarChart3 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{t.tableName}</div>
                        <div className="text-xs text-slate-500">
                          开台 {t.openCount} 次 | 时长 {Math.round(t.totalDuration / 60)} 小时
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-emerald-600">{formatCurrency(t.revenue)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'products' && (
            <div className="space-y-3">
              {topProducts.map((p, index) => (
                <div key={index} className="bg-slate-50 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      index === 0 ? 'bg-amber-100 text-amber-600' :
                      index === 1 ? 'bg-slate-200 text-slate-600' :
                      index === 2 ? 'bg-orange-100 text-orange-600' :
                      'bg-slate-100 text-slate-500'
                    }`}>
                      <span className="font-bold text-sm">{index + 1}</span>
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{p.name}</div>
                      <div className="text-xs text-slate-500">销量 {p.quantity} 份</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-emerald-600">{formatCurrency(p.revenue)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'technicians' && (
            <div className="space-y-3">
              {technicians.map((t, index) => (
                <div key={index} className="bg-slate-50 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{t.name}</div>
                      <div className="text-xs text-slate-500">
                        服务 {t.serviceCount} 次 | 提成 {formatCurrency(t.commission)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-purple-600">{formatCurrency(t.revenue)}</div>
                    <div className="text-xs text-emerald-600">+{formatCurrency(t.commission)} 提成</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
